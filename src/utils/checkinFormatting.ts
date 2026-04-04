/**
 * Pure formatting helpers for check-in display.
 * Extracted here so they can be unit-tested without React Native deps.
 */

export function formatDuration(checkedInAt: string, expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - new Date(checkedInAt).getTime();
  const totalMins = Math.round(ms / 60000);
  if (totalMins < 60) return `${totalMins}m`;
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

/**
 * Determines whether a completed check-in was manually checked out.
 *
 * Auto-expiry fires exactly 3 hours after created_at.
 * Manual checkout sets expires_at = NOW() (which will be < 2h55m after created_at).
 *
 * Returns null when the check-in is still active or created_at is unavailable.
 */
export function isManualCheckout(
  createdAt: string | null | undefined,
  expiresAt: string,
  isActive: boolean
): boolean | null {
  if (isActive || !createdAt) return null;
  const durationMs =
    new Date(expiresAt).getTime() - new Date(createdAt).getTime();
  const autoExpiryMs = 3 * 60 * 60 * 1000;
  return durationMs < autoExpiryMs - 5 * 60 * 1000;
}
