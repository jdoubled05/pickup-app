import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { supabase, getSupabaseEnvStatus } from "./supabase";
import type { CheckIn, CheckInInsert, ActiveCheckInsResponse } from "@/src/types/checkins";

const ANONYMOUS_USER_ID_KEY = "anonymous_user_id";
const CURRENT_CHECK_IN_KEY = "current_check_in_court_id";

/**
 * Gets or generates an anonymous user ID for check-ins
 * Uses device ID as seed for consistency across app restarts
 */
export async function getAnonymousUserId(): Promise<string> {
  try {
    // Check if we already have an ID stored
    const existingId = await AsyncStorage.getItem(ANONYMOUS_USER_ID_KEY);
    if (existingId) {
      return existingId;
    }

    // Generate a new ID using device info
    const deviceId = Constants.deviceId || Constants.sessionId;
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 15);
    const anonymousId = `anon_${deviceId}_${timestamp}_${randomPart}`;

    // Store for future use
    await AsyncStorage.setItem(ANONYMOUS_USER_ID_KEY, anonymousId);
    return anonymousId;
  } catch (error) {
    console.error("Failed to get/generate anonymous user ID:", error);
    // Fallback to a random ID
    return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}

/**
 * Gets the court ID where the user is currently checked in (if any)
 */
async function getCurrentCheckInCourtId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(CURRENT_CHECK_IN_KEY);
  } catch {
    return null;
  }
}

/**
 * Sets the court ID where the user is currently checked in
 */
async function setCurrentCheckInCourtId(courtId: string | null): Promise<void> {
  try {
    if (courtId === null) {
      await AsyncStorage.removeItem(CURRENT_CHECK_IN_KEY);
    } else {
      await AsyncStorage.setItem(CURRENT_CHECK_IN_KEY, courtId);
    }
  } catch (error) {
    console.error("Failed to set current check-in court ID:", error);
  }
}

/**
 * Creates a check-in for the current user at a court
 * Removes any existing check-in at other courts first (one check-in at a time)
 */
export async function checkIn(courtId: string): Promise<CheckIn | null> {
  const envStatus = getSupabaseEnvStatus();
  if (!envStatus.configured || !supabase) {
    console.warn("Supabase not configured, cannot create check-in");
    return null;
  }

  try {
    const anonymousUserId = await getAnonymousUserId();

    // Remove any existing check-ins for this user (enforces one check-in at a time)
    await checkOut();

    // Create new check-in
    const checkInData: CheckInInsert = {
      court_id: courtId,
      anonymous_user_id: anonymousUserId,
    };

    const { data, error } = await supabase
      .from("check_ins")
      .insert(checkInData)
      .select()
      .single();

    if (error) {
      console.error("Failed to create check-in:", error);
      return null;
    }

    // Track current check-in locally
    await setCurrentCheckInCourtId(courtId);

    return data as CheckIn;
  } catch (error) {
    console.error("Failed to check in:", error);
    return null;
  }
}

/**
 * Removes the current user's check-in (from any court)
 */
export async function checkOut(): Promise<boolean> {
  const envStatus = getSupabaseEnvStatus();
  if (!envStatus.configured || !supabase) {
    return false;
  }

  try {
    const anonymousUserId = await getAnonymousUserId();

    // Delete all check-ins for this user
    const { error } = await supabase
      .from("check_ins")
      .delete()
      .eq("anonymous_user_id", anonymousUserId);

    if (error) {
      console.error("Failed to check out:", error);
      return false;
    }

    // Clear local tracking
    await setCurrentCheckInCourtId(null);

    return true;
  } catch (error) {
    console.error("Failed to check out:", error);
    return false;
  }
}

/**
 * Checks if the current user is checked in at a specific court
 */
export async function isCheckedInAtCourt(courtId: string): Promise<boolean> {
  const envStatus = getSupabaseEnvStatus();
  if (!envStatus.configured || !supabase) {
    return false;
  }

  try {
    const anonymousUserId = await getAnonymousUserId();

    const { data, error } = await supabase
      .from("check_ins")
      .select("id")
      .eq("court_id", courtId)
      .eq("anonymous_user_id", anonymousUserId)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (error) {
      console.error("Failed to check if user is checked in:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Failed to check if user is checked in:", error);
    return false;
  }
}

/**
 * Gets the count of active check-ins at a court
 * Returns count of non-expired check-ins
 */
export async function getActiveCheckInsCount(courtId: string): Promise<number> {
  const envStatus = getSupabaseEnvStatus();
  if (!envStatus.configured || !supabase) {
    return 0;
  }

  try {
    const { count, error } = await supabase
      .from("check_ins")
      .select("*", { count: "exact", head: true })
      .eq("court_id", courtId)
      .gt("expires_at", new Date().toISOString());

    if (error) {
      console.error("Failed to get check-ins count:", error);
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    console.error("Failed to get check-ins count:", error);
    return 0;
  }
}

/**
 * Gets active check-ins with user status for a court
 */
export async function getActiveCheckIns(
  courtId: string
): Promise<ActiveCheckInsResponse> {
  const count = await getActiveCheckInsCount(courtId);
  const isUserCheckedIn = await isCheckedInAtCourt(courtId);

  return {
    court_id: courtId,
    count,
    is_user_checked_in: isUserCheckedIn,
  };
}

/**
 * Subscribes to real-time check-in changes for a specific court
 * Returns an unsubscribe function
 */
export function subscribeToCheckIns(
  courtId: string,
  callback: (count: number) => void
): () => void {
  const envStatus = getSupabaseEnvStatus();
  if (!envStatus.configured || !supabase) {
    return () => {}; // No-op cleanup
  }

  // Initial load
  getActiveCheckInsCount(courtId).then(callback);

  // Subscribe to changes
  const channel = supabase
    .channel(`court-checkins:${courtId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "check_ins",
        filter: `court_id=eq.${courtId}`,
      },
      () => {
        // Whenever check-ins change, refetch the count
        getActiveCheckInsCount(courtId).then(callback);
      }
    )
    .subscribe();

  // Return cleanup function
  return () => {
    channel.unsubscribe();
  };
}

/**
 * Toggles check-in status for a court
 * If checked in, checks out. If checked out, checks in.
 */
export async function toggleCheckIn(courtId: string): Promise<boolean> {
  const isCheckedIn = await isCheckedInAtCourt(courtId);

  if (isCheckedIn) {
    return await checkOut();
  } else {
    const result = await checkIn(courtId);
    return !!result;
  }
}
