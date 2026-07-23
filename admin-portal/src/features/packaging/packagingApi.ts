import { collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PackagingRequest, PackagingRequestStatus } from '@/types/firestore';

const PACKAGING_COLLECTION = 'packagingRequests';

export async function fetchAllPackagingRequests(): Promise<PackagingRequest[]> {
  const snap = await getDocs(query(collection(db, PACKAGING_COLLECTION), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PackagingRequest);
}

export async function fetchPackagingRequestById(id: string): Promise<PackagingRequest | undefined> {
  const snap = await getDoc(doc(db, PACKAGING_COLLECTION, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as PackagingRequest) : undefined;
}

export interface UpdatePackagingRequestInput {
  status: PackagingRequestStatus;
  notes?: string;
}

/** Admins can update status/notes, but per Firestore rules cannot delete packaging requests. */
export async function updatePackagingRequest(id: string, data: UpdatePackagingRequestInput): Promise<void> {
  await updateDoc(doc(db, PACKAGING_COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
