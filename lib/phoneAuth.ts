import { Platform } from 'react-native';
import {
  PhoneAuthProvider,
  RecaptchaVerifier,
  linkWithCredential,
  signInWithCredential,
  signInWithPhoneNumber,
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

  try {
    const confirmation = await signInWithPhoneNumber(auth, phoneE164, createVerifier());
    return confirmation.verificationId;
  } catch (err) {
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

  const credential: AuthCredential = PhoneAuthProvider.credential(verificationId, code);
  const current = auth.currentUser;

  if (current?.isAnonymous) {
    try {
      await linkWithCredential(current, credential);
      return { preservedGuestData: true };
    } catch (err) {
      const code = (err as { code?: string }).code;
      // The number is already registered. Falling back to a plain sign-in is the
      // only option — Firebase has no account-merge primitive.
      if (code === 'auth/credential-already-in-use' || code === 'auth/account-exists-with-different-credential') {
        await signInWithCredential(auth, credential);
        return { preservedGuestData: false };
      }
      throw err;
    }
  }

  await signInWithCredential(auth, credential);
  return { preservedGuestData: false };
}

/** Maps Firebase auth error codes to messages worth showing a buyer. */
export function phoneAuthErrorMessage(err: unknown): string {
  if (err instanceof PhoneAuthUnavailableError) return err.message;

  const code = (err as { code?: string })?.code;
  switch (code) {
    case 'auth/invalid-phone-number':
      return 'That mobile number is not valid. Check it and try again.';
    case 'auth/invalid-verification-code':
      return 'Incorrect OTP. Please try again.';
    case 'auth/code-expired':
      return 'That OTP has expired. Request a new one.';
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
      return 'Something went wrong sending the OTP. Please try again.';
  }
}
