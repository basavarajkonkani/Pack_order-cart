import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Turns an arbitrary id into something safe to embed in a Storage object name.
 * New products pass their display name as the id (they have no Firestore id yet),
 * so values like "small pouches" would otherwise become object names containing
 * spaces and punctuation that have to be percent-encoded in every download URL.
 */
function slugify(id: string): string {
  const slug = id
    .toLowerCase()
    .normalize('NFKD')
    // Strip combining marks left behind by NFKD so accented letters collapse to ASCII.
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  // An id of only punctuation (or a non-Latin script) slugifies to an empty
  // string, which would produce a path like "products/images/-172...jpg".
  return slug || 'file';
}

/** Uploads a file to Firebase Storage under the given folder and returns its public download URL. */
export async function uploadFile(folder: string, file: File, id: string): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${folder}/${slugify(id)}-${Date.now()}.${ext}`;
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
