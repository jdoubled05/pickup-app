/**
 * Court Activity Service
 * Manages check-in counts and live activity data
 */

import { supabase } from './supabase';

export interface CourtActivity {
  courtId: string;
  checkInsCount: number;
  lastCheckInAt: string | null;
}

/**
 * Get active check-in counts for multiple courts
 */
export async function getCourtActivityBatch(courtIds: string[]): Promise<Map<string, number>> {
  if (courtIds.length === 0) {
    return new Map();
  }

  try {
    const { data, error } = await supabase
      .from('check_ins')
      .select('court_id')
      .in('court_id', courtIds)
      .gt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Error fetching court activity:', error);
      return new Map();
    }

    // Count check-ins per court
    const counts = new Map<string, number>();
    data?.forEach((checkIn) => {
      const current = counts.get(checkIn.court_id) || 0;
      counts.set(checkIn.court_id, current + 1);
    });

    return counts;
  } catch (err) {
    console.error('Error in getCourtActivityBatch:', err);
    return new Map();
  }
}

/**
 * Get count of active check-ins for a single court
 */
export async function getActiveCheckInsCount(courtId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('check_ins')
      .select('*', { count: 'exact', head: true })
      .eq('court_id', courtId)
      .gt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Error fetching check-in count:', error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('Error in getActiveCheckInsCount:', err);
    return 0;
  }
}

/**
 * Subscribes to real-time check-in changes for a set of courts.
 * Calls callback with a refreshed activity map whenever any check-in is inserted or deleted.
 * Returns an unsubscribe function.
 */
export function subscribeToActivityUpdates(
  courtIds: string[],
  callback: (activity: Map<string, number>) => void
): () => void {
  if (courtIds.length === 0 || !supabase) return () => {};

  const channel = supabase
    .channel('court-activity-updates')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'check_ins' },
      async () => {
        const activity = await getCourtActivityBatch(courtIds);
        callback(activity);
      }
    )
    .subscribe();

  return () => { channel.unsubscribe(); };
}

/**
 * Get IDs of courts that currently have active check-ins
 */
export async function getActiveCourtsIds(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('check_ins')
      .select('court_id')
      .gt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Error fetching active courts:', error);
      return [];
    }

    // Get unique court IDs
    const uniqueIds = [...new Set(data?.map((c) => c.court_id) || [])];
    return uniqueIds;
  } catch (err) {
    console.error('Error in getActiveCourtsIds:', err);
    return [];
  }
}
