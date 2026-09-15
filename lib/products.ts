import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { StockProduct, STOCK_PRODUCTS } from '@/constants/stockProducts';

const PRODUCTS_COLLECTION = 'products';

// Neutral placeholder for products without images
const PLACEHOLDER_IMAGE = require('@/assets/images/logo.png');

function withLocalImage(product: Omit<StockProduct, 'image'> & { image?: unknown; imageUrl?: unknown }): StockProduct {
  const remoteImageUrl = typeof product.imageUrl === 'string' && product.imageUrl.trim() ? product.imageUrl : undefined;
  const local = STOCK_PRODUCTS.find((p) => p.id === product.id);
  
  return {
    ...product,
    image: remoteImageUrl ? { uri: remoteImageUrl } : PLACEHOLDER_IMAGE,
    // Firestore docs that predate the `sizes` field (or were seeded
    // incompletely) shouldn't crash consumers that expect `sizes` to be an array.
    sizes: Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes : (local?.sizes ?? []),
  } as StockProduct;
}

/** Fetches all products from Firestore. Falls back to the local static list on error. */
export async function fetchProducts(): Promise<StockProduct[]> {
  try {
    console.log('[products] Fetching products from Firestore...');
    const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    console.log('[products] Fetched', snapshot.size, 'products from Firestore');
    
    if (snapshot.empty) {
      console.warn('[products] Firestore returned empty, using local fallback');
      return STOCK_PRODUCTS;
    }
    
    const products = snapshot.docs
      // Admin Portal's "Visible in Buyer App" toggle sets `visible: false` to hide
      // a product from the catalog without deleting it. Undefined = visible (legacy docs).
      .filter((d) => {
        const visible = d.data().visible !== false;
        if (!visible) console.log('[products] Filtering out hidden product:', d.id);
        return visible;
      })
      .map((d) => withLocalImage({ id: d.id, ...d.data() } as StockProduct));
    
    console.log('[products] Returning', products.length, 'visible products');
    return products;
  } catch (err) {
    console.error('[products] Failed to fetch from Firestore:', err);
    console.warn('[products] Using local fallback with', STOCK_PRODUCTS.length, 'products');
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
