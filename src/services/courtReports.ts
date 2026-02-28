import { supabase, getSupabaseEnvStatus } from './supabase';
import { getAnonymousUserId } from './checkins';

export interface CourtReport {
  courtId: string;
  fieldName: string;
  correctValue: string;
}

/**
 * Submit one or more field corrections for a court.
 * Each report is stored as a separate row for easy admin review.
 * Silently no-ops if Supabase is not configured.
 */
export async function submitCourtReports(reports: CourtReport[]): Promise<void> {
  if (reports.length === 0) return;

  const envStatus = getSupabaseEnvStatus();
  if (!envStatus.configured || !supabase) return;

  const anonymousUserId = await getAnonymousUserId();

  const rows = reports.map((r) => ({
    court_id: r.courtId,
    anonymous_user_id: anonymousUserId,
    field_name: r.fieldName,
    correct_value: r.correctValue,
  }));

  const { error } = await supabase.from('court_reports').insert(rows);
  if (error) throw error;
}
