import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
// @ts-expect-error — getReactNativePersistence exists at runtime in the RN bundle
// but isn't included in firebase's published type definitions (firebase-js-sdk#9316).
import { getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.warn(
    '[firebase] Missing config. Copy .env.example to .env and fill in your Firebase project values.'
  );
}

// Avoid re-initializing on fast refresh / multiple imports.
export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// App Check attests that traffic comes from this real app rather than a script
// replaying the public API key.
//
// Web only, deliberately: the firebase JS SDK ships reCAPTCHA-based providers,
// which need a browser. Native iOS/Android attestation (DeviceCheck /
// Play Integrity) is not available through the JS SDK, so on native this is a
// no-op and App Check enforcement must stay off until the app moves to a
// native Firebase module or a custom provider.
const appCheckSiteKey = process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY;

if (Platform.OS === 'web' && appCheckSiteKey) {
  if (__DEV__) {
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
    console.warn('[firebase] App Check initialization skipped:', err);
  }
}

export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);

// On native (iOS/Android via Metro), Auth state must be persisted explicitly
// through AsyncStorage or it resets on every app restart. Web uses the
// default browser persistence via getAuth().
function createAuth(): Auth {
  if (Platform.OS === 'web') {
    return getAuth(firebaseApp);
  }
  try {
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // initializeAuth throws if already called (e.g. fast refresh) — fall back to existing instance.
    return getAuth(firebaseApp);
  }
}

export const auth = createAuth();
