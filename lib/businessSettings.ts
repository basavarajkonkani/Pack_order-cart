import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface BusinessSettings {
  gstin: string;
  businessName: string;
  legalName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstPercentage: number;
}

const BUSINESS_SETTINGS_COLLECTION = 'business_settings';
const BUSINESS_DOC_ID = 'info';

let cachedSettings: BusinessSettings | null = null;

export async function fetchBusinessSettings(): Promise<BusinessSettings> {
  if (cachedSettings) return cachedSettings;
  
  try {
    const snap = await getDoc(doc(db, BUSINESS_SETTINGS_COLLECTION, BUSINESS_DOC_ID));
    if (snap.exists()) {
      cachedSettings = snap.data() as BusinessSettings;
      return cachedSettings;
    }
  } catch (error) {
    console.warn('[businessSettings] Failed to fetch from Firestore:', error);
  }
  
  // Fallback to default values
  const defaultSettings: BusinessSettings = {
    gstin: '29AQEPJ1802F1Z7',
    businessName: 'Jeyd Solutions',
    legalName: 'PRASHANTH JAIKUMAR',
    address: '32, 1st Floor, Ashirvad Nilaya, 1st Cross Road, Vijaya Nagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560040',
    gstPercentage: 18,
  };
  
  cachedSettings = defaultSettings;
  return defaultSettings;
}

export function clearBusinessSettingsCache() {
  cachedSettings = null;
}
