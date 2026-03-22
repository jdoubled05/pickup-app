import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase, getSupabaseEnvStatus } from "./supabase";

const ASYNC_STORAGE_KEY = "saved_court_ids";

type SavedCourtsListener = (ids: string[]) => void;

let savedIds: string[] = [];
const savedIdSet = new Set<string>();
const listeners = new Set<SavedCourtsListener>();
let initialized = false;
let currentUserId: string | null = null;

const notify = () => {
  const ids = [...savedIds];
  listeners.forEach((l) => l(ids));
};

const setIds = (ids: string[]) => {
  savedIds = ids;
  savedIdSet.clear();
  ids.forEach((id) => savedIdSet.add(id));
  notify();
};

// --- Persistence helpers ---

async function loadFromStorage(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

async function saveToStorage(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Non-fatal
  }
}

async function loadFromSupabase(userId: string): Promise<string[]> {
  const { configured } = getSupabaseEnvStatus();
  if (!configured || !supabase) return [];
  const { data, error } = await supabase
    .from("saved_courts")
    .select("court_id")
    .eq("user_id", userId);
  if (error) return [];
  return (data ?? []).map((row: { court_id: string }) => row.court_id);
}

async function addToSupabase(userId: string, courtId: string): Promise<void> {
  const { configured } = getSupabaseEnvStatus();
  if (!configured || !supabase) return;
  await supabase
    .from("saved_courts")
    .upsert({ user_id: userId, court_id: courtId });
}

async function removeFromSupabase(userId: string, courtId: string): Promise<void> {
  const { configured } = getSupabaseEnvStatus();
  if (!configured || !supabase) return;
  await supabase
    .from("saved_courts")
    .delete()
    .eq("user_id", userId)
    .eq("court_id", courtId);
}

// --- Public API ---

export const getSavedCourtIds = async (): Promise<string[]> => {
  if (!initialized) await hydrateSavedCourts();
  return [...savedIds];
};

export const countSavedCourts = () => savedIds.length;

export const isCourtSaved = (id: string) => savedIdSet.has(id);

export const toggleSavedCourt = async (id: string): Promise<void> => {
  if (!initialized) await hydrateSavedCourts();

  if (savedIdSet.has(id)) {
    savedIdSet.delete(id);
    savedIds = savedIds.filter((s) => s !== id);
    notify();
    if (currentUserId) {
      await removeFromSupabase(currentUserId, id);
    } else {
      await saveToStorage([...savedIds]);
    }
  } else {
    savedIdSet.add(id);
    savedIds = [...savedIds, id];
    notify();
    if (currentUserId) {
      await addToSupabase(currentUserId, id);
    } else {
      await saveToStorage([...savedIds]);
    }
  }
};

export const removeSavedCourt = async (id: string): Promise<void> => {
  if (!savedIdSet.has(id)) return;
  savedIdSet.delete(id);
  savedIds = savedIds.filter((s) => s !== id);
  notify();
  if (currentUserId) {
    await removeFromSupabase(currentUserId, id);
  } else {
    await saveToStorage([...savedIds]);
  }
};

export const subscribeSavedCourts = (listener: SavedCourtsListener) => {
  listeners.add(listener);
  listener([...savedIds]);
  return () => {
    listeners.delete(listener);
  };
};

/**
 * Call on app start to load persisted saved courts (AsyncStorage for anonymous,
 * Supabase for authenticated users).
 */
export const hydrateSavedCourts = async (): Promise<string[]> => {
  initialized = true;
  const ids = currentUserId
    ? await loadFromSupabase(currentUserId)
    : await loadFromStorage();
  setIds(ids);
  return [...ids];
};

/**
 * Called by AuthContext when auth state changes. Switches between local and
 * Supabase-backed storage and reloads the saved courts list.
 */
export const setCurrentUser = async (userId: string | null): Promise<void> => {
  currentUserId = userId;
  initialized = false;
  await hydrateSavedCourts();
};
