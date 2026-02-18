import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { Court } from './courts';
import { getActiveCheckInsCount } from './courtActivity';
import { showCheckInNotification } from './notifications';

const NOTIFICATIONS_ENABLED_KEY = 'notifications-enabled';
const NOTIFICATION_DEBOUNCE_MS = 5 * 60 * 1000; // 5 minutes

// Track recent notifications to debounce
const recentNotifications = new Map<string, number>();

/**
 * Load notification settings
 */
export async function getNotificationsEnabled(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Failed to load notification settings:', error);
    return false;
  }
}

/**
 * Save notification settings
 */
export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled.toString());
  } catch (error) {
    console.error('Failed to save notification settings:', error);
  }
}

/**
 * Check if we should notify for a court (debouncing logic)
 */
function shouldNotify(courtId: string, playerCount: number): boolean {
  // Only notify for 1-3 players (not for already-busy courts)
  if (playerCount < 1 || playerCount > 3) {
    return false;
  }

  // Check debounce
  const lastNotification = recentNotifications.get(courtId);
  const now = Date.now();

  if (lastNotification && now - lastNotification < NOTIFICATION_DEBOUNCE_MS) {
    return false;
  }

  return true;
}

/**
 * Record that we notified for a court
 */
function recordNotification(courtId: string): void {
  recentNotifications.set(courtId, Date.now());
}

/**
 * Subscribe to nearby check-in activity
 * Monitors all nearby courts and shows notifications when someone checks in
 */
export function subscribeToNearbyCheckIns(
  nearbyCourts: Court[],
  userCheckInId: string | null
): () => void {
  if (nearbyCourts.length === 0) {
    return () => {}; // No-op if no courts
  }

  const courtIds = nearbyCourts.map((c) => c.id);

  console.log('[NearbyActivity] Subscribing to check-ins for', courtIds.length, 'courts');

  const channel = supabase
    .channel('nearby-checkins')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'check_ins',
      },
      async (payload) => {
        const courtId = payload.new.court_id;
        const checkInUserId = payload.new.user_id;

        // Don't notify for own check-ins
        if (checkInUserId === userCheckInId) {
          return;
        }

        // Check if this court is nearby
        const court = nearbyCourts.find((c) => c.id === courtId);
        if (!court) {
          return;
        }

        // Check if notifications are enabled
        const enabled = await getNotificationsEnabled();
        if (!enabled) {
          return;
        }

        // Get current check-in count
        const count = await getActiveCheckInsCount(courtId);

        // Check if we should notify
        if (shouldNotify(courtId, count)) {
          console.log('[NearbyActivity] Showing notification for', court.name, 'with', count, 'players');
          await showCheckInNotification(court, count);
          recordNotification(courtId);
        }
      }
    )
    .subscribe();

  return () => {
    console.log('[NearbyActivity] Unsubscribing from nearby check-ins');
    channel.unsubscribe();
  };
}
