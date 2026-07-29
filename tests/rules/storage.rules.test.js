/**
 * Storage security rules tests.
 *
 * Run with:  pnpm test:rules
 *
 * These cover the production fix: the admin portal uploads catalog media to
 * products/images, products/videos and categories/images, all of which the old
 * catch-all `allow read, write: if false` silently denied. They also pin the
 * create/update vs delete split — request.resource is null on a delete, so a
 * combined rule with a size check would break deleteFileByUrl().
 */

const { before, after, beforeEach, describe, it } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require('@firebase/rules-unit-testing');
const { ref, uploadBytes, getBytes, deleteObject } = require('firebase/storage');

const BUYER = 'buyer-uid-1';
const OTHER_BUYER = 'buyer-uid-2';
const ADMIN = 'admin-uid-1';

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
const IMAGE_META = { contentType: 'image/png' };
const VIDEO_META = { contentType: 'video/mp4' };

let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'shop-cart-flow-rules-test',
    storage: {
      rules: fs.readFileSync(path.resolve(__dirname, '../../storage.rules'), 'utf8'),
    },
    firestore: {
      // storage.rules calls firestore.get() for the admin role fallback, so the
      // Firestore emulator has to be present and seeded too.
      rules: fs.readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf8'),
    },
  });
});

after(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearStorage();
  await testEnv.clearFirestore();
  const { doc, setDoc } = require('firebase/firestore');
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users', BUYER), { role: 'customer' });
    await setDoc(doc(db, 'users', ADMIN), { role: 'admin' });
    // Seed one product image so read/delete paths have something to act on.
    const storage = ctx.storage();
    await uploadBytes(ref(storage, 'products/images/p1-1.png'), PNG, IMAGE_META);
  });
});

const buyerStorage = () => testEnv.authenticatedContext(BUYER).storage();
const adminClaimStorage = () => testEnv.authenticatedContext(ADMIN, { admin: true }).storage();
const adminRoleDocStorage = () => testEnv.authenticatedContext(ADMIN).storage();
const anonStorage = () => testEnv.unauthenticatedContext().storage();

describe('catalog media (the upload path that was silently denied)', () => {
  it('lets an admin with the claim upload a product image', async () => {
    await assertSucceeds(
      uploadBytes(ref(adminClaimStorage(), 'products/images/p2-1.png'), PNG, IMAGE_META)
    );
  });

  // Skipped because of a tooling limitation, not a rules problem: cross-service
  // firestore.get() / firestore.exists() calls from Storage rules are not
  // evaluated under @firebase/rules-unit-testing, so the fallback always reads
  // as false here. See https://github.com/firebase/firebase-js-sdk/issues/6803
  //
  // The claim-based path above is the production path and is covered. This
  // fallback exists only to keep pre-migration admins working and should be
  // deleted from storage.rules once every admin has the claim, at which point
  // this test can go too. Until then, verify it by hand in the Rules Playground.
  it.skip('lets an admin identified only by role doc upload (migration fallback)', async () => {
    await assertSucceeds(
      uploadBytes(ref(adminRoleDocStorage(), 'products/images/p3-1.png'), PNG, IMAGE_META)
    );
  });

  it('lets an admin upload a category image', async () => {
    await assertSucceeds(
      uploadBytes(ref(adminClaimStorage(), 'categories/images/c1-1.png'), PNG, IMAGE_META)
    );
  });

  it('lets an admin upload a product video', async () => {
    await assertSucceeds(
      uploadBytes(ref(adminClaimStorage(), 'products/videos/p1-1.mp4'), PNG, VIDEO_META)
    );
  });

  it('stops a buyer uploading catalog media', async () => {
    await assertFails(
      uploadBytes(ref(buyerStorage(), 'products/images/evil.png'), PNG, IMAGE_META)
    );
  });

  it('rejects a non-image content type on an image path', async () => {
    await assertFails(
      uploadBytes(ref(adminClaimStorage(), 'products/images/p4-1.png'), PNG, {
        contentType: 'application/pdf',
      })
    );
  });

  it('serves catalog images publicly, since the buyer catalog is public', async () => {
    await assertSucceeds(getBytes(ref(anonStorage(), 'products/images/p1-1.png')));
  });

  // Guards the create/update vs delete split.
  it('lets an admin delete a product image', async () => {
    await assertSucceeds(deleteObject(ref(adminClaimStorage(), 'products/images/p1-1.png')));
  });

  it('stops a buyer deleting a product image', async () => {
    await assertFails(deleteObject(ref(buyerStorage(), 'products/images/p1-1.png')));
  });
});

describe('buyer artwork', () => {
  it('lets a buyer upload into their own folder', async () => {
    await assertSucceeds(
      uploadBytes(ref(buyerStorage(), `artwork/${BUYER}/design.png`), PNG, IMAGE_META)
    );
  });

  it("stops a buyer uploading into another buyer's folder", async () => {
    await assertFails(
      uploadBytes(ref(buyerStorage(), `artwork/${OTHER_BUYER}/design.png`), PNG, IMAGE_META)
    );
  });

  it('lets an admin read buyer artwork to send it to production', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await uploadBytes(ref(ctx.storage(), `artwork/${BUYER}/a.png`), PNG, IMAGE_META);
    });
    await assertSucceeds(getBytes(ref(adminClaimStorage(), `artwork/${BUYER}/a.png`)));
  });

  it('keeps buyer artwork private from other buyers', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await uploadBytes(ref(ctx.storage(), `artwork/${BUYER}/b.png`), PNG, IMAGE_META);
    });
    await assertFails(
      getBytes(ref(testEnv.authenticatedContext(OTHER_BUYER).storage(), `artwork/${BUYER}/b.png`))
    );
  });

  it('keeps buyer artwork private from signed-out visitors', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await uploadBytes(ref(ctx.storage(), `artwork/${BUYER}/c.png`), PNG, IMAGE_META);
    });
    await assertFails(getBytes(ref(anonStorage(), `artwork/${BUYER}/c.png`)));
  });
});

describe('default deny', () => {
  it('rejects writes to unmapped paths', async () => {
    await assertFails(
      uploadBytes(ref(adminClaimStorage(), 'random/whatever.png'), PNG, IMAGE_META)
    );
  });
});
