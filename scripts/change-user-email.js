/**
 * Changes the email address on a Firebase Auth account, keeping the same uid.
 *
 * Why the uid matters: the `admin` custom claim, users/{uid}, orders, wishlists
 * and Storage paths are all keyed by uid, not by email. Editing the email in
 * place therefore preserves every one of those links. Deleting and recreating
 * the account would orphan all of it.
 *
 * The password is NOT touched — the account signs in with the new email and the
 * old password. Password resets go to whatever address is set here, because
 * Firebase always mails the reset link to the account's own email.
 *
 * Usage:
 *   export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/serviceAccountKey.json
 *   node scripts/change-user-email.js <oldEmail> <newEmail>
 *   node scripts/change-user-email.js <oldEmail> <newEmail> --send-reset
 *
 * --send-reset prints a password reset link for the new address, useful when
 * handing the account to someone who should pick their own password.
 *
 * After this runs the old address can no longer sign in. Existing browser
 * sessions are revoked, so every device must sign in again.
 */

const admin = require('firebase-admin');

function parseArgs(argv) {
  const args = argv.slice(2);
  const sendReset = args.includes('--send-reset');
  const [oldEmail, newEmail] = args.filter((a) => !a.startsWith('--'));
  return { oldEmail, newEmail, sendReset };
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
  const { oldEmail, newEmail, sendReset } = parseArgs(process.argv);

  if (!oldEmail || !newEmail) {
    console.error('Usage: node scripts/change-user-email.js <oldEmail> <newEmail> [--send-reset]');
    process.exit(1);
  }

  assertCredentials();
  admin.initializeApp({ credential: admin.credential.applicationDefault() });

  const user = await admin.auth().getUserByEmail(oldEmail);

  // Fail early rather than letting updateUser throw email-already-exists after
  // we have already reported the old account's details.
  let taken = false;
  try {
    await admin.auth().getUserByEmail(newEmail);
    taken = true;
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
  }
  if (taken) {
    console.error(`${newEmail} is already registered. Pick a different address or delete that account first.`);
    process.exit(1);
  }

  await admin.auth().updateUser(user.uid, {
    email: newEmail,
    // The new address is unproven, so don't inherit the old verified flag.
    emailVerified: false,
  });

  // users/{uid}.email is a denormalized copy the apps display; leaving it stale
  // would show the old address all over the UI.
  await admin.firestore().collection('users').doc(user.uid).set({ email: newEmail }, { merge: true });

  // Any ID token minted before the change still carries the old email, so drop
  // them and force a fresh sign-in everywhere.
  await admin.auth().revokeRefreshTokens(user.uid);

  console.log(`Email changed for uid ${user.uid}`);
  console.log(`  was: ${oldEmail}`);
  console.log(`  now: ${newEmail}`);
  console.log(`  admin claim preserved: ${user.customClaims?.admin === true}`);
  console.log('\nThe password is unchanged. All existing sessions were signed out.');

  if (sendReset) {
    const link = await admin.auth().generatePasswordResetLink(newEmail);
    console.log(`\nPassword reset link for ${newEmail}:\n${link}`);
    console.log('This link is single-use and expires. Send it over a private channel.');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to change email:', err.message || err);
  process.exit(1);
});
