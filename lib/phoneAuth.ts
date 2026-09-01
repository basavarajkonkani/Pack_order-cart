import { Platform } from 'react-native';
import {
  PhoneAuthProvider,
  RecaptchaVerifier,
  linkWithCredential,
  signInWithCredential,
  signInWithPhoneNumber,
  signOut,
  type AuthCredential,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

/**
 * Real Firebase phone (OTP) authentication.
 *
 * PLATFORM LIMIT — read before shipping to native:
 * The firebase JS SDK exports RecaptchaVerifier from its React Native entry
 * point, so this file type-checks on native, but the implementation resolves to
 * `platform_browser/recaptcha/...` and needs a real `document`. Constructing it
 * under Metro throws at runtime. There is no reCAPTCHA-free phone auth path in
 * the JS SDK (expo-firebase-recaptcha, the old workaround, was removed in Expo
 * SDK 48).
 *
 * So phone auth here works on web only. Native needs one of:
 *   - @react-native-firebase/auth via an Expo config plugin (needs prebuild +
 *     a dev client, so Expo Go stops working), or
 *   - a WebView that hosts the reCAPTCHA challenge and passes the token back.
 *
 * isPhoneAuthAvailable() lets callers degrade gracefully instead of crashing.
 */

const RECAPTCHA_CONTAINER_PREFIX = 'firebase-recaptcha-container';

export function isPhoneAuthAvailable(): boolean {
  return Platform.OS === 'web';
}

export class PhoneAuthUnavailableError extends Error {
  constructor() {
    super('Phone verification is only available on the web build of this app.');
    this.name = 'PhoneAuthUnavailableError';
  }
}

/** Converts a 10-digit Indian mobile number into the E.164 form Firebase requires. */
export function toE164(tenDigitNumber: string, countryCode = '91'): string {
  const digits = tenDigitNumber.replace(/\D/g, '');
  return `+${countryCode}${digits}`;
}

let verifier: RecaptchaVerifier | null = null;
let containerId: string | null = null;
let containerSeq = 0;

/**
 * Builds a fresh invisible reCAPTCHA verifier on a brand-new host element.
 *
 * Every call gets its own uniquely-suffixed container. reCAPTCHA refuses to
 * render twice into the same element ("reCAPTCHA has already been rendered in
 * this element"), and verifier.clear() does not reliably leave the node in a
 * re-renderable state. Sharing one container across attempts is what broke the
 * second OTP in a session: the first send worked, and every later send threw
 * before reaching Firebase, surfacing as the generic "something went wrong".
 * A disposable container sidesteps that entirely.
 */
function createVerifier(): RecaptchaVerifier {
  containerId = `${RECAPTCHA_CONTAINER_PREFIX}-${containerSeq++}`;

  const el = document.createElement('div');
  el.id = containerId;
  // Invisible flow still needs the node attached to the document.
  el.style.display = 'none';
  document.body.appendChild(el);

  verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
  });
  return verifier;
}

/**
 * Tears the verifier down so the next attempt starts from a clean challenge.
 * Removes the host element too — leaving it behind is what poisoned the next
 * render. Safe to call repeatedly and when nothing was ever created.
 */
export function resetPhoneAuth(): void {
  try {
    verifier?.clear();
  } catch {
    // Already cleared or never rendered — nothing to do.
  }
  if (containerId && typeof document !== 'undefined') {
    document.getElementById(containerId)?.remove();
  }
  verifier = null;
  containerId = null;
}

/**
 * Sends an OTP and returns the verificationId needed to build the credential.
 *
 * Returning the id rather than the whole ConfirmationResult is deliberate:
 * ConfirmationResult.confirm() calls signInWithCredential internally, which
 * would REPLACE the current anonymous user and orphan their cart and orders.
 * We need the raw credential so we can link instead. See confirmOtp below.
 */
export async function sendOtp(phoneE164: string): Promise<string> {
  if (!isPhoneAuthAvailable()) throw new PhoneAuthUnavailableError();

  // Always start from a clean challenge. A reCAPTCHA token is single-use, so any
  // verifier left over from an earlier send (successful or not) is already spent
  // and would fail. Callers shouldn't have to remember to reset first.
  resetPhoneAuth();

  let confirmation;
  try {
    const freshVerifier = createVerifier();
    confirmation = await signInWithPhoneNumber(auth, phoneE164, freshVerifier);
    
    console.log('[phoneAuth] OTP sent successfully, verificationId:', confirmation.verificationId.substring(0, 20) + '...');
    
    // Keep the verifier intact after successful send - it needs to remain
    // for the verification to work properly
    return confirmation.verificationId;
  } catch (err) {
    console.error('[phoneAuth] Failed to send OTP:', err);
    // A failed attempt leaves the challenge in a spent state; without this the
    // retry fails with the same error regardless of what the user changes.
    resetPhoneAuth();
    throw err;
  }
}

export interface ConfirmOtpResult {
  /**
   * True when the phone number was linked onto the existing anonymous account,
   * so the guest's cart, orders and saved addresses carried over.
   *
   * False when the number already belonged to another account. Firebase can't
   * merge two accounts, so we sign into the existing one and the guest session's
   * local data is left behind. Callers should tell the user.
   */
  preservedGuestData: boolean;
}

/**
 * Verifies the OTP and attaches the phone number to the signed-in user.
 *
 * Upgrade path, in order of preference:
 *   1. Current user is anonymous -> linkWithCredential, keeping the same UID so
 *      every order and address written as a guest stays reachable.
 *   2. That phone already has an account -> signInWithCredential as a fallback.
 *      The UID changes and guest data does not follow.
 */
