/**
 * Stores a deep link URL that arrived before onboarding completed.
 * Consumed once by onboarding on finish so the user lands on the
 * intended screen instead of the default courts list.
 */

let _pendingUrl: string | null = null;

export function setPendingDeepLink(url: string): void {
  _pendingUrl = url;
}

export function consumePendingDeepLink(): string | null {
  const url = _pendingUrl;
  _pendingUrl = null;
  return url;
}
