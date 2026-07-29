import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.warn(
    '[firebase] Missing config. Copy .env.example to .env and fill in your Firebase project values ' +
      '(must match the Buyer App project).'
  );
}

// Avoid re-initializing on HMR / multiple imports.
export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// App Check attests that traffic comes from this real app, not a script holding
// the (publicly visible) API key. Only initialized when a site key is present,
// so local dev and CI keep working without one.
//
// Setup: Firebase Console -> App Check -> register this web app with reCAPTCHA v3,
// then put the site key in VITE_RECAPTCHA_SITE_KEY. Leave enforcement OFF until
// the Console shows verified requests arriving, otherwise you lock yourself out.
const appCheckSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

if (appCheckSiteKey) {
  if (import.meta.env.DEV) {
    // Lets localhost obtain a debug token; register the value it logs under
    // App Check -> Manage debug tokens.
    (
      globalThis as typeof globalThis & { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }
    ).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  try {
    initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaV3Provider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (err) {
    // Already initialized (HMR) or the key is malformed — never block app boot.
    console.warn('[firebase] App Check initialization skipped:', err);
  }
} else if (import.meta.env.PROD) {
  console.warn(
    '[firebase] VITE_RECAPTCHA_SITE_KEY is not set — this production build has no App Check protection.'
  );
}

export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);
export const storage = getStorage(firebaseApp);
