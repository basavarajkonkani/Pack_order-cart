import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/lib/firebase';

/** Artwork / reference files buyers attach to a printed-pouch order. */
export const ARTWORK_MIME_TYPES = [
  'application/pdf',
  'application/postscript', // .ai / .eps
  'image/vnd.adobe.photoshop',
  'application/octet-stream', // .psd / .cdr on some platforms
  'image/png',
  'image/jpeg',
];

export const ARTWORK_MAX_BYTES = 50 * 1024 * 1024; // 50 MB

export interface PickedArtwork {
  name: string;
  size?: number;
  mimeType?: string;
  uri: string;
  /** Present on web, where the picker hands back a real File object. */
  file?: File;
}

export interface UploadedArtwork {
  name: string;
  size?: number;
  url: string;
  path: string;
}

export class ArtworkError extends Error {}

/** Opens the native/web file picker. Returns null if the user cancels. */
export async function pickArtwork(): Promise<PickedArtwork | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ARTWORK_MIME_TYPES,
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;

  const asset = result.assets?.[0];
  if (!asset) return null;

  if (asset.size != null && asset.size > ARTWORK_MAX_BYTES) {
    throw new ArtworkError('File is larger than 50 MB. Please compress it and try again.');
  }

  return {
    name: asset.name,
    size: asset.size ?? undefined,
    mimeType: asset.mimeType ?? undefined,
    uri: asset.uri,
    file: (asset as { file?: File }).file,
  };
}

/**
 * React Native's fetch can't always read local file:// URIs into a Blob, so
 * native goes through XHR (the pattern Firebase recommends for Expo).
 */
async function toBlob(picked: PickedArtwork): Promise<Blob> {
  if (picked.file) return picked.file;
  if (Platform.OS === 'web') {
    const response = await fetch(picked.uri);
    return response.blob();
  }
  return new Promise<Blob>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = () => reject(new ArtworkError('Could not read the selected file.'));
    xhr.open('GET', picked.uri, true);
    xhr.send(null);
  });
}

/** Sanitises a filename so it's safe to use inside a Storage object path. */
function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
}

/**
 * Uploads the picked file to artwork/{uid}/... and returns its download URL.
 * Requires the user to be signed in — Storage rules scope writes to own folder.
 */
export async function uploadArtwork(picked: PickedArtwork, userId: string): Promise<UploadedArtwork> {
  const blob = await toBlob(picked);
  const path = `artwork/${userId}/${Date.now()}-${safeName(picked.name)}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob, {
    contentType: picked.mimeType || blob.type || 'application/octet-stream',
  });
  return {
    name: picked.name,
    size: picked.size,
    url: await getDownloadURL(storageRef),
    path,
  };
}

export function formatFileSize(bytes?: number): string {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
