import { collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order, OrderStatus } from '@/types/firestore';

const ORDERS_COLLECTION = 'orders';

export async function fetchAllOrders(): Promise<Order[]> {
  const snap = await getDocs(query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
}

export async function fetchOrderById(id: string): Promise<Order | undefined> {
  const snap = await getDoc(doc(db, ORDERS_COLLECTION, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Order) : undefined;
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
  trackingNumber?: string;
  courierName?: string;
}

/** Admins can update order status/tracking info, but per Firestore rules cannot delete orders. */
export async function updateOrderStatus(id: string, data: UpdateOrderStatusInput): Promise<void> {
  await updateDoc(doc(db, ORDERS_COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
