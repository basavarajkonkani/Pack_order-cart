import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BusinessSettings } from '@/types/firestore';

const BUSINESS_SETTINGS_COLLECTION = 'business_settings';
const BUSINESS_DOC_ID = 'info';

const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  gstin: '29AQEPJ1802F1Z7',
  businessName: 'Jeyd Solutions',
  legalName: 'PRASHANTH JAIKUMAR',
  address: '32, 1st Floor, Ashirvad Nilaya, 1st Cross Road, Vijaya Nagar',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560040',
  gstPercentage: 18,
};

export async function fetchBusinessSettings(): Promise<BusinessSettings> {
  const snap = await getDoc(doc(db, BUSINESS_SETTINGS_COLLECTION, BUSINESS_DOC_ID));
  return snap.exists() 
    ? ({ ...DEFAULT_BUSINESS_SETTINGS, ...snap.data() } as BusinessSettings) 
    : DEFAULT_BUSINESS_SETTINGS;
}

export async function updateBusinessSettings(data: BusinessSettings): Promise<void> {
  await setDoc(doc(db, BUSINESS_SETTINGS_COLLECTION, BUSINESS_DOC_ID), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
