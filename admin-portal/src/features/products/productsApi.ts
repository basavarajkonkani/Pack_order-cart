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
import type { Product } from '@/types/firestore';

const PRODUCTS_COLLECTION = 'products';

export async function fetchAllProducts(): Promise<Product[]> {
  const snap = await getDocs(query(collection(db, PRODUCTS_COLLECTION), orderBy('name', 'asc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product);
}

export async function fetchProductById(id: string): Promise<Product | undefined> {
  const snap = await getDoc(doc(db, PRODUCTS_COLLECTION, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Product) : undefined;
}

/** Slugifies a product name into a stable, URL-safe Firestore doc id. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export type ProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Firestore's setDoc/updateDoc reject any field explicitly set to `undefined`
 * (e.g. an optional `imageUrl` or `categoryId` left unset in the form) — they must
 * be omitted from the payload entirely rather than passed through as `undefined`.
 */
function stripUndefined<T extends Record<string, unknown>>(data: T): Partial<T> {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/** Creates a new product doc. Generates the id from the product name if not provided. */
export async function createProduct(data: ProductInput, id?: string): Promise<string> {
  const docId = id || slugify(data.name) || `product-${Date.now()}`;
  await setDoc(doc(db, PRODUCTS_COLLECTION, docId), {
    ...stripUndefined(data),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docId;
}

export async function updateProduct(id: string, data: Partial<ProductInput>): Promise<void> {
  await updateDoc(doc(db, PRODUCTS_COLLECTION, id), {
    ...stripUndefined(data),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
}

export async function setProductVisibility(id: string, visible: boolean): Promise<void> {
  await updateDoc(doc(db, PRODUCTS_COLLECTION, id), { visible, updatedAt: serverTimestamp() });
}

export async function setProductEnabled(id: string, inStock: boolean): Promise<void> {
  await updateDoc(doc(db, PRODUCTS_COLLECTION, id), { inStock, updatedAt: serverTimestamp() });
}
