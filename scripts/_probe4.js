const fs = require('fs');
const path = require('path');
const LOG = '/tmp/probe4.log';
fs.writeFileSync(LOG, '');
function log(s) { fs.appendFileSync(LOG, s + '\n'); }

function loadEnvFile() {
  const envPath = path.resolve(__dirname, '..', '.env');
  const contents = fs.readFileSync(envPath, 'utf-8');
  for (const line of contents.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvFile();
log('env loaded');

const { initializeApp } = require('firebase/app');
const { getAuth, signInAnonymously } = require('firebase/auth');
log('imports done');

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
};

const appA = initializeApp(firebaseConfig, 'probeA');
const appB = initializeApp(firebaseConfig, 'probeB');
log('apps created');
const authA = getAuth(appA);
const authB = getAuth(appB);
log('auth instances created');

Promise.all([signInAnonymously(authA), signInAnonymously(authB)])
  .then(([credA, credB]) => {
    log('signed in A: ' + credA.user.uid);
    log('signed in B: ' + credB.user.uid);
    process.exit(0);
  })
  .catch((err) => {
    log('ERROR: ' + err.stack);
    process.exit(1);
  });

setTimeout(() => { log('TIMEOUT after 10s'); process.exit(2); }, 10000);
