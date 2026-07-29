/**
 * End-to-end Phone OTP flow check against the Auth + Firestore emulators, with
 * the real firestore.rules loaded, so every Firestore call below is
 * rule-enforced.
 *
 * Run:
 *   firebase emulators:exec --only auth,firestore --project shop-cart-flow-rules-test \
 *     "node tests/flows/phone-otp-flow.mjs"
 *
 * Two things can't run in Node and are reproduced rather than imported:
 *   - lib/phoneAuth.ts imports react-native's Platform and RecaptchaVerifier.
 *   - The Node build of firebase/auth ships PhoneAuthProvider as a stub with no
 *     static credential(), so linkWithCredential/signInWithCredential can't be
 *     handed a phone credential here. The credential steps therefore call
 *     accounts:signInWithPhoneNumber directly, which is the same endpoint the
 *     browser SDK calls underneath: with an idToken it links, without one it
 *     signs in. That is exactly the link-then-fallback branch in confirmOtp().
 *
 * Everything else (anonymous sign-in, profile writes, cart sync, order
 * placement) goes through the real SDK against the real rules.
 */
import assert from 'node:assert/strict';
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInAnonymously } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

const PROJECT = 'shop-cart-flow-rules-test';
const AUTH_HOST = '127.0.0.1:9099';
const IDT = `http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1`;
const PHONE = '+919876543210';
const TEN_DIGIT = '9876543210';

const results = [];
function record(name, fn) {
  return (async () => {
    try {
      await fn();
      results.push(['PASS', name]);
    } catch (err) {
      results.push(['FAIL', `${name} -> ${(err.message || String(err)).split('\n')[0]}`]);
    }
  })();
}
async function denied(label, fn) {
  try {
    await fn();
  } catch (err) {
    if (err.code === 'permission-denied') return;
    throw err;
  }
  throw new Error(`${label} was ALLOWED but must be denied`);
}

