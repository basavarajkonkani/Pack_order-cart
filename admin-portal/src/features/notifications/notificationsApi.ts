import { collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AppNotification, NotificationType } from '@/types/firestore';

const NOTIFICATIONS_COLLECTION = 'notifications';

export async function fetchAllNotifications(): Promise<AppNotification[]> {
  const snap = await getDocs(query(collection(db, NOTIFICATIONS_COLLECTION), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AppNotification);
}

export interface NotificationInput {
  title: string;
  body: string;
  type: NotificationType;
  targetUserId?: string;
}

export async function createNotification(data: NotificationInput): Promise<string> {
  const id = `notif-${Date.now()}`;
  await setDoc(doc(db, NOTIFICATIONS_COLLECTION, id), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return id;
}

export async function deleteNotification(id: string): Promise<void> {
  await deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, id));
}
