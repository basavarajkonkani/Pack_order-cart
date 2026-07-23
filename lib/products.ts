import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { StockProduct, STOCK_PRODUCTS } from '@/constants/stockProducts';

const PRODUCTS_COLLECTION = 'products';

/**
 * Firestore doesn't store React Native `require()` image assets, so legacy
 * (seeded) products keep their images bundled locally and matched back by
 * product id. Products created via the Admin Portal instead carry a real
 * `imageUrl` (Firebase Storage download URL) on the Firestore doc — that
 * takes priority when present, so admin-added products render correctly
 * without needing a matching bundled asset. If neither is available (e.g. an
 * Admin Portal product created without an image), a neutral placeholder is
 * used instead of another product's photo.
 */
// Neutral placeholder for Admin Portal-created products that don't have an
// imageUrl yet (image upload is optional there). Previously this fell back to
// STOCK_PRODUCTS[0].image, which meant every image-less product wrongly showed
// the Gold Standy Pouch photo.
const PLACEHOLDER_IMAGE = require('@/assets/images/logo.png');

function withLocalImage(product: Omit<StockProduct, 'image'> & { image?: unknown; imageUrl?: unknown }): StockProduct {
  const local = STOCK_PRODUCTS.find((p) => p.id === product.id);
  const remoteImageUrl = typeof product.imageUrl === 'string' && product.imageUrl.trim() ? product.imageUrl : undefined;
  return {
    ...product,
    image: remoteImageUrl ? { uri: remoteImageUrl } : (local?.image ?? PLACEHOLDER_IMAGE),
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
    return snapshot.docs
      // Admin Portal's "Visible in Buyer App" toggle sets `visible: false` to hide
      // a product from the catalog without deleting it. Undefined = visible (legacy docs).
      .filter((d) => d.data().visible !== false)
      .map((d) => withLocalImage({ id: d.id, ...d.data() } as StockProduct));
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
