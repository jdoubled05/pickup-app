import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase, getSupabaseEnvStatus } from './supabase';
import { getAnonymousUserId } from './checkins';

export interface CourtPhoto {
  id: string;
  court_id: string;
  user_id: string;
  storage_path: string;
  thumbnail_path: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  uploaded_at: string;
  is_primary: boolean;
  url: string; // Public URL to view the photo
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Request camera permissions
 */
export async function requestCameraPermissions(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

/**
 * Request media library permissions
 */
export async function requestMediaLibraryPermissions(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

/**
 * Pick an image from the camera roll
 */
export async function pickImage(): Promise<ImagePicker.ImagePickerAsset | null> {
  try {
    const hasPermission = await requestMediaLibraryPermissions();
    if (!hasPermission) {
      console.warn('Media library permission denied');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      exif: false, // Don't need EXIF data
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0];
  } catch (error) {
    console.error('Failed to pick image:', error);
    return null;
  }
}

/**
 * Take a photo with the camera
 */
export async function takePhoto(): Promise<ImagePicker.ImagePickerAsset | null> {
  try {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) {
      console.warn('Camera permission denied');
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      exif: false,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0];
  } catch (error) {
    console.error('Failed to take photo:', error);
    return null;
  }
}

/**
 * Upload a photo to Supabase Storage and create a database record
 */
export async function uploadCourtPhoto(
  courtId: string,
  imageAsset: ImagePicker.ImagePickerAsset,
  onProgress?: (progress: UploadProgress) => void
): Promise<CourtPhoto | null> {
  const envStatus = getSupabaseEnvStatus();
  if (!envStatus.configured || !supabase) {
    console.warn('Supabase not configured, cannot upload photo');
    return null;
  }

  try {
    const userId = await getAnonymousUserId();
    const timestamp = Date.now();
    const fileExt = imageAsset.uri.split('.').pop() || 'jpg';
    const fileName = `${userId}_${timestamp}.${fileExt}`;
    const storagePath = `${courtId}/${fileName}`;

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(imageAsset.uri, {
      encoding: 'base64',
    });

    // Convert base64 to Uint8Array for React Native
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('court-photos')
      .upload(storagePath, bytes, {
        contentType: `image/${fileExt}`,
        upsert: false,
      });

    if (uploadError) {
      console.error('Failed to upload photo to storage:', uploadError);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('court-photos')
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Create database record
    const { data: photoData, error: dbError } = await supabase
      .from('court_photos')
      .insert({
        court_id: courtId,
        user_id: userId,
        storage_path: storagePath,
        file_size: imageAsset.fileSize || null,
        width: imageAsset.width || null,
        height: imageAsset.height || null,
        is_primary: false, // Will be set manually later
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to create photo record:', dbError);
      // Clean up storage if DB insert fails
      await supabase.storage.from('court-photos').remove([storagePath]);
      return null;
    }

    return {
      ...photoData,
      url: publicUrl,
    } as CourtPhoto;
  } catch (error) {
    console.error('Failed to upload court photo:', error);
    return null;
  }
}

/**
 * Get all photos for a court
 */
export async function getCourtPhotos(courtId: string): Promise<CourtPhoto[]> {
  const envStatus = getSupabaseEnvStatus();
  if (!envStatus.configured || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('court_photos')
      .select('*')
      .eq('court_id', courtId)
      .order('is_primary', { ascending: false })
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch court photos:', error);
      return [];
    }

    // Add public URLs to each photo
    return (data || []).map((photo) => ({
      ...photo,
      url: getPhotoPublicUrl(photo.storage_path),
    })) as CourtPhoto[];
  } catch (error) {
    console.error('Failed to get court photos:', error);
    return [];
  }
}

/**
 * Delete a photo (user can only delete their own)
 */
export async function deleteCourtPhoto(photoId: string): Promise<boolean> {
  const envStatus = getSupabaseEnvStatus();
  if (!envStatus.configured || !supabase) {
    return false;
  }

  try {
    const userId = await getAnonymousUserId();

    // Fetch photo to get storage path and verify ownership
    const { data: photo, error: fetchError } = await supabase
      .from('court_photos')
      .select('*')
      .eq('id', photoId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !photo) {
      console.error('Photo not found or unauthorized:', fetchError);
      return false;
    }

    // Delete from database (trigger will handle storage cleanup)
    const { error: deleteError } = await supabase
      .from('court_photos')
      .delete()
      .eq('id', photoId);

    if (deleteError) {
      console.error('Failed to delete photo:', deleteError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to delete court photo:', error);
    return false;
  }
}

/**
 * Set a photo as the primary photo for a court
 */
export async function setPrimaryPhoto(photoId: string): Promise<boolean> {
  const envStatus = getSupabaseEnvStatus();
  if (!envStatus.configured || !supabase) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('court_photos')
      .update({ is_primary: true })
      .eq('id', photoId);

    if (error) {
      console.error('Failed to set primary photo:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to set primary photo:', error);
    return false;
  }
}

/**
 * Get the public URL for a photo
 */
function getPhotoPublicUrl(storagePath: string): string {
  const envStatus = getSupabaseEnvStatus();
  if (!envStatus.configured || !supabase) {
    return '';
  }

  const { data } = supabase.storage
    .from('court-photos')
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

/**
 * Convert base64 string to Blob
 */
function base64ToBlob(base64: string, contentType: string): Blob {
  const byteCharacters = atob(base64);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);

    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
}

/**
 * Get count of photos for a court
 */
export async function getCourtPhotosCount(courtId: string): Promise<number> {
  const envStatus = getSupabaseEnvStatus();
  if (!envStatus.configured || !supabase) {
    return 0;
  }

  try {
    const { count, error } = await supabase
      .from('court_photos')
      .select('*', { count: 'exact', head: true })
      .eq('court_id', courtId);

    if (error) {
      console.error('Failed to get photos count:', error);
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    console.error('Failed to get photos count:', error);
    return 0;
  }
}