export async function confirmOtp(verificationId: string, code: string): Promise<ConfirmOtpResult> {
  if (!isPhoneAuthAvailable()) throw new PhoneAuthUnavailableError();

  console.log('[phoneAuth] Starting OTP confirmation');
  console.log('[phoneAuth] verificationId exists:', !!verificationId, 'length:', verificationId?.length || 0);
  console.log('[phoneAuth] code:', code, 'length:', code?.length || 0);

  // Validate inputs before attempting Firebase call
  if (!verificationId || verificationId.trim() === '') {
    console.error('[phoneAuth] Invalid verificationId');
    const err = new Error('Invalid verification session');
    (err as any).code = 'auth/invalid-verification-id';
    throw err;
  }
  
  if (!code || code.trim() === '' || code.length !== 6) {
    console.error('[phoneAuth] Invalid code');
    const err = new Error('Invalid verification code');
    (err as any).code = 'auth/invalid-verification-code';
    throw err;
  }

  // Create credential - this doesn't validate with Firebase yet
  const credential: AuthCredential = PhoneAuthProvider.credential(verificationId, code);
  console.log('[phoneAuth] Credential object created');
  
  const current = auth.currentUser;
  console.log('[phoneAuth] Current user UID:', current?.uid, 'isAnonymous:', current?.isAnonymous);

  // The actual Firebase network call happens here when we use the credential
  if (current?.isAnonymous) {
    try {
      console.log('[phoneAuth] Attempting linkWithCredential...');
      const result = await linkWithCredential(current, credential);
      console.log('[phoneAuth] linkWithCredential SUCCESS, user:', result.user.uid);
      // Clean up after successful verification
      resetPhoneAuth();
      return { preservedGuestData: true };
    } catch (err) {
      console.error('[phoneAuth] linkWithCredential FAILED:', err);
      const errorCode = (err as { code?: string }).code;
      console.error('[phoneAuth] Error code:', errorCode);
      
      // The number is already registered. We need to sign in with the phone credential.
      // IMPORTANT: The credential was already consumed by the linkWithCredential attempt above,
      // so it cannot be reused. Firebase OTP credentials are single-use.
      if (errorCode === 'auth/credential-already-in-use' || errorCode === 'auth/account-exists-with-different-credential') {
        console.log('[phoneAuth] Phone number already registered');
        console.log('[phoneAuth] Credential consumed by link attempt, cannot proceed with same OTP');
        
        // The OTP has been consumed and cannot be reused for signInWithCredential.
        // We need to inform the user to request a new OTP for signing in.
        const message = 'This phone number is already registered. Please request a new OTP to sign in to your existing account.';
        const customError = new Error(message);
        (customError as any).code = 'auth/phone-number-already-registered';
        resetPhoneAuth();
        throw customError;
      }
      // Clean up on error
      resetPhoneAuth();
      throw err;
    }
  }

  // Non-anonymous user path
  try {
    console.log('[phoneAuth] Non-anonymous user, attempting signInWithCredential...');
    const result = await signInWithCredential(auth, credential);
    console.log('[phoneAuth] signInWithCredential SUCCESS, user:', result.user.uid);
    resetPhoneAuth();
    return { preservedGuestData: false };
  } catch (err) {
    console.error('[phoneAuth] signInWithCredential FAILED:', err);
    console.error('[phoneAuth] Error code:', (err as { code?: string }).code);
    resetPhoneAuth();
    throw err;
  }
}

/** Maps Firebase auth error codes to messages worth showing a buyer. */
export function phoneAuthErrorMessage(err: unknown): string {
  if (err instanceof PhoneAuthUnavailableError) return err.message;

  const code = (err as { code?: string })?.code;
  const message = (err as { message?: string })?.message;
  
  switch (code) {
    case 'auth/invalid-phone-number':
      return 'That mobile number is not valid. Check it and try again.';
    case 'auth/invalid-verification-code':
      return 'Incorrect OTP. Please try again or resend a new code.';
    case 'auth/code-expired':
      return 'That OTP has expired. Please request a new one.';
    case 'auth/session-expired':
      return 'Verification session expired. Please request a new OTP.';
    case 'auth/invalid-verification-id':
      return 'Verification failed. Please request a new OTP.';
    case 'auth/phone-number-already-registered':
      return message || 'This phone number is already registered. Please request a new OTP to sign in.';
    case 'auth/account-exists-with-different-credential':
      return 'This phone number is already registered. Please request a new OTP to sign in to your existing account.';
    case 'auth/credential-already-in-use':
      return 'This phone number is already in use. Please request a new OTP to sign in to your existing account.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes before trying again.';
    case 'auth/quota-exceeded':
      return 'We could not send an OTP right now. Please try again later.';
    case 'auth/captcha-check-failed':
      return 'Verification failed. Please reload the page and try again.';
    case 'auth/missing-phone-number':
      return 'Enter your mobile number to continue.';
    case 'auth/unsupported-first-factor':
    case 'auth/operation-not-allowed':
      return 'Phone sign-in is not enabled for this app right now.';
    default:
      // Log the raw error for anything unmapped. Without this the UI shows a
      // generic message and the real code is invisible, which is exactly what
      // made the spent-reCAPTCHA failure hard to pin down.
      console.warn('[phoneAuth] Unmapped OTP error:', code ?? '(no code)', err);
      return 'Something went wrong. Please try again.';
  }
}
