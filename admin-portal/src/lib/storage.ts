import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

/** Uploads a file to Firebase Storage under the given folder and returns its public download URL. */
export async function uploadFile(folder: string, file: File, id: string): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${folder}/${id}-${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

/**
 * Uploads a file but never throws. Firebase Storage isn't a hard dependency for
 * product creation — if the bucket isn't configured, rules reject the upload, or the
 * network call otherwise fails, this resolves to `undefined` instead of blocking the
 * caller. Callers should treat the image/video as optional and save the record anyway.
 */
export async function uploadFileSafe(folder: string, file: File, id: string): Promise<string | undefined> {
  try {
    return await uploadFile(folder, file, id);
  } catch (err) {
    console.warn(`[storage] Upload to "${folder}" failed — Storage may be unavailable. Continuing without it.`, err);
    return undefined;
  }
}

/** Best-effort delete of a previously uploaded file by its download URL. Ignores errors (e.g. already deleted). */
export async function deleteFileByUrl(url: string): Promise<void> {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn('[storage] Failed to delete file (may already be gone):', err);
  }
}
