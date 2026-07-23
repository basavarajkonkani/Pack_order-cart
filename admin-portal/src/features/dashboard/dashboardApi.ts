import { collection, getCountFromServer, getDocs, orderBy, query, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order } from '@/types/firestore';

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  revenue: number;
  totalCustomers: number;
  recentOrders: Order[];
  ordersByStatus: Record<string, number>;
  revenueByDay: { date: string; revenue: number }[];
}

const PENDING_STATUSES = ['confirmed', 'approved', 'production', 'printing'];

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [productsCount, customersCount, ordersSnap] = await Promise.all([
    getCountFromServer(collection(db, 'products')),
    getCountFromServer(collection(db, 'users')),
    getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(500))),
  ]);

  const orders = ordersSnap.docs.map((d) => d.data() as Order);

  const revenue = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);
  const pendingOrders = orders.filter((o) => PENDING_STATUSES.includes(o.status)).length;

  const ordersByStatus: Record<string, number> = {};
  for (const o of orders) {
    ordersByStatus[o.status] = (ordersByStatus[o.status] ?? 0) + 1;
  }

  // Last 7 days revenue trend.
  const days: { date: string; revenue: number }[] = [];
  const dayMap = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dayMap.set(key, 0);
  }
  for (const o of orders) {
    const key = new Date(o.createdAt).toISOString().slice(0, 10);
    if (dayMap.has(key)) dayMap.set(key, (dayMap.get(key) ?? 0) + (o.total ?? 0));
  }
  for (const [date, rev] of dayMap.entries()) {
    days.push({ date: date.slice(5), revenue: rev });
  }

  return {
    totalProducts: productsCount.data().count,
    totalOrders: orders.length,
    pendingOrders,
    revenue,
    totalCustomers: customersCount.data().count,
    recentOrders: orders.slice(0, 8),
    ordersByStatus,
    revenueByDay: days,
  };
}

export async function fetchOrderCountByStatus(status: string): Promise<number> {
  const snap = await getCountFromServer(query(collection(db, 'orders'), where('status', '==', status)));
  return snap.data().count;
}
