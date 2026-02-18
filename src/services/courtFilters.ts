import AsyncStorage from '@react-native-async-storage/async-storage';
import { Court } from './courts';

const FILTERS_STORAGE_KEY = 'court-filters';

export type CourtType = 'both' | 'indoor' | 'outdoor';

export interface CourtFilters {
  courtType: CourtType;
  maxDistanceMiles: number;
  mustHaveLighting: boolean;
  multipleHoops: boolean;
  open24Hours: boolean;
}

export const DEFAULT_FILTERS: CourtFilters = {
  courtType: 'both',
  maxDistanceMiles: 25,
  mustHaveLighting: false,
  multipleHoops: false,
  open24Hours: false,
};

/**
 * Load saved filters from AsyncStorage
 */
export async function loadFilters(): Promise<CourtFilters> {
  try {
    const saved = await AsyncStorage.getItem(FILTERS_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_FILTERS, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('Failed to load filters:', error);
  }
  return DEFAULT_FILTERS;
}

/**
 * Save filters to AsyncStorage
 */
export async function saveFilters(filters: CourtFilters): Promise<void> {
  try {
    await AsyncStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  } catch (error) {
    console.error('Failed to save filters:', error);
  }
}

/**
 * Clear all filters (reset to defaults)
 */
export async function clearFilters(): Promise<void> {
  try {
    await AsyncStorage.removeItem(FILTERS_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear filters:', error);
  }
}

/**
 * Apply filters to a list of courts
 */
export function applyFilters(courts: Court[], filters: CourtFilters): Court[] {
  return courts.filter((court) => {
    // Filter by court type
    if (filters.courtType !== 'both') {
      if (filters.courtType === 'indoor' && !court.indoor) return false;
      if (filters.courtType === 'outdoor' && court.indoor) return false;
    }

    // Filter by distance
    if (court.distance_meters != null) {
      const distanceMiles = court.distance_meters / 1609.34;
      if (distanceMiles > filters.maxDistanceMiles) return false;
    }

    // Filter by lighting
    if (filters.mustHaveLighting && !court.lighting) return false;

    // Filter by multiple hoops
    if (filters.multipleHoops && (court.num_hoops || 0) < 2) return false;

    // Filter by 24 hour access
    if (filters.open24Hours && !court.open_24h) return false;

    return true;
  });
}

/**
 * Check if any filters are active (different from defaults)
 */
export function hasActiveFilters(filters: CourtFilters): boolean {
  return (
    filters.courtType !== DEFAULT_FILTERS.courtType ||
    filters.maxDistanceMiles !== DEFAULT_FILTERS.maxDistanceMiles ||
    filters.mustHaveLighting !== DEFAULT_FILTERS.mustHaveLighting ||
    filters.multipleHoops !== DEFAULT_FILTERS.multipleHoops ||
    filters.open24Hours !== DEFAULT_FILTERS.open24Hours
  );
}
