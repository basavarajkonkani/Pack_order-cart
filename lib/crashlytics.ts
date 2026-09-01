/**
 * Crashlytics stub - native Firebase Crashlytics removed due to SDK dependency conflicts.
 * For production, consider using Expo's built-in error reporting or Sentry.
 */

export async function initCrashlytics(): Promise<void> {
  console.log('[crashlytics] Stub - Firebase Crashlytics not available');
}

export function logError(error: Error, context?: string): void {
  console.error('[crashlytics]', context, error);
}

export async function setUserId(userId: string): Promise<void> {
  console.log('[crashlytics] setUserId:', userId);
}

export async function setCrashlyticsAttribute(key: string, value: string): Promise<void> {
  console.log('[crashlytics] setAttribute:', key, value);
}

export function logMessage(message: string): void {
  console.log('[crashlytics]', message);
}

export function forceCrash(): void {
  console.warn('[crashlytics] forceCrash not available');
}
