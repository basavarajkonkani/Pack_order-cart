import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Category } from '@/types/firestore';

const CATEGORIES_COLLECTION = 'categories';

export async function fetchCategories(): Promise<Category[]> {
  const snap = await getDocs(query(collection(db, CATEGORIES_COLLECTION), orderBy('sortOrder', 'asc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Category);
}

export async function fetchCategoryById(id: string): Promise<Category | undefined> {
  const snap = await getDoc(doc(db, CATEGORIES_COLLECTION, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Category) : undefined;
}

/** Slugifies a category name into a stable, URL-safe Firestore doc id. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export type CategoryInput = Omit<Category, 'id' | 'createdAt' | 'updatedAt'>;

export async function createCategory(data: CategoryInput, id?: string): Promise<string> {
  const docId = id || slugify(data.name) || `category-${Date.now()}`;
  await setDoc(doc(db, CATEGORIES_COLLECTION, docId), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docId;
}

export async function updateCategory(id: string, data: Partial<CategoryInput>): Promise<void> {
  await updateDoc(doc(db, CATEGORIES_COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
}

export async function setCategoryEnabled(id: string, enabled: boolean): Promise<void> {
  await updateDoc(doc(db, CATEGORIES_COLLECTION, id), { enabled, updatedAt: serverTimestamp() });
}
