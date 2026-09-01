/**
 * Push notifications stub - removed expo-notifications to resolve SDK dependency conflicts.
 * Will be added in v1.1 update.
 */

export interface NotificationPermissionResult {
  granted: boolean;
  canAskAgain: boolean;
  message?: string;
}

export async function registerForPushNotifications(): Promise<NotificationPermissionResult> {
  console.log('[notifications] Stub - notifications not available in v1.0');
  return {
    granted: false,
    canAskAgain: false,
    message: 'Notifications will be available in the next update.',
  };
}

export async function saveFCMToken(): Promise<void> {
  console.log('[notifications] Stub - FCM token save skipped');
}

export async function removeFCMToken(): Promise<void> {
  console.log('[notifications] Stub - FCM token removal skipped');
}

export function setupNotificationResponseHandler(
  handler: (notification: any) => void
) {
  console.log('[notifications] Stub - response handler skipped');
  return () => {};
}

export function setupForegroundNotificationHandler(
  handler: (notification: any) => void
) {
  console.log('[notifications] Stub - foreground handler skipped');
  return () => {};
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<string> {
  console.log('[notifications] Stub - local notification skipped:', title, body);
  return 'stub-notification-id';
}
