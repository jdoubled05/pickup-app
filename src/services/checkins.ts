import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { supabase, getSupabaseEnvStatus } from "./supabase";
import type { CheckIn, CheckInInsert, ActiveCheckInsResponse, CheckInHistoryItem, CheckInDetailData, CheckInDetailFriend } from "@/src/types/checkins";

const ANONYMOUS_USER_ID_KEY = "anonymous_user_id";
const CURRENT_CHECK_IN_KEY = "current_check_in_court_id";

/**
 * Returns the authenticated user ID if signed in, otherwise the anonymous device ID.
 * Use this everywhere instead of getAnonymousUserId() so check-ins are always
 * attributed to the right identity.
 */
export async function getCurrentUserId(): Promise<string> {
  try {
    if (supabase) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.id) return session.user.id;
    }
  } catch {
    // Fall through to anonymous ID
  }
  return getAnonymousUserId();
}

/**
 * Gets or generates an anonymous user ID for check-ins
 * Uses device ID as seed for consistency across app restarts
 */
export async function getAnonymousUserId(): Promise<string> {
  try {
    const existingId = await AsyncStorage.getItem(ANONYMOUS_USER_ID_KEY);
    if (existingId) return existingId;

    const deviceId = Constants.deviceId || Constants.sessionId;
    const anonymousId = `anon_${deviceId}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    await AsyncStorage.setItem(ANONYMOUS_USER_ID_KEY, anonymousId);
    return anonymousId;
  } catch {
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
  } catch {
    // non-critical
  }
}

/**
 * Creates a check-in for the current user at a court.
 * Expires any existing check-in first (one check-in at a time).
 */
export async function checkIn(courtId: string): Promise<CheckIn | null> {
  const envStatus = getSupabaseEnvStatus();
  if (!envStatus.configured || !supabase) return null;

  try {
    const userId = await getCurrentUserId();

    // Resolve auth UUID separately so we can store it in the typed user_id column
    let authUserId: string | null = null;
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      authUserId = session?.user?.id ?? null;
    }

    // Expire any existing check-in (enforces one check-in at a time)
    await checkOut();

    const checkInData: CheckInInsert = {
      court_id: courtId,
      anonymous_user_id: userId,
      user_id: authUserId,
    };

    const { data, error } = await supabase
      .from("check_ins")
      .insert(checkInData)
      .select()
      .single();

    if (error) return null;

    await setCurrentCheckInCourtId(courtId);
    return data as CheckIn;
  } catch {
    return null;
  }
}

/**
 * Expires the current user's active check-in.
 * Sets expires_at to NOW() so the checkout time is accurate for the history detail view.
 * The row is kept in the DB so it appears in check-in history.
 */
export async function checkOut(): Promise<boolean> {
  const envStatus = getSupabaseEnvStatus();
  if (!envStatus.configured || !supabase) return false;

  try {
    const userId = await getCurrentUserId();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("check_ins")
      .update({ expires_at: now })
      .eq("anonymous_user_id", userId)
      .gt("expires_at", now);

    if (error) return false;

    await setCurrentCheckInCourtId(null);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if the current user is checked in at a specific court
 */
export async function isCheckedInAtCourt(courtId: string): Promise<boolean> {
  const envStatus = getSupabaseEnvStatus();
  if (!envStatus.configured || !supabase) return false;

  try {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from("check_ins")
      .select("id")
      .eq("court_id", courtId)
      .eq("anonymous_user_id", userId)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
}

/**
 * Gets the count of active check-ins at a court
 */
export async function getActiveCheckInsCount(courtId: string): Promise<number> {
  const envStatus = getSupabaseEnvStatus();
  if (!envStatus.configured || !supabase) return 0;

  try {
    const { count, error } = await supabase
      .from("check_ins")
      .select("*", { count: "exact", head: true })
      .eq("court_id", courtId)
      .gt("expires_at", new Date().toISOString());

    if (error) return 0;
    return count ?? 0;
  } catch {
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
  return { court_id: courtId, count, is_user_checked_in: isUserCheckedIn };
}

/**
 * Subscribes to real-time check-in changes for a specific court.
 * Returns an unsubscribe function.
 */
export function subscribeToCheckIns(
  courtId: string,
  callback: (count: number) => void
): () => void {
  const envStatus = getSupabaseEnvStatus();
  if (!envStatus.configured || !supabase) return () => {};

  getActiveCheckInsCount(courtId).then(callback);

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
      () => getActiveCheckInsCount(courtId).then(callback)
    )
    .subscribe();

  return () => channel.unsubscribe();
}

/**
 * Toggles check-in status for a court.
 */
export async function toggleCheckIn(courtId: string): Promise<boolean> {
  const isCheckedIn = await isCheckedInAtCourt(courtId);
  if (isCheckedIn) return checkOut();
  const result = await checkIn(courtId);
  return !!result;
}

/**
 * Returns the total number of check-ins ever made by the given user ID.
 */
export async function getUserCheckInCount(userId: string): Promise<number> {
  if (!supabase) return 0;
  try {
    const { count, error } = await supabase
      .from("check_ins")
      .select("id", { count: "exact", head: true })
      .eq("anonymous_user_id", userId);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Returns the user's recent check-in history with court details.
 * Includes both active and expired check-ins, most recent first.
 */
export async function getUserCheckInHistory(
  userId: string,
  limit = 10
): Promise<CheckInHistoryItem[]> {
  if (!supabase) return [];
  try {
    const { data: checkIns, error } = await supabase
      .from("check_ins")
      .select("id, court_id, expires_at")
      .eq("anonymous_user_id", userId)
      .order("expires_at", { ascending: false })
      .limit(limit);

    if (error || !checkIns || checkIns.length === 0) return [];

    const courtIds = [...new Set(checkIns.map((c) => c.court_id))];
    const { data: courts } = await supabase
      .from("courts")
      .select("id, name, address")
      .in("id", courtIds);

    const courtMap = new Map((courts ?? []).map((c) => [c.id, c]));
    const now = new Date().toISOString();

    return checkIns
      .map((ci) => {
        const court = courtMap.get(ci.court_id);
        if (!court) return null;
        return {
          id: ci.id,
          court_id: ci.court_id,
          court_name: court.name,
          court_address: court.address,
          checked_in_at: new Date(
            new Date(ci.expires_at).getTime() - 3 * 60 * 60 * 1000
          ).toISOString(),
          expires_at: ci.expires_at,
          is_active: ci.expires_at > now,
        };
      })
      .filter((item): item is CheckInHistoryItem => item !== null);
  } catch {
    return [];
  }
}

/**
 * Returns full detail for a single check-in, including checkout type and
 * any friends who were checked in at the same court during the same session.
 */
export async function getCheckInDetail(checkInId: string): Promise<CheckInDetailData | null> {
  if (!supabase) return null;
  try {
    // Fetch check-in row — try with created_at first (available after migration 012)
    let checkIn: { id: string; court_id: string; user_id: string | null; expires_at: string; created_at?: string } | null = null;

    const { data: withCreatedAt, error: errWithCreatedAt } = await supabase
      .from("check_ins")
      .select("id, court_id, user_id, expires_at, created_at")
      .eq("id", checkInId)
      .single();

    if (!errWithCreatedAt && withCreatedAt) {
      checkIn = withCreatedAt;
    } else {
      // created_at column may not exist yet — fall back
      const { data: without, error: errWithout } = await supabase
        .from("check_ins")
        .select("id, court_id, user_id, expires_at")
        .eq("id", checkInId)
        .single();
      if (errWithout || !without) return null;
      checkIn = without;
    }

    // Fetch court
    const { data: court } = await supabase
      .from("courts")
      .select("name, address")
      .eq("id", checkIn.court_id)
      .single();

    const now = new Date().toISOString();
    const isActive = checkIn.expires_at > now;

    // Derive check-in time: use created_at if available, else expires_at - 3h
    const checkedInAt = checkIn.created_at
      ? checkIn.created_at
      : new Date(new Date(checkIn.expires_at).getTime() - 3 * 60 * 60 * 1000).toISOString();

    // Determine manual vs auto checkout.
    // Auto-expiry sets expires_at = created_at + 3h exactly.
    // Manual checkout sets expires_at = NOW() (actual checkout time, < 3h after created_at).
    // Use 2h55m as the threshold to give a 5-minute buffer around the 3h window.
    let isManualCheckout: boolean | null = null;
    if (!isActive && checkIn.created_at) {
      const durationMs = new Date(checkIn.expires_at).getTime() - new Date(checkIn.created_at).getTime();
      const autoExpiryMs = 3 * 60 * 60 * 1000;
      isManualCheckout = durationMs < autoExpiryMs - 5 * 60 * 1000;
    }

    // Find friends at the same court during this session
    const friends: CheckInDetailFriend[] = [];
    const authUserId = checkIn.user_id;

    if (authUserId) {
      // Get accepted friend IDs
      const { data: friendships } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .or(`requester_id.eq.${authUserId},addressee_id.eq.${authUserId}`)
        .eq("status", "accepted");

      const friendIds = (friendships ?? []).map((f) =>
        f.requester_id === authUserId ? f.addressee_id : f.requester_id
      );

      if (friendIds.length > 0) {
        // Fetch friend check-ins at this court that ended after my session started
        const { data: friendCheckIns } = await supabase
          .from("check_ins")
          .select("user_id, expires_at")
          .eq("court_id", checkIn.court_id)
          .in("user_id", friendIds)
          .gt("expires_at", checkedInAt);

        // Filter to sessions that also started before my session ended
        const overlapping = (friendCheckIns ?? []).filter((fci) => {
          const friendStart = new Date(fci.expires_at).getTime() - 3 * 60 * 60 * 1000;
          return friendStart < new Date(checkIn!.expires_at).getTime();
        });

        if (overlapping.length > 0) {
          const userIds = [...new Set(overlapping.map((fci) => fci.user_id).filter(Boolean))] as string[];
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, username, avatar_url")
            .in("id", userIds);

          for (const p of profiles ?? []) {
            friends.push({ user_id: p.id, username: p.username, avatar_url: p.avatar_url });
          }
        }
      }
    }

    return {
      id: checkIn.id,
      court_id: checkIn.court_id,
      court_name: court?.name ?? "Unknown Court",
      court_address: court?.address ?? null,
      checked_in_at: checkedInAt,
      expires_at: checkIn.expires_at,
      is_active: isActive,
      is_manual_checkout: isActive ? null : isManualCheckout,
      friends_at_court: friends,
    };
  } catch {
    return null;
  }
}
