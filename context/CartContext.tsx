import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ImageSourcePropType } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, onSnapshot, orderBy, query, setDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { STOCK_PRODUCTS } from '@/constants/stockProducts';
import { fetchBusinessSettings } from '@/lib/businessSettings';

export type PouchType = 'plain' | 'printed' | 'kraft';
export type WindowOption = 'with' | 'without';
export type MaterialType = 'metalised' | 'non-metalised';
export type Capacity = '50g' | '100g' | '250g' | '500g' | '1kg';

export interface OrderConfig {
  pouchType?: PouchType;
  windowOption?: WindowOption;
  materialType?: MaterialType;
  capacity?: Capacity;
  quantity?: number;
  pouchSize?: string;
  artworkUpload?: boolean;
  /** Download URL of the buyer's uploaded artwork / reference file. */
  artworkUrl?: string;
  artworkName?: string;
  artworkSize?: number;
}

export interface CartItem {
  id: string;
  /** 'custom' = built via the configure wizard, 'stock' = ready-stock catalog item */
  kind?: 'custom' | 'stock';
  quantity: number;
  /** Total line price (unit price × quantity) */
  price: number;

  // Custom-order fields
  pouchType?: PouchType;
  windowOption?: WindowOption;
  materialType?: MaterialType;
  capacity?: Capacity;
  pouchSize?: string;
  /** Artwork / reference file the buyer attached (printed pouches). */
  artworkUrl?: string;
  artworkName?: string;
  artworkSize?: number;

  // Ready-stock fields
  productId?: string;
  productName?: string;
  productImage?: ImageSourcePropType;
  productColor?: string; // Selected color for products with color variants
  sizeCode?: string;
  sizeLabel?: string;
  sizeWeight?: string;
  pricePerPiece?: number;
}

export interface Order {
  id: string;
  orderId: string;
  items: CartItem[];
  total: number;
  subtotal: number;
  gstPercentage: number;
  gstAmount: number;
  totalAmount: number;
  gstin: string;
  businessName: string;
  address: string;
  gstNumber: string;
  paymentMethod: string;
  createdAt: string;
  status: 'confirmed' | 'approved' | 'production' | 'printing' | 'dispatched' | 'delivered';
}

