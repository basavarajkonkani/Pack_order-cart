import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInAnonymously,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import {
  confirmOtp,
  isPhoneAuthAvailable,
  resetPhoneAuth,
  sendOtp,
  toE164,
  type ConfirmOtpResult,
} from '@/lib/phoneAuth';

export interface Address {
  id: string;
  label: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface UserProfile {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  gstNumber?: string;
  /** Registered business address used on GST invoices (distinct from delivery addresses). */
  registeredAddress?: string;
  addresses?: Address[];
  /** Product ids the buyer has saved to their wishlist. */
  wishlist?: string[];
  role: 'customer' | 'admin';
}

/** Formats the "city, state – pincode" line, omitting separators for missing fields. */
export function formatAddressLine2(addr: Address): string {
  const cityState = [addr.city, addr.state].filter(Boolean).join(', ');
  return [cityState, addr.pincode].filter(Boolean).join(' – ');
}

/** Formats a saved address into the multi-line string used for delivery/order records. */
export function formatAddress(addr: Address): string {
  const secondLine = formatAddressLine2(addr);
  return secondLine ? `${addr.line1}\n${secondLine}` : addr.line1;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  /** True while the buyer is still on an anonymous (guest) session. */
  isGuest: boolean;
  /** False on native, where the JS SDK cannot run reCAPTCHA. See lib/phoneAuth.ts. */
  phoneAuthAvailable: boolean;
  /** Sends an OTP to a 10-digit number and resolves with the verificationId. */
  sendPhoneOtp: (tenDigitNumber: string) => Promise<string>;
  /**
   * Verifies the OTP, upgrading the guest account in place where possible, and
   * persists the number on the profile.
   */
  verifyPhoneOtp: (verificationId: string, code: string, tenDigitNumber: string) => Promise<ConfirmOtpResult>;
  updateProfile: (updates: Partial<Omit<UserProfile, 'role'>>) => Promise<void>;
  addAddress: (addr: Omit<Address, 'id' | 'isDefault'>) => Promise<void>;
  updateAddress: (id: string, addr: Omit<Address, 'id' | 'isDefault'>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  /** The address to prefill on checkout: the default saved address, or the first one. */
  defaultAddress: Address | undefined;
  wishlist: string[];
  toggleWishlist: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USERS_COLLECTION = 'users';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        // No session yet — sign in anonymously so every device has a stable,
        // real Firebase UID we can attach orders/profile data to.
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.warn('[auth] Anonymous sign-in failed:', err);
          setLoading(false);
        }
        return;
      }

      setUser(firebaseUser);
    });

    return unsubscribeAuth;
  }, []);

  // Live-sync the customer profile (addresses, wishlist, GST, etc.) from
  // Firestore so it stays consistent across devices/sessions for this UID,
  // creating the doc on first sign-in if it doesn't exist yet.
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const userRef = doc(db, USERS_COLLECTION, user.uid);

    (async () => {
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        const newProfile: UserProfile = { role: 'customer' };
        await setDoc(userRef, { ...newProfile, createdAt: serverTimestamp() });
      }
    })();

    const unsubscribeProfile = onSnapshot(userRef, (snap) => {
      if (snap.exists()) setProfile(snap.data() as UserProfile);
      setLoading(false);
    }, (err) => {
      console.warn('[auth] Failed to sync profile from Firestore:', err);
      setLoading(false);
    });

    return unsubscribeProfile;
  }, [user]);

  const updateProfile = async (updates: Partial<Omit<UserProfile, 'role'>>) => {
    if (!user) return;
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    await setDoc(userRef, updates, { merge: true });
    setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  const sendPhoneOtp = async (tenDigitNumber: string) => {
    return sendOtp(toE164(tenDigitNumber));
  };

  const verifyPhoneOtp = async (
    verificationId: string,
    code: string,
    tenDigitNumber: string
  ): Promise<ConfirmOtpResult> => {
    const result = await confirmOtp(verificationId, code);

    // The challenge is single-use; drop it so a later verification starts fresh.
    resetPhoneAuth();

    // Write against auth.currentUser rather than the `user` state value: on the
    // fallback path confirmOtp swapped the account, and the onAuthStateChanged
    // listener has not re-rendered us yet, so `user` still holds the old UID.
    const active = auth.currentUser;
    if (active) {
      const userRef = doc(db, USERS_COLLECTION, active.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        // Only the phone number. `role` is deliberately left alone: when a phone
        // sign-in lands on an account that is already an admin, writing
        // role: 'customer' would demote it, and firestore.rules permits that
        // write through the isAdmin() branch rather than blocking it. `createdAt`
        // is left alone too so the original signup date survives re-verification.
        await setDoc(userRef, { phone: tenDigitNumber }, { merge: true });
      } else {
        await setDoc(userRef, {
          phone: tenDigitNumber,
          role: 'customer',
          createdAt: serverTimestamp(),
        });
      }
    }

    return result;
  };

  const saveAddresses = async (addresses: Address[]) => {
    if (!user) return;
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    await setDoc(userRef, { addresses }, { merge: true });
    setProfile((prev) => (prev ? { ...prev, addresses } : prev));
  };

  const addAddress = async (addr: Omit<Address, 'id' | 'isDefault'>) => {
    const current = profile?.addresses ?? [];
    const newAddr: Address = { ...addr, id: Date.now().toString(), isDefault: current.length === 0 };
    await saveAddresses([...current, newAddr]);
  };

  const updateAddress = async (id: string, addr: Omit<Address, 'id' | 'isDefault'>) => {
    const current = profile?.addresses ?? [];
    await saveAddresses(current.map((a) => (a.id === id ? { ...addr, id, isDefault: a.isDefault } : a)));
  };

  const deleteAddress = async (id: string) => {
    const current = profile?.addresses ?? [];
    const remaining = current.filter((a) => a.id !== id);
    // Promote another address to default if the deleted one was the default.
    const removedWasDefault = current.find((a) => a.id === id)?.isDefault;
    if (removedWasDefault && remaining.length > 0) remaining[0] = { ...remaining[0], isDefault: true };
    await saveAddresses(remaining);
  };

  const setDefaultAddress = async (id: string) => {
    const current = profile?.addresses ?? [];
    await saveAddresses(current.map((a) => ({ ...a, isDefault: a.id === id })));
  };

  const defaultAddress = profile?.addresses?.find((a) => a.isDefault) ?? profile?.addresses?.[0];

  const wishlist = profile?.wishlist ?? [];

  const toggleWishlist = async (productId: string) => {
    const current = profile?.wishlist ?? [];
    const next = current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId];
    await updateProfile({ wishlist: next });
  };

  const isWishlisted = (productId: string) => wishlist.includes(productId);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin: profile?.role === 'admin',
        isGuest: user?.isAnonymous ?? true,
        phoneAuthAvailable: isPhoneAuthAvailable(),
        sendPhoneOtp,
        verifyPhoneOtp,
        updateProfile,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        defaultAddress,
        wishlist,
        toggleWishlist,
        isWishlisted,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
