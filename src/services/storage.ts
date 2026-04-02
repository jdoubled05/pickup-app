import * as FileSystem from "expo-file-system";
import { supabase } from "./supabase";

const BUCKET = "avatars";

/**
 * Uploads a local image URI to Supabase Storage and returns the public URL.
 * The file is stored at avatars/{userId}.jpg and overwrites any existing photo.
 *
 * Uses expo-file-system to read the file as base64 then converts to Uint8Array,
 * which is the reliable approach for React Native (fetch/blob is not fully
 * compatible with Supabase storage in RN environments).
 */
export async function uploadAvatar(userId: string, uri: string): Promise<string> {
  if (!supabase) throw new Error("Supabase not configured");

  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });

  // Decode base64 → Uint8Array for Supabase storage upload
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const path = `${userId}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: "image/jpeg", upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  // Bust cache by appending a timestamp so the new photo loads immediately
  return `${data.publicUrl}?t=${Date.now()}`;
}

/**
 * Deletes the user's avatar from Supabase Storage.
 */
export async function deleteAvatar(userId: string): Promise<void> {
  if (!supabase) return;
  await supabase.storage.from(BUCKET).remove([`${userId}.jpg`]);
}
