import { collection, doc, getDoc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/types/firestore';

const USERS_COLLECTION = 'users';

/** Firestore excludes docs missing an orderBy field from query results, and legacy
 * docs may not have createdAt set, so this sorts client-side instead of using orderBy. */
export async function fetchAllCustomers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, USERS_COLLECTION));
  const customers = snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserProfile);
  return customers.sort((a, b) => {
    const aTime = a.createdAt && typeof a.createdAt === 'object' && 'toMillis' in a.createdAt ? (a.createdAt as { toMillis: () => number }).toMillis() : 0;
    const bTime = b.createdAt && typeof b.createdAt === 'object' && 'toMillis' in b.createdAt ? (b.createdAt as { toMillis: () => number }).toMillis() : 0;
    return bTime - aTime;
  });
}

export async function fetchCustomerById(uid: string): Promise<UserProfile | undefined> {
  const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
  return snap.exists() ? ({ uid: snap.id, ...snap.data() } as UserProfile) : undefined;
}

/** Admins can promote/demote a user's role. Firestore rules block self-promotion on the owner's own write path. */
export async function setCustomerRole(uid: string, role: 'customer' | 'admin'): Promise<void> {
  await updateDoc(doc(db, USERS_COLLECTION, uid), { role, updatedAt: serverTimestamp() });
}
