import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { StockProduct, STOCK_PRODUCTS } from '@/constants/stockProducts';

const PRODUCTS_COLLECTION = 'products';

/**
 * Firestore doesn't store React Native `require()` image assets, so product
 * images stay bundled locally and are matched back by product id after the
 * rest of the product data is fetched from Firestore.
 */
function withLocalImage(product: Omit<StockProduct, 'image'> & { image?: unknown }): StockProduct {
  const local = STOCK_PRODUCTS.find((p) => p.id === product.id);
  return {
    ...product,
    image: local?.image ?? STOCK_PRODUCTS[0].image,
    // Firestore docs that predate the `sizes` field (or were seeded
    // incompletely) shouldn't crash consumers that expect `sizes` to be an array.
    sizes: Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes : (local?.sizes ?? []),
  } as StockProduct;
}

/** Fetches all products from Firestore. Falls back to the local static list on error. */
export async function fetchProducts(): Promise<StockProduct[]> {
  try {
    const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    if (snapshot.empty) return STOCK_PRODUCTS;
    return snapshot.docs.map((d) => withLocalImage({ id: d.id, ...d.data() } as StockProduct));
  } catch (err) {
    console.warn('[products] Failed to fetch from Firestore, using local fallback:', err);
    return STOCK_PRODUCTS;
  }
}

/** Fetches a single product by id from Firestore. Falls back to the local static list on error. */
export async function fetchProduct(id: string): Promise<StockProduct | undefined> {
  try {
    const ref = doc(db, PRODUCTS_COLLECTION, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return STOCK_PRODUCTS.find((p) => p.id === id);
    return withLocalImage({ id: snap.id, ...snap.data() } as StockProduct);
  } catch (err) {
    console.warn('[products] Failed to fetch product from Firestore, using local fallback:', err);
    return STOCK_PRODUCTS.find((p) => p.id === id);
  }
}
