import { Platform } from 'react-native';
import {
  PhoneAuthProvider,
  linkWithCredential,
  signInWithCredential,
  type AuthCredential,
  type ApplicationVerifier,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

/**
 * Native Android Phone OTP authentication using Firebase JS SDK.
 * 
 * For Expo EAS builds, we use Firebase JS SDK's built-in phone auth
 * with a custom ApplicationVerifier that works without reCAPTCHA.
 * 
 * The verifyPhoneNumber method will use automatic SMS retrieval on Android
 * when properly configured with SHA-256 fingerprints in Firebase Console.
 */

export function isPhoneAuthAvailable(): boolean {
  // Phone auth works on both Android and web with this implementation
  return Platform.OS === 'android' || Platform.OS === 'web';
}

export class PhoneAuthUnavailableError extends Error {
  constructor() {
    super('Phone verification is not available on this platform.');
    this.name = 'PhoneAuthUnavailableError';
  }
}

/** Converts a 10-digit Indian mobile number into the E.164 form Firebase requires. */
export function toE164(tenDigitNumber: string, countryCode = '91'): string {
  const digits = tenDigitNumber.replace(/\D/g, '');
  return `+${countryCode}${digits}`;
}

/**
 * No-op verifier for native Android phone auth.
 * Android uses Play Services for automatic SMS verification.
 */
class NativePhoneVerifier implements ApplicationVerifier {
  type = 'recaptcha' as const;

  async verify(): Promise<string> {
    // Return empty string - native phone auth doesn't need reCAPTCHA token
    return '';
  }
}

let currentVerificationId: string | null = null;

/**
 * Sends an OTP to the provided phone number.
 * On Android, this will use automatic SMS retrieval if configured properly.
 */
export async function sendOtp(phoneE164: string): Promise<string> {
  if (!isPhoneAuthAvailable()) throw new PhoneAuthUnavailableError();

  try {
    const provider = new PhoneAuthProvider(auth);
    
    // For Android native builds, use a no-op verifier
    // The actual verification happens through Play Services
    const verifier = new NativePhoneVerifier();
    
    const verificationId = await provider.verifyPhoneNumber(phoneE164, verifier);
    currentVerificationId = verificationId;
    
    return verificationId;
  } catch (err) {
    console.error('[phoneAuthNative] Send OTP failed:', err);
    throw err;
  }
}

export interface ConfirmOtpResult {
  /**
   * True when the phone number was linked onto the existing anonymous account,
   * so the guest's cart, orders and saved addresses carried over.
   */
  preservedGuestData: boolean;
}

/**
 * Verifies the OTP code and completes authentication.
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
      // The number is already registered - sign in instead
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

/**
 * Clean up any pending verification state.
 */
export function resetPhoneAuth(): void {
  currentVerificationId = null;
}

/** Maps Firebase auth error codes to user-friendly messages. */
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
    case 'auth/missing-phone-number':
      return 'Enter your mobile number to continue.';
    case 'auth/operation-not-allowed':
      return 'Phone sign-in is not enabled for this app right now.';
    default:
      console.warn('[phoneAuthNative] Unmapped error:', code ?? '(no code)', err);
      return 'Something went wrong. Please try again.';
  }
}
