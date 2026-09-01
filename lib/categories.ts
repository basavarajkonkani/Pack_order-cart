import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface AppCategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  enabled: boolean;
  sortOrder?: number;
}

/**
 * Fallback categories used when Firestore is unavailable or the collection is empty.
 * These mirror the three original hardcoded tiles so the app always renders something.
 */
export const FALLBACK_CATEGORIES: AppCategory[] = [
  { id: 'plain', name: 'Plain', description: 'No Printing', enabled: true, sortOrder: 0 },
  { id: 'printed', name: 'Printed', description: 'Custom Printing', enabled: true, sortOrder: 1 },
  { id: 'kraft', name: 'Kraft', description: 'Natural & Premium', enabled: true, sortOrder: 2 },
];

/**
 * Fetches enabled categories from Firestore ordered by sortOrder.
 * Falls back to FALLBACK_CATEGORIES on error or empty collection.
 */
export async function fetchAppCategories(): Promise<AppCategory[]> {
  try {
    const snap = await getDocs(collection(db, 'categories'));
    if (snap.empty) return FALLBACK_CATEGORIES;
    const enabled = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as AppCategory))
      .filter((c) => c.enabled !== false)
      // Sort client-side — no Firestore index required
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return enabled.length > 0 ? enabled : FALLBACK_CATEGORIES;
  } catch (err) {
    console.warn('[categories] Failed to fetch from Firestore, using fallback:', err);
    return FALLBACK_CATEGORIES;
  }
}
