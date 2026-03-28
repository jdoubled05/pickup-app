import { supabase } from "./supabase";

const BUCKET = "avatars";

/**
 * Uploads a local image URI to Supabase Storage and returns the public URL.
 * The file is stored at avatars/{userId}.jpg and overwrites any existing photo.
 */
export async function uploadAvatar(userId: string, uri: string): Promise<string> {
  if (!supabase) throw new Error("Supabase not configured");

  // Fetch the image as a blob
  const response = await fetch(uri);
  const blob = await response.blob();

  const path = `${userId}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "image/jpeg", upsert: true });

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