interface CartContextType {
  config: OrderConfig;
  setConfig: (updates: Partial<OrderConfig>) => void;
  resetConfig: () => void;
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  orders: Order[];
  placeOrder: (address: string, gstNumber: string, paymentMethod: string) => Order;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_KEY = '@packorder_cart';
const ORDERS_COLLECTION = 'orders';
const CARTS_COLLECTION = 'carts';

/** Firestore can't store require() image assets, so they're stripped before writing. */
function stripImagesForFirestore(items: CartItem[]) {
  return items.map(({ productImage, ...rest }) => rest);
}

/** Re-attaches the bundled local image asset by productId after reading cart items back from Firestore. */
function withLocalImages(items: CartItem[]): CartItem[] {
  return items.map((item) => {
    if (item.kind !== 'stock' || !item.productId) return item;
    const product = STOCK_PRODUCTS.find((p) => p.id === item.productId);
    return product ? { ...item, productImage: product.image } : item;
  });
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [config, setConfigState] = useState<OrderConfig>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  // Tracks whether the current `cart` state came from our own write (skip echo)
  // vs. a remote change from another device, so onSnapshot doesn't cause loops.
  const skipNextCartSync = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(CART_KEY).then((v) => { if (v) setCart(JSON.parse(v)); });
  }, []);

  // Orders are stored in Firestore keyed by userId, and synced in real time
  // so status changes made from the (future) admin portal show up here too.
  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map((d) => d.data() as Order));
    }, (err) => {
      console.warn('[orders] Failed to sync from Firestore:', err);
    });
    return unsubscribe;
  }, [user]);

  // Cart is stored in Firestore keyed by the authenticated UID (carts/{uid})
  // so it persists across devices/reinstalls, not just AsyncStorage on this
  // device. AsyncStorage still caches it for instant load before sign-in
  // resolves. On first sign-in, any locally-cached cart is migrated up.
  useEffect(() => {
    if (!user) return;
    const cartRef = doc(db, CARTS_COLLECTION, user.uid);
    const unsubscribe = onSnapshot(cartRef, async (snap) => {
      if (skipNextCartSync.current) {
        skipNextCartSync.current = false;
        return;
      }
      if (snap.exists()) {
        const items = withLocalImages((snap.data().items as CartItem[]) ?? []);
        setCart(items);
        AsyncStorage.setItem(CART_KEY, JSON.stringify(items));
      } else {
        // No cloud cart yet — migrate whatever is cached locally (e.g. items
        // added before sign-in resolved) up to Firestore.
        const local = await AsyncStorage.getItem(CART_KEY);
        const localItems: CartItem[] = local ? JSON.parse(local) : [];
        skipNextCartSync.current = true;
        await setDoc(cartRef, { items: stripImagesForFirestore(localItems) });
      }
    }, (err) => {
      console.warn('[cart] Failed to sync from Firestore:', err);
    });
    return unsubscribe;
  }, [user]);

  const persistCart = useCallback((items: CartItem[]) => {
    setCart(items);
    AsyncStorage.setItem(CART_KEY, JSON.stringify(items));
    if (user) {
      skipNextCartSync.current = true;
      setDoc(doc(db, CARTS_COLLECTION, user.uid), { items: stripImagesForFirestore(items) })
        .catch((err) => console.warn('[cart] Failed to save cart to Firestore:', err));
    }
  }, [user]);

  const setConfig = useCallback((updates: Partial<OrderConfig>) => {
    setConfigState((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetConfig = useCallback(() => setConfigState({}), []);

  const addToCart = useCallback((item: Omit<CartItem, 'id'>) => {
    const newItem: CartItem = {
      ...item,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
    };
    persistCart([...cart, newItem]);
  }, [cart, persistCart]);

  const removeFromCart = useCallback((id: string) => {
    persistCart(cart.filter((i) => i.id !== id));
  }, [cart, persistCart]);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    persistCart(cart.map((i) => {
      if (i.id !== id) return i;
      // Ready-stock items have a fixed per-piece price, so the line total scales directly.
      const price = i.kind === 'stock' && i.pricePerPiece != null
        ? Math.round(i.pricePerPiece * quantity * 100) / 100
        : i.price;
      return { ...i, quantity, price };
    }));
  }, [cart, persistCart]);

  const clearCart = useCallback(() => persistCart([]), [persistCart]);

  const cartTotal = cart.reduce((sum, i) => sum + i.price, 0);

  const placeOrder = useCallback(async (address: string, gstNumber: string, paymentMethod: string): Promise<Order> => {
    // Fetch business settings for GST calculation
    const businessSettings = await fetchBusinessSettings();
    const subtotal = cartTotal;
    const gstPercentage = businessSettings.gstPercentage;
    const gstAmount = Math.round((subtotal * gstPercentage) / 100);
    const totalAmount = subtotal + gstAmount;

    const order: Order = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      orderId: 'PCH' + Math.floor(1000 + Math.random() * 9000),
      items: [...cart],
      total: cartTotal, // Keep for backward compatibility
      subtotal,
      gstPercentage,
      gstAmount,
      totalAmount,
      gstin: businessSettings.gstin,
      businessName: businessSettings.businessName,
      address,
      gstNumber,
      paymentMethod,
      createdAt: new Date().toISOString(),
      status: 'confirmed',
    };
    if (user) {
      setDoc(doc(db, ORDERS_COLLECTION, order.id), {
        ...order,
        items: stripImagesForFirestore(order.items),
        userId: user.uid,
      }).catch((err) => console.warn('[orders] Failed to save order to Firestore:', err));
    }
    persistCart([]);
    return order;
  }, [cart, cartTotal, user, persistCart]);

  return (
    <CartContext.Provider value={{
      config, setConfig, resetConfig,
      cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal,
      orders, placeOrder,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
}

/**
 * Kraft pouches are paper-based, so the metalised / non-metalised choice
 * doesn't apply — that wizard step is skipped for them.
 */
export function hasMaterialStep(type?: PouchType): boolean {
  return type !== 'kraft';
}

/** Total steps in the configure wizard for a pouch type (kraft skips material type). */
export function getTotalSteps(type?: PouchType): number {
  return hasMaterialStep(type) ? 5 : 4;
}

export function calculatePrice(
  config: Required<Pick<OrderConfig, 'pouchType' | 'windowOption' | 'capacity' | 'quantity'>> &
    Pick<OrderConfig, 'materialType'>
): number {
  // Plain and Kraft pouches use fixed hardcoded pricing.
  // Printed pouches should use calculatePrintedPrice() from lib/printedPouchPricing
  // with live Firestore data. This fallback is kept only for backward compatibility
  // (e.g. tests or places that haven't been migrated), and uses the default values.
  const basePerPiece: Record<PouchType, number> = { plain: 1.5, printed: 3.0, kraft: 2.0 };
  let price = basePerPiece[config.pouchType];
  if (config.windowOption === 'with') price += 0.5;
  if (config.materialType === 'metalised') price += 0.2;
  const capMultiplier: Record<Capacity, number> = { '50g': 1.0, '100g': 1.1, '250g': 1.3, '500g': 1.6, '1kg': 2.0 };
  price *= capMultiplier[config.capacity];
  return Math.round(price * config.quantity);
}

export function getPouchLabel(type: PouchType) {
  return { plain: 'Plain Pouch', printed: 'Printed Pouch', kraft: 'Kraft Pouch' }[type];
}

/** Title to display for any cart/order item, custom or ready-stock. */
export function getItemTitle(item: CartItem): string {
  if (item.kind === 'stock') return item.productName ?? 'Stock Pouch';
  return getPouchLabel(item.pouchType ?? 'plain');
}

/** Subtitle/spec line(s) to display for any cart/order item, custom or ready-stock. */
export function getItemSpec(item: CartItem): string {
  if (item.kind === 'stock') {
    const parts = [item.sizeLabel, item.sizeWeight];
    if (item.productColor) parts.unshift(item.productColor);
    return parts.filter(Boolean).join(' · ');
  }
  const windowText = item.windowOption === 'with' ? 'With Window' : 'No Window';
  const materialText = !hasMaterialStep(item.pouchType) || !item.materialType
    ? null
    : item.materialType === 'metalised' ? 'Metalised' : 'Non-Metalised';
  return [windowText, materialText, item.capacity].filter(Boolean).join(' · ');
}

export function getCapacitySize(cap: Capacity): string {
  return { '50g': '80 × 120 mm', '100g': '100 × 150 mm', '250g': '160 × 240 mm', '500g': '190 × 280 mm', '1kg': '220 × 320 mm' }[cap];
}

export function getMinOrder(type: PouchType, printedMinQty?: number): number {
  if (type === 'printed') return printedMinQty ?? 1000;
  return 1000;
}