function session(name) {
  const app = initializeApp(
    { apiKey: 'fake-api-key', authDomain: 'localhost', projectId: PROJECT },
    name
  );
  const auth = getAuth(app);
  connectAuthEmulator(auth, `http://${AUTH_HOST}`, { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  return { auth, db };
}

async function idt(path, body) {
  const res = await fetch(`${IDT}/accounts:${path}?key=fake-api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, body: await res.json() };
}

/** Requests an OTP and reads the issued code back out of the emulator. */
async function sendOtp(phone) {
  const { ok, body } = await idt('sendVerificationCode', {
    phoneNumber: phone,
    recaptchaToken: 'ignored-by-emulator',
  });
  if (!ok) throw new Error(`sendVerificationCode failed: ${JSON.stringify(body)}`);
  const codes = await (
    await fetch(`http://${AUTH_HOST}/emulator/v1/projects/${PROJECT}/verificationCodes`)
  ).json();
  const entry = [...codes.verificationCodes].reverse().find((c) => c.phoneNumber === phone);
  if (!entry) throw new Error('no verification code was issued');
  return { sessionInfo: body.sessionInfo, code: entry.code };
}

/**
 * Mirror of AuthContext.verifyPhoneOtp()'s profile write: phone only on an
 * existing doc, full doc (with role) on first creation.
 */
async function writePhoneToProfile(db, uid, tenDigit) {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    await setDoc(userRef, { phone: tenDigit }, { merge: true });
  } else {
    await setDoc(userRef, { phone: tenDigit, role: 'customer', createdAt: serverTimestamp() });
  }
}

/** Seeds a doc through the emulator's owner endpoint, bypassing rules. */
async function seedAsOwner(path, fields) {
  const res = await fetch(
    `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents/${path}`,
    {
      method: 'PATCH',
      headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    }
  );
  if (!res.ok) throw new Error(`seed failed: ${await res.text()}`);
}

const linkPhone = (sessionInfo, code, idToken) =>
  idt('signInWithPhoneNumber', { sessionInfo, code, idToken });
const signInPhone = (sessionInfo, code) => idt('signInWithPhoneNumber', { sessionInfo, code });

function decodeJwt(token) {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
}

const CART = [{ id: 'i1', name: 'Kraft pouch 500g', price: 1250.5, quantity: 100, kind: 'stock' }];

// ------------------------------------------------------------- guest session
const guest = session('guest');
let guestUid;

await record('anonymous sign-in gives the guest a real uid', async () => {
  const cred = await signInAnonymously(guest.auth);
  guestUid = cred.user.uid;
  assert.equal(cred.user.isAnonymous, true);
});

await record('guest can create their own profile doc (role: customer)', () =>
  setDoc(doc(guest.db, 'users', guestUid), { role: 'customer', createdAt: serverTimestamp() }));

await record('guest cart is saved to carts/{uid}', async () => {
  await setDoc(doc(guest.db, 'carts', guestUid), { items: CART });
  assert.equal((await getDoc(doc(guest.db, 'carts', guestUid))).data().items.length, 1);
});

// ---------------------------------------------------------------- OTP + link
await record('OTP is issued for a valid Indian number', async () => {
  const { code } = await sendOtp(PHONE);
  assert.match(code, /^\d{6}$/);
});

await record('a wrong OTP is rejected', async () => {
  const { sessionInfo, code } = await sendOtp(PHONE);
  const wrong = code === '123456' ? '654321' : '123456';
  const { ok, body } = await linkPhone(sessionInfo, wrong, await guest.auth.currentUser.getIdToken());
  assert.equal(ok, false, 'a wrong code must not be accepted');
  assert.match(JSON.stringify(body), /INVALID_CODE/);
});

let linkedToken;
await record('correct OTP links the phone onto the SAME uid', async () => {
  const { sessionInfo, code } = await sendOtp(PHONE);
  const { ok, body } = await linkPhone(sessionInfo, code, await guest.auth.currentUser.getIdToken());
  assert.equal(ok, true, `link failed: ${JSON.stringify(body)}`);
  assert.equal(body.localId, guestUid, 'uid changed — guest cart and orders would be orphaned');
  linkedToken = body.idToken;
});

await record('the upgraded token is a phone session, not an anonymous one', async () => {
  const claims = decodeJwt(linkedToken);
  assert.equal(claims.sub, guestUid);
  assert.equal(claims.firebase.sign_in_provider, 'phone');
  assert.equal(claims.phone_number, PHONE);
});

await record('the account is no longer anonymous server-side', async () => {
  const { body } = await idt('lookup', { idToken: linkedToken });
  const u = body.users[0];
  assert.equal(u.phoneNumber, PHONE);
  assert.ok(
    u.providerUserInfo.some((p) => p.providerId === 'phone'),
    'phone provider should be attached to the account'
  );
});

await record('phone number is written onto the profile after linking', async () => {
  await writePhoneToProfile(guest.db, guestUid, TEN_DIGIT);
  const p = (await getDoc(doc(guest.db, 'users', guestUid))).data();
  assert.equal(p.phone, TEN_DIGIT);
  assert.equal(p.role, 'customer');
});

await record('cart survives the upgrade and is still writable', async () => {
  const snap = await getDoc(doc(guest.db, 'carts', guestUid));
  assert.equal(snap.data().items[0].name, 'Kraft pouch 500g');
  await setDoc(doc(guest.db, 'carts', guestUid), { items: [...CART, { ...CART[0], id: 'i2' }] });
  assert.equal((await getDoc(doc(guest.db, 'carts', guestUid))).data().items.length, 2);
});

// ----------------------------------------------------------- order placement
const ORDER_ID = 'order-e2e-1';
await record('verified buyer can place an order', () =>
  setDoc(doc(guest.db, 'orders', ORDER_ID), {
    id: ORDER_ID,
    orderId: 'PCH1234',
    items: CART,
    total: 1250.5,
    address: '1 Test Street',
    gstNumber: '',
    paymentMethod: 'cod',
    createdAt: new Date().toISOString(),
    status: 'confirmed',
    userId: guestUid,
  }));

await record('buyer can read their own order back', async () => {
  assert.equal((await getDoc(doc(guest.db, 'orders', ORDER_ID))).data().status, 'confirmed');
});

await record('buyer CANNOT update their own order', () =>
  denied('order update', () => updateDoc(doc(guest.db, 'orders', ORDER_ID), { status: 'delivered' })));

await record('buyer CANNOT delete their own order', () =>
  denied('order delete', () => deleteDoc(doc(guest.db, 'orders', ORDER_ID))));

await record('buyer CANNOT place an order that skips ahead of confirmed', () =>
  denied('order create with status=delivered', () =>
    setDoc(doc(guest.db, 'orders', 'order-e2e-forged'), {
      items: CART, total: 1, status: 'delivered', userId: guestUid,
    })));

await record('buyer CANNOT place an order under another uid', () =>
  denied('order create with foreign userId', () =>
    setDoc(doc(guest.db, 'orders', 'order-e2e-foreign'), {
      items: CART, total: 1, status: 'confirmed', userId: 'someoneElse',
    })));

await record('buyer CANNOT self-promote to admin', () =>
  denied('role escalation', () =>
    setDoc(doc(guest.db, 'users', guestUid), { role: 'admin' }, { merge: true })));

// -------------------------------- role is never overwritten by verification
const adminSession = session('adminAccount');

await record('phone verification does NOT demote an existing admin', async () => {
  const { user } = await signInAnonymously(adminSession.auth);
  await seedAsOwner(`users/${user.uid}`, {
    role: { stringValue: 'admin' },
    createdAt: { timestampValue: '2020-01-01T00:00:00Z' },
  });

  await writePhoneToProfile(adminSession.db, user.uid, '9000000001');

  const p = (await getDoc(doc(adminSession.db, 'users', user.uid))).data();
  assert.equal(p.role, 'admin', 'admin was demoted by phone verification');
  assert.equal(p.phone, '9000000001', 'phone number should still be recorded');
  assert.equal(p.createdAt.toDate().getUTCFullYear(), 2020, 'original createdAt should survive');
});

await record('phone verification on a brand-new account still sets role: customer', async () => {
  const fresh = session('freshAccount');
  const { user } = await signInAnonymously(fresh.auth);
  await writePhoneToProfile(fresh.db, user.uid, '9000000002');

  const p = (await getDoc(doc(fresh.db, 'users', user.uid))).data();
  assert.equal(p.role, 'customer');
  assert.equal(p.phone, '9000000002');
  assert.ok(p.createdAt, 'a new profile should get createdAt');
});

// ------------------------------------------ second guest, number already used
const guest2 = session('guest2');
let guest2Uid;

await record('a second guest can build a cart as a guest', async () => {
  const cred = await signInAnonymously(guest2.auth);
  guest2Uid = cred.user.uid;
  await setDoc(doc(guest2.db, 'carts', guest2Uid), { items: [{ ...CART[0], id: 'orphan' }] });
});

await record('linking a number that already has an account is refused', async () => {
  const { sessionInfo, code } = await sendOtp(PHONE);
  const { body } = await linkPhone(sessionInfo, code, await guest2.auth.currentUser.getIdToken());
  // Identity Toolkit reports "this number belongs to someone else" as a 200
  // carrying temporaryProof and no idToken. The SDK converts exactly that shape
  // into auth/credential-already-in-use, which is the error confirmOtp catches
  // before falling back to signInWithCredential.
  assert.ok(body.temporaryProof, `expected temporaryProof, got ${JSON.stringify(body).slice(0, 200)}`);
  assert.equal(body.idToken, undefined, 'the second account must not receive a session');
  const { body: check } = await idt('lookup', { idToken: await guest2.auth.currentUser.getIdToken() });
  assert.equal(check.users[0].phoneNumber, undefined, 'the number must not move to the second account');
});

await record('the fallback signs in to the ORIGINAL account instead', async () => {
  const { sessionInfo, code } = await sendOtp(PHONE);
  const { ok, body } = await signInPhone(sessionInfo, code);
  assert.equal(ok, true, `phone sign-in failed: ${JSON.stringify(body)}`);
  assert.equal(body.localId, guestUid, 'should land on the account that owns the number');
  assert.notEqual(body.localId, guest2Uid);
});

await record('after the fallback the buyer sees the original cart, not the guest one', async () => {
  const snap = await getDoc(doc(guest.db, 'carts', guestUid));
  assert.equal(snap.data().items.length, 2);
  assert.ok(!snap.data().items.some((i) => i.id === 'orphan'), 'guest-2 items must not appear');
});

await record('the abandoned guest cart is unreachable from the signed-in account', () =>
  denied('reading another uid\'s cart', () => getDoc(doc(guest.db, 'carts', guest2Uid))));

// ---------------------------------------------------------------------- report
let failed = 0;
for (const [state, name] of results) {
  if (state === 'FAIL') failed++;
  console.log(`${state}  ${name}`);
}
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
