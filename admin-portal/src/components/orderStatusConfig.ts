import type { OrderStatus } from '@/types/firestore';

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  confirmed: { label: 'Confirmed', color: '#1d4ed8', bg: '#dbeafe' },
  approved: { label: 'Approved', color: '#7e22ce', bg: '#f3e8ff' },
  production: { label: 'In Production', color: '#c2410c', bg: '#ffedd5' },
  printing: { label: 'Printing', color: '#a16207', bg: '#fef9c3' },
  dispatched: { label: 'Dispatched', color: '#0e7490', bg: '#cffafe' },
  delivered: { label: 'Delivered', color: '#15803d', bg: '#dcfce7' },
};

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  'confirmed',
  'approved',
  'production',
  'printing',
  'dispatched',
  'delivered',
];
