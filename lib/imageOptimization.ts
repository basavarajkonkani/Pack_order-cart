import { Image } from 'react-native';

/**
 * Prefetches images to cache them for faster loading.
 * Call this in the background while other content renders.
 */
export async function prefetchImages(urls: string[]): Promise<void> {
  const promises = urls.map((url) => {
    if (url) {
      return Image.prefetch(url).catch((err) => {
        console.warn(`[imageOptimization] Failed to prefetch ${url}:`, err);
      });
    }
    return Promise.resolve(false);
  });
  
  await Promise.all(promises);
}

/**
 * Generates an optimized image URL for Firebase Storage images.
 * Note: This requires Cloud Functions or a CDN with image optimization.
 * For now, it returns the original URL.
 * 
 * TODO: Implement with Firebase Extensions (Resize Images) or imgix/Cloudinary
 */
export function getOptimizedImageUrl(
  url: string,
  options?: { width?: number; height?: number; format?: 'webp' | 'jpeg' }
): string {
  // Placeholder for future optimization
  // When you set up Firebase Resize Images extension or a CDN:
  // return `${url}?w=${options?.width || 200}&h=${options?.height || 200}&format=${options?.format || 'webp'}`;
  return url;
}

/**
 * Utility to check if an image URL is from Firebase Storage
 */
export function isFirebaseStorageUrl(url: string): boolean {
  return url.includes('firebasestorage.googleapis.com') || url.includes('firebase.com');
}
