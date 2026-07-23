import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { StoreSettings } from '@/types/firestore';

const SETTINGS_COLLECTION = 'settings';
const STORE_DOC_ID = 'store';

const DEFAULT_SETTINGS: StoreSettings = {
  companyName: '',
  companyEmail: '',
  companyPhone: '',
  companyAddress: '',
  gstNumber: '',
  taxPercent: 0,
  shippingFlatRate: 0,
  freeShippingThreshold: undefined,
  paymentMethods: {
    upi: true,
    bankTransfer: true,
    creditTerms: false,
  },
};

export async function fetchStoreSettings(): Promise<StoreSettings> {
  const snap = await getDoc(doc(db, SETTINGS_COLLECTION, STORE_DOC_ID));
  return snap.exists() ? ({ ...DEFAULT_SETTINGS, ...snap.data() } as StoreSettings) : DEFAULT_SETTINGS;
}

export async function updateStoreSettings(data: StoreSettings): Promise<void> {
  await setDoc(doc(db, SETTINGS_COLLECTION, STORE_DOC_ID), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
