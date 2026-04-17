#!/usr/bin/env node
/**
 * Google Places Court Importer
 *
 * Fetches indoor basketball venues from Google Places and imports them to
 * Supabase. Designed to supplement OSM data, which covers outdoor courts
 * well but misses many indoor venues (YMCAs, rec centers, community centers).
 *
 * Deduplicates against courts already in the database, so it's safe to run
 * after import-osm-courts.ts — no duplicates will be created.
 *
 * Usage:
 *   npx tsx scripts/import-google-courts.ts
 *
 * Required env vars in .env.local:
 *   EXPO_PUBLIC_SUPABASE_URL   — already present
 *   SUPABASE_SECRET_KEY        — from Supabase Dashboard → Settings → API
 *   GOOGLE_PLACES_API_KEY      — Google Cloud Console → Places API
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

// ---------------------------------------------------------------------------
// Auth helpers (mirrors import-osm-courts.ts pattern)
// ---------------------------------------------------------------------------

async function getSecretKey(): Promise<string> {
  const envKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (envKey) return envKey;

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('Paste your Supabase secret key (Dashboard → Settings → API): ', (answer) => {
      rl.close();
      const key = answer.trim();
      if (!key) { console.error('No key provided'); process.exit(1); }
      resolve(key);
    });
  });
}

async function getGoogleKey(): Promise<string> {
  const envKey = process.env.GOOGLE_PLACES_API_KEY;
  if (envKey) return envKey;

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('Paste your Google Places API key: ', (answer) => {
      rl.close();
      const key = answer.trim();
      if (!key) { console.error('No key provided'); process.exit(1); }
      resolve(key);
    });
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CourtInsert {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
  city: string;
  state: string;
  postal_code: string | null;
  country: string;
  timezone: string;
  indoor: boolean;
  surface_type: string | null;
  num_hoops: number | null;
  lighting: boolean | null;
  open_24h: boolean | null;
  is_free: boolean | null;
  is_public: boolean | null;
  hours_json: unknown;
  amenities_json: unknown;
  source: string;
  osm_type: null;
  osm_id: null;
  google_place_id: string;
  photos_count: number;
}

interface ExistingCourt {
  id: string;
  latitude: number;
  longitude: number;
}

interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: { location: { lat: number; lng: number } };
  types: string[];
  opening_hours?: { weekday_text?: string[] };
  business_status?: string;
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------------------
// Fetch existing courts from DB for dedup
// ---------------------------------------------------------------------------

async function fetchExistingCourts(
  supabase: ReturnType<typeof createClient>,
  centerLat: number,
  centerLon: number,
  radiusMeters: number
): Promise<ExistingCourt[]> {
  console.log('   Fetching existing courts from database for dedup...');

  const { data, error } = await supabase.rpc('courts_nearby', {
    lat: centerLat,
    lon: centerLon,
    radius_meters: radiusMeters,
    limit_count: 5000,
  });

  if (error) {
    console.warn(`   Warning: could not fetch existing courts (${error.message}). Dedup will be skipped.`);
    return [];
  }

  const courts = (data as ExistingCourt[]) ?? [];
  console.log(`   Found ${courts.length} existing courts in database`);
  return courts;
}

// ---------------------------------------------------------------------------
// Google Places API
// ---------------------------------------------------------------------------

async function fetchPlacesPage(
  query: string,
  apiKey: string,
  pageToken?: string
): Promise<{ results: GooglePlace[]; nextPageToken?: string }> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  url.searchParams.set('query', query);
  url.searchParams.set('key', apiKey);
  if (pageToken) url.searchParams.set('pagetoken', pageToken);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json() as {
    results: GooglePlace[];
    next_page_token?: string;
    status: string;
    error_message?: string;
  };

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`${data.status}${data.error_message ? ` — ${data.error_message}` : ''}`);
  }

  return { results: data.results ?? [], nextPageToken: data.next_page_token };
}

async function fetchAllPlaces(query: string, apiKey: string): Promise<GooglePlace[]> {
  const places: GooglePlace[] = [];
  let pageToken: string | undefined;

  do {
    if (pageToken) {
      // Google requires a 2-second delay before a page token is usable
      await new Promise(r => setTimeout(r, 2000));
    }
    const { results, nextPageToken } = await fetchPlacesPage(query, apiKey, pageToken);
    places.push(...results);
    pageToken = nextPageToken;
  } while (pageToken);

  return places;
}

// ---------------------------------------------------------------------------
// Address parsing
// ---------------------------------------------------------------------------

function parseGoogleAddress(addr: string): {
  address: string | null;
  city: string;
  state: string;
  postal_code: string | null;
} {
  // Typical format: "123 Main St, Atlanta, GA 30309, USA"
  const parts = addr
    .split(',')
    .map(s => s.trim())
    .filter(s => s !== 'USA' && s !== 'United States');

  const last = parts[parts.length - 1] ?? '';
  const stateZipMatch = last.match(/^([A-Z]{2})\s*(\d{5})?$/);

  let state = 'GA';
  let postal_code: string | null = null;
  let cityIdx = parts.length - 2;

  if (stateZipMatch) {
    state = stateZipMatch[1];
    postal_code = stateZipMatch[2] ?? null;
    cityIdx = parts.length - 2;
  }

  const city = parts[cityIdx] ?? 'Atlanta';
  const streetParts = parts.slice(0, cityIdx);
  const address = streetParts.length > 0 ? streetParts.join(', ') : null;

  return { address, city, state, postal_code };
}

// ---------------------------------------------------------------------------
// Transform Google Place → CourtInsert
// ---------------------------------------------------------------------------

function transformGooglePlace(place: GooglePlace, timezone: string): CourtInsert {
  const lat = place.geometry.location.lat;
  const lon = place.geometry.location.lng;
  const lowerName = place.name.toLowerCase();

  // Determine indoor from place types and name
  const indoor =
    place.types.some(t => ['gym', 'health', 'stadium', 'sports_complex'].includes(t)) ||
    lowerName.includes('ymca') ||
    lowerName.includes('recreation center') ||
    lowerName.includes('community center') ||
    lowerName.includes('fitness') ||
    lowerName.includes('indoor') ||
    lowerName.includes('gymnasium') ||
    lowerName.includes('athletic center');

  // Flag membership-based venues as not free / not public
  const isMembership =
    lowerName.includes('ymca') ||
    lowerName.includes('fitness') ||
    lowerName.includes('planet fitness') ||
    lowerName.includes('la fitness') ||
    lowerName.includes('24 hour fitness') ||
    lowerName.includes('anytime fitness') ||
    lowerName.includes('crunch') ||
    lowerName.includes('equinox');

  const { address, city, state, postal_code } = parseGoogleAddress(place.formatted_address);

  return {
    id: `google-${place.place_id}`,
    name: place.name,
    latitude: lat,
    longitude: lon,
    address,
    city,
    state,
    postal_code,
    country: 'US',
    timezone,
    indoor,
    surface_type: indoor ? 'hardwood' : null,
    num_hoops: null,
    lighting: indoor ? true : null,
    open_24h: null,
    is_free: isMembership ? false : null,
    is_public: isMembership ? false : null,
    hours_json: place.opening_hours?.weekday_text
      ? { weekday_text: place.opening_hours.weekday_text }
      : null,
    amenities_json: null,
    source: 'google',
    osm_type: null,
    osm_id: null,
    google_place_id: place.place_id,
    photos_count: 0,
  };
}

// ---------------------------------------------------------------------------
// City configs
// ---------------------------------------------------------------------------

interface CityConfig {
  label: string;
  center: { lat: number; lon: number };
  dedupRadiusM: number;
  timezone: string;
  queries: string[];
}

const CITY_CONFIGS: Record<string, CityConfig> = {
  atlanta: {
    label: 'Atlanta, GA',
    center: { lat: 33.749, lon: -84.388 },
    dedupRadiusM: 120000,
    timezone: 'America/New_York',
    queries: [
      'indoor basketball court Atlanta GA',
      'YMCA Atlanta GA',
      'recreation center basketball Atlanta GA',
      'community center basketball Atlanta GA',
      'basketball gym Atlanta GA',
      'YMCA Marietta GA',
      'recreation center basketball Marietta GA',
      'YMCA Roswell GA',
      'recreation center basketball Alpharetta GA',
      'YMCA Kennesaw GA',
      'community center basketball Sandy Springs GA',
      'YMCA Decatur GA',
      'recreation center basketball Lawrenceville GA',
      'YMCA Duluth GA',
      'community center basketball Gwinnett GA',
      'YMCA Peachtree City GA',
      'recreation center basketball Fayetteville GA',
      'YMCA Smyrna GA',
    ],
  },
  'los angeles': {
    label: 'Los Angeles, CA',
    center: { lat: 34.052, lon: -118.244 },
    dedupRadiusM: 80000,
    timezone: 'America/Los_Angeles',
    queries: [
      // City proper
      'indoor basketball court Los Angeles CA',
      'YMCA Los Angeles CA',
      'recreation center basketball Los Angeles CA',
      'community center basketball Los Angeles CA',
      'basketball gym Los Angeles CA',
      // West side
      'YMCA Santa Monica CA',
      'recreation center basketball Santa Monica CA',
      'YMCA Culver City CA',
      'community center basketball Venice CA',
      // San Fernando Valley
      'YMCA Burbank CA',
      'recreation center basketball Van Nuys CA',
      'YMCA Glendale CA',
      'community center basketball North Hollywood CA',
      // South LA / Long Beach
      'YMCA Long Beach CA',
      'recreation center basketball Compton CA',
      'YMCA Inglewood CA',
      'community center basketball Hawthorne CA',
      // East LA / SGV
      'YMCA Pasadena CA',
      'recreation center basketball East Los Angeles CA',
      'YMCA Alhambra CA',
      'community center basketball Pomona CA',
      // South Bay
      'YMCA Torrance CA',
      'recreation center basketball Carson CA',
      'YMCA El Segundo CA',
    ],
  },
  'new york': {
    label: 'New York City, NY',
    center: { lat: 40.712, lon: -74.006 },
    dedupRadiusM: 80000,
    timezone: 'America/New_York',
    queries: [
      // Manhattan
      'indoor basketball court Manhattan NY',
      'YMCA Manhattan New York',
      'recreation center basketball Manhattan NY',
      'community center basketball Manhattan NY',
      'basketball gym Manhattan NY',
      // Brooklyn
      'YMCA Brooklyn NY',
      'recreation center basketball Brooklyn NY',
      'community center basketball Brooklyn NY',
      // Queens
      'YMCA Queens NY',
      'recreation center basketball Flushing NY',
      'community center basketball Jamaica NY',
      // Bronx
      'YMCA Bronx NY',
      'recreation center basketball Bronx NY',
      'community center basketball South Bronx NY',
      // Staten Island
      'YMCA Staten Island NY',
      'recreation center basketball Staten Island NY',
      // New Jersey (close to NYC)
      'YMCA Jersey City NJ',
      'recreation center basketball Hoboken NJ',
      'YMCA Newark NJ',
      'community center basketball Yonkers NY',
    ],
  },
  'washington dc': {
    label: 'Washington, DC',
    center: { lat: 38.907, lon: -77.037 },
    dedupRadiusM: 60000,
    timezone: 'America/New_York',
    queries: [
      // DC proper
      'indoor basketball court Washington DC',
      'YMCA Washington DC',
      'recreation center basketball Washington DC',
      'community center basketball Washington DC',
      'basketball gym Washington DC',
      // Virginia suburbs
      'YMCA Arlington VA',
      'recreation center basketball Alexandria VA',
      'YMCA Reston VA',
      'community center basketball Falls Church VA',
      // Maryland suburbs
      'YMCA Silver Spring MD',
      'recreation center basketball Bethesda MD',
      'YMCA Rockville MD',
      'community center basketball College Park MD',
      'YMCA Hyattsville MD',
    ],
  },
};

const DEDUP_DISTANCE_M = 50;

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!SUPABASE_URL) {
    console.error('Missing EXPO_PUBLIC_SUPABASE_URL in .env.local');
    process.exit(1);
  }

  // Parse --city flag
  const cityArg = process.argv.find(a => a.startsWith('--city='))?.replace('--city=', '').toLowerCase()
    ?? 'atlanta';
  const config = CITY_CONFIGS[cityArg];
  if (!config) {
    console.error(`Unknown city: "${cityArg}". Available: ${Object.keys(CITY_CONFIGS).join(', ')}`);
    process.exit(1);
  }

  const secretKey = await getSecretKey();
  const googleKey = await getGoogleKey();
  const supabase = createClient(SUPABASE_URL, secretKey);

  console.log('');
  console.log('=== Google Places Indoor Court Importer ===');
  console.log(`City: ${config.label}`);
  console.log(`Center: ${config.center.lat}, ${config.center.lon}`);
  console.log(`Dedup radius: ${config.dedupRadiusM / 1000} km`);
  console.log('');

  // 1. Fetch existing courts for dedup
  const existing = await fetchExistingCourts(
    supabase,
    config.center.lat,
    config.center.lon,
    config.dedupRadiusM
  );

  // 2. Run all Google Places queries, collecting unique places
  console.log('\nQuerying Google Places...');
  const allPlaces = new Map<string, GooglePlace>();

  for (const query of config.queries) {
    console.log(`   "${query}"...`);
    try {
      const places = await fetchAllPlaces(query, googleKey);
      for (const p of places) allPlaces.set(p.place_id, p);
      console.log(`   → ${places.length} results (${allPlaces.size} total unique)`);
    } catch (err) {
      console.error(`   Error: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(`\nTotal unique Google places: ${allPlaces.size}`);

  // 3. Filter and transform
  const newCourts: CourtInsert[] = [];

  for (const place of allPlaces.values()) {
    // Skip permanently closed venues
    if (place.business_status === 'CLOSED_PERMANENTLY') continue;

    const lat = place.geometry.location.lat;
    const lon = place.geometry.location.lng;

    // Skip if outside the city metro area entirely
    if (haversineMeters(lat, lon, config.center.lat, config.center.lon) > config.dedupRadiusM) continue;

    // Skip if within 50m of an existing DB court
    const tooCloseToExisting = existing.some(
      c => haversineMeters(lat, lon, c.latitude, c.longitude) < DEDUP_DISTANCE_M
    );
    if (tooCloseToExisting) continue;

    // Skip if within 50m of another Google court already queued
    const tooCloseToQueued = newCourts.some(
      c => haversineMeters(lat, lon, c.latitude, c.longitude) < DEDUP_DISTANCE_M
    );
    if (tooCloseToQueued) continue;

    newCourts.push(transformGooglePlace(place, config.timezone));
  }

  const indoorCount = newCourts.filter(c => c.indoor).length;
  const outdoorCount = newCourts.length - indoorCount;
  console.log(`\nNew courts to insert: ${newCourts.length}`);
  console.log(`   Indoor: ${indoorCount} | Outdoor: ${outdoorCount}`);
  console.log(`   (${allPlaces.size - newCourts.length} skipped — already in database)`);

  if (newCourts.length === 0) {
    console.log('\nNothing to import.');
    return;
  }

  // 4. Upsert in batches
  console.log('\nUpserting to Supabase...');
  const BATCH_SIZE = 100;
  let inserted = 0;
  let errorCount = 0;

  for (let i = 0; i < newCourts.length; i += BATCH_SIZE) {
    const batch = newCourts.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('courts').upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`   Batch ${Math.floor(i / BATCH_SIZE) + 1} error: ${error.message}`);
      errorCount++;
    } else {
      inserted += batch.length;
      console.log(`   ✓ ${inserted}/${newCourts.length} courts inserted`);
    }
  }

  console.log('\n=== Done ===');
  console.log(`Inserted: ${inserted} | Failed batches: ${errorCount}`);

  if (errorCount > 0) {
    console.error('Some batches failed. Check errors above.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
