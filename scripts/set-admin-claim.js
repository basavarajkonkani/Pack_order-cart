/**
 * Grants or revokes the `admin` custom claim on a Firebase Auth account.
 *
 * Why this exists: firestore.rules / storage.rules used to decide admin access
 * by reading users/{uid}.role, which costs one extra billed Firestore read on
 * every single rule evaluation. A custom claim rides along inside the user's ID
 * token instead, so the rules can check it for free.
 *
 * Usage:
 *   export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/serviceAccountKey.json
 *   node scripts/set-admin-claim.js admin@example.com
 *   node scripts/set-admin-claim.js admin@example.com --revoke
 *
 * Get the service account key from:
 *   Firebase Console -> Project settings -> Service accounts -> Generate new private key
 *
 * The key is a real secret. Keep it outside the repo, never commit it.
 *
 * The claim only lands in the token after it refreshes, so the admin must sign
 * out and back in (or wait up to an hour) before the new access takes effect.
 */

const admin = require('firebase-admin');

function parseArgs(argv) {
  const args = argv.slice(2);
  const revoke = args.includes('--revoke');
  const check = args.includes('--check');
  const email = args.find((a) => !a.startsWith('--'));
  return { email, revoke, check };
}

function assertCredentials() {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error(
      'Missing GOOGLE_APPLICATION_CREDENTIALS.\n' +
        'Download a service account key from Firebase Console -> Project settings ->\n' +
        'Service accounts -> Generate new private key, then:\n\n' +
        '  export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/serviceAccountKey.json\n'
    );
    process.exit(1);
  }
}

async function main() {
  const { email, revoke, check } = parseArgs(process.argv);

  if (!email) {
    console.error('Usage: node scripts/set-admin-claim.js <email> [--revoke] [--check]');
    process.exit(1);
  }

  assertCredentials();

  // applicationDefault() lives on admin.credential, not on the admin namespace
  // itself. Reads the key path from GOOGLE_APPLICATION_CREDENTIALS.
  admin.initializeApp({ credential: admin.credential.applicationDefault() });

  const user = await admin.auth().getUserByEmail(email);

  // Read-only mode: report what the token and the profile doc each say, so a
  // mismatch between them is easy to spot.
  if (check) {
    const claims = user.customClaims || {};
    const snap = await admin.firestore().collection('users').doc(user.uid).get();
    const roleField = snap.exists ? snap.get('role') : '(no users doc)';
    console.log(`uid:          ${user.uid}`);
    console.log(`admin claim:  ${claims.admin === true}`);
    console.log(`users.role:   ${roleField}`);
    if ((claims.admin === true) !== (roleField === 'admin')) {
      console.log(
        '\nThese disagree. The rules trust the claim first, so the claim is what governs access.'
      );
    }
    process.exit(0);
  }

  // Merge rather than replace: overwriting customUserClaims wholesale would
  // silently drop any other claim the project sets later.
  const existing = user.customClaims || {};
  const claims = { ...existing };
  if (revoke) {
    delete claims.admin;
  } else {
    claims.admin = true;
  }

  await admin.auth().setCustomUserClaims(user.uid, claims);

  // Keep users/{uid}.role in sync. The Admin Portal reads `role` to decide what
  // to render, and the rules still fall back to it during migration, so the two
  // must not drift apart.
  await admin
    .firestore()
    .collection('users')
    .doc(user.uid)
    .set({ role: revoke ? 'customer' : 'admin' }, { merge: true });

  console.log(
    `${revoke ? 'Revoked' : 'Granted'} admin for ${email} (uid: ${user.uid}).\n` +
      'They must sign out and back in for the new token to take effect.'
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to update admin claim:', err.message || err);
  process.exit(1);
});
