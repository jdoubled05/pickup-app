/**
 * Hours formatting utilities for court hours display
 */

export interface HoursJson {
  monday?: { open: string; close: string } | null;
  tuesday?: { open: string; close: string } | null;
  wednesday?: { open: string; close: string } | null;
  thursday?: { open: string; close: string } | null;
  friday?: { open: string; close: string } | null;
  saturday?: { open: string; close: string } | null;
  sunday?: { open: string; close: string } | null;
}

/**
 * Convert 24-hour time string to 12-hour format
 * @example "14:30" -> "2:30 PM"
 * @example "09:00" -> "9:00 AM"
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);

  if (isNaN(hours) || isNaN(minutes)) {
    return time; // Return original if invalid
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12; // Convert 0 to 12 for midnight

  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format hours range for a single day
 * @example { open: "06:00", close: "22:00" } -> "6:00 AM - 10:00 PM"
 */
export function formatHoursRange(
  hours: { open: string; close: string } | null | undefined
): string | null {
  if (!hours || !hours.open || !hours.close) {
    return null;
  }

  return `${formatTime(hours.open)} - ${formatTime(hours.close)}`;
}

/**
 * Get today's day name (lowercase)
 */
export function getTodayDayName(): keyof HoursJson {
  const days: (keyof HoursJson)[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];

  return days[new Date().getDay()];
}

/**
 * Format today's hours for display
 * @example "Today: 6:00 AM - 10:00 PM"
 * @example "Closed today"
 * @example null if hours data not available
 */
export function formatTodayHours(hoursJson: HoursJson | null | undefined): string | null {
  if (!hoursJson) {
    return null;
  }

  const today = getTodayDayName();
  const todayHours = hoursJson[today];

  if (todayHours === null) {
    return 'Closed today';
  }

  const range = formatHoursRange(todayHours);
  if (!range) {
    return null;
  }

  return `Today: ${range}`;
}

/**
 * Format full week hours for display
 * Returns array of strings like ["Monday: 6:00 AM - 10:00 PM", "Tuesday: Closed", ...]
 */
export function formatWeekHours(hoursJson: HoursJson | null | undefined): string[] {
  if (!hoursJson) {
    return [];
  }

  const days: { key: keyof HoursJson; label: string }[] = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  return days.map(({ key, label }) => {
    const dayHours = hoursJson[key];

    if (dayHours === null) {
      return `${label}: Closed`;
    }

    const range = formatHoursRange(dayHours);
    if (!range) {
      return `${label}: Hours unavailable`;
    }

    return `${label}: ${range}`;
  });
}

/**
 * Check if court is currently open based on hours_json
 */
export function isCourtOpen(
  hoursJson: HoursJson | null | undefined,
  open24h?: boolean | null
): boolean | null {
  // If marked as 24h, always open
  if (open24h === true) {
    return true;
  }

  if (!hoursJson) {
    return null; // Unknown
  }

  const today = getTodayDayName();
  const todayHours = hoursJson[today];

  if (todayHours === null) {
    return false; // Closed today
  }

  if (!todayHours || !todayHours.open || !todayHours.close) {
    return null; // Unknown
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [openHours, openMins] = todayHours.open.split(':').map(Number);
  const [closeHours, closeMins] = todayHours.close.split(':').map(Number);

  const openMinutes = openHours * 60 + openMins;
  const closeMinutes = closeHours * 60 + closeMins;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}
