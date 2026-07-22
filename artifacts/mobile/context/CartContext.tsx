import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
}

export interface CartItem {
  id: string;
  pouchType: PouchType;
  windowOption: WindowOption;
  materialType: MaterialType;
  capacity: Capacity;
  quantity: number;
  price: number;
  pouchSize: string;
}

export interface Order {
  id: string;
  orderId: string;
  items: CartItem[];
  total: number;
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
const ORDERS_KEY = '@packorder_orders';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<OrderConfig>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(CART_KEY).then((v) => { if (v) setCart(JSON.parse(v)); });
    AsyncStorage.getItem(ORDERS_KEY).then((v) => { if (v) setOrders(JSON.parse(v)); });
  }, []);

  const persistCart = useCallback((items: CartItem[]) => {
    setCart(items);
    AsyncStorage.setItem(CART_KEY, JSON.stringify(items));
  }, []);

  const persistOrders = useCallback((list: Order[]) => {
    setOrders(list);
    AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(list));
  }, []);

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
    persistCart(cart.map((i) => i.id === id ? { ...i, quantity } : i));
  }, [cart, persistCart]);

  const clearCart = useCallback(() => persistCart([]), [persistCart]);

  const cartTotal = cart.reduce((sum, i) => sum + i.price, 0);

  const placeOrder = useCallback((address: string, gstNumber: string, paymentMethod: string): Order => {
    const order: Order = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      orderId: 'PCH' + Math.floor(1000 + Math.random() * 9000),
      items: [...cart],
      total: cartTotal,
      address,
      gstNumber,
      paymentMethod,
      createdAt: new Date().toISOString(),
      status: 'confirmed',
    };
    const updated = [order, ...orders];
    persistOrders(updated);
    persistCart([]);
    return order;
  }, [cart, cartTotal, orders, persistOrders, persistCart]);

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

export function calculatePrice(config: Required<Pick<OrderConfig, 'pouchType' | 'windowOption' | 'materialType' | 'capacity' | 'quantity'>>): number {
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

export function getCapacitySize(cap: Capacity): string {
  return { '50g': '80 × 120 mm', '100g': '100 × 150 mm', '250g': '160 × 240 mm', '500g': '190 × 280 mm', '1kg': '220 × 320 mm' }[cap];
}

export function getMinOrder(type: PouchType): number {
  return type === 'printed' ? 5000 : 1000;
}
