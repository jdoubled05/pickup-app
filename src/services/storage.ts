import { File } from "expo-file-system";
import { supabase } from "./supabase";

const BUCKET = "avatars";

/**
 * Uploads a local image URI to Supabase Storage and returns the public URL.
 * The file is stored at avatars/{userId}.jpg and overwrites any existing photo.
 *
 * Uses the expo-file-system File class (new API) to read the file as an
 * ArrayBuffer, which is reliably compatible with Supabase storage in RN.
 */
export async function uploadAvatar(userId: string, uri: string): Promise<string> {
  if (!supabase) throw new Error("Supabase not configured");

  const file = new File(uri);
  const arrayBuffer = await file.arrayBuffer();

  const path = `${userId}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, { contentType: "image/jpeg", upsert: true });

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
