#!/usr/bin/env node
/**
 * OpenStreetMap Court Importer
 *
 * Fetches basketball courts from OpenStreetMap and imports them to Supabase.
 *
 * Usage:
 *   npm run import-courts -- --city="atlanta"                         # City proper only
 *   npm run import-courts -- --city="atlanta" --metro                 # Metro area (includes suburbs)
 *   npm run import-courts -- --city="atlanta" --geocode               # Add detailed addresses (slower)
 *   npm run import-courts -- --city="atlanta" --metro --geocode       # Metro + addresses
 *   npm run import-courts -- --city="atlanta" --metro --geocode --replace  # Full replacement
 *
 * Flags:
 *   --metro      Import metro area instead of city proper (more courts)
 *   --geocode    Reverse geocode coordinates to get detailed street addresses (slower, ~1 min per 60 courts)
 *   --replace    Delete all existing courts before importing
 *
 * Available cities: atlanta, los angeles, new york, chicago, houston, phoenix,
 *                   philadelphia, san antonio, san diego, dallas
 *
 * Find custom bounding boxes at: https://boundingbox.klokantech.com/
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

/**
 * Get Supabase secret key from env or prompt user
 */
async function getSecretKey(): Promise<string> {
  // Try environment variables first (from .env or command line)
  const envKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (envKey) {
    return envKey;
  }

  // Prompt user if not in environment
  console.log('');
  console.log('🔐 Supabase secret key not found in environment variables');
  console.log('   You can add it to .env as: SUPABASE_SECRET_KEY=your_key');
  console.log('   Or pass it via: SUPABASE_SECRET_KEY=xxx npm run import-courts ...');
  console.log('');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('📋 Paste your Supabase secret key (from Dashboard → Settings → API): ', (answer) => {
      rl.close();
      const key = answer.trim();
      if (!key) {
        console.error('❌ No key provided');
        process.exit(1);
      }
      resolve(key);
    });
  });
}

interface OSMElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: {
    name?: string;
    'addr:street'?: string;
    'addr:housenumber'?: string;
    'addr:city'?: string;
    'addr:state'?: string;
    'addr:postcode'?: string;
    sport?: string;
    leisure?: string;
    indoor?: string;
    surface?: string;
    lit?: string;
    hoops?: string;
    opening_hours?: string;
    access?: string;
    description?: string;
    [key: string]: any;
  };
}

interface OSMResponse {
  elements: OSMElement[];
}

interface Court {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
  city: string | null;
  state: string | null;
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
  osm_type: string;
  osm_id: number;
  source: string;
  photos_count: number;
}

/**
 * Reverse geocode coordinates to get address
 * Uses Nominatim (free, rate-limited to 1 req/sec)
 */
async function reverseGeocode(lat: number, lon: number): Promise<{
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  park: string | null;
  neighbourhood: string | null;
  suburb: string | null;
}> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PickupBasketballApp/1.0', // Required by Nominatim
      },
    });

    if (!response.ok) {
      return { address: null, city: null, state: null, postal_code: null, park: null, neighbourhood: null, suburb: null };
    }

    const data = await response.json();
    const addr = data.address || {};

    // Build street address
    const houseNumber = addr.house_number || '';
    const road = addr.road || addr.street || '';
    const address = houseNumber && road ? `${houseNumber} ${road}` : road || null;

    return {
      address,
      city: addr.city || addr.town || addr.village || null,
      state: addr.state || null,
      postal_code: addr.postcode || null,
      park: addr.park || addr.leisure || null,
      neighbourhood: addr.neighbourhood || addr.neighborhood || null,
      suburb: addr.suburb || null,
    };
  } catch (error) {
    console.error(`   ⚠️  Geocoding failed for ${lat},${lon}:`, error);
    return { address: null, city: null, state: null, postal_code: null, park: null, neighbourhood: null, suburb: null };
  }
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Haversine distance between two lat/lon points, in meters
 */
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

/**
 * Deduplicate courts that are within thresholdMeters of each other.
 * When merging, keeps the entry with the better name and aggregates num_hoops.
 */
function deduplicateCourts(courts: Court[], thresholdMeters: number = 50): Court[] {
  const kept: Court[] = [];

  for (const candidate of courts) {
    const nearby = kept.find(
      (k) => haversineMeters(k.latitude, k.longitude, candidate.latitude, candidate.longitude) <= thresholdMeters
    );

    if (nearby) {
      // Aggregate hoops: add values together when both are known
      if (candidate.num_hoops != null) {
        nearby.num_hoops = (nearby.num_hoops ?? 0) + candidate.num_hoops;
      }
      // Prefer the candidate's name if the kept entry has a generated name (contains "Basketball Court")
      if (nearby.name.endsWith('Basketball Court') && !candidate.name.endsWith('Basketball Court')) {
        nearby.name = candidate.name;
      }
    } else {
      kept.push({ ...candidate });
    }
  }

  return kept;
}

/**
 * Fetch basketball courts from OpenStreetMap using Overpass API
 */
async function fetchOSMCourts(bbox: string): Promise<OSMResponse> {
  const [west, south, east, north] = bbox.split(',').map(parseFloat);

  const query = `
    [out:json][timeout:90];
    (
      // Outdoor basketball courts (pitches)
      node["leisure"="pitch"]["sport"="basketball"](${south},${west},${north},${east});
      way["leisure"="pitch"]["sport"="basketball"](${south},${west},${north},${east});
      relation["leisure"="pitch"]["sport"="basketball"](${south},${west},${north},${east});
      // Indoor-tagged pitches
      node["leisure"="pitch"]["sport"="basketball"]["indoor"="yes"](${south},${west},${north},${east});
      way["leisure"="pitch"]["sport"="basketball"]["indoor"="yes"](${south},${west},${north},${east});
      // Sports halls and gyms with basketball
      node["leisure"="sports_hall"]["sport"="basketball"](${south},${west},${north},${east});
      way["leisure"="sports_hall"]["sport"="basketball"](${south},${west},${north},${east});
      relation["leisure"="sports_hall"]["sport"="basketball"](${south},${west},${north},${east});
      // Sports centres with basketball (YMCAs, rec centers)
      node["leisure"="sports_centre"]["sport"="basketball"](${south},${west},${north},${east});
      way["leisure"="sports_centre"]["sport"="basketball"](${south},${west},${north},${east});
      relation["leisure"="sports_centre"]["sport"="basketball"](${south},${west},${north},${east});
    );
    out center body;
  `;

  console.log('🌍 Querying OpenStreetMap Overpass API...');

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`OSM API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Transform OSM element to Court schema
 */
function transformOSMToCourt(
  element: OSMElement,
  cityName: string,
  state: string,
  geocodedAddress?: {
    address: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    park: string | null;
    neighbourhood: string | null;
    suburb: string | null;
  }
): Court {
  const tags = element.tags || {};

  // Get coordinates (nodes have lat/lon directly, ways/relations have center)
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;

  if (lat == null || lon == null) {
    throw new Error(`Missing coordinates for OSM ${element.type} ${element.id}`);
  }

  // Generate unique ID from OSM type and ID
  const id = `osm-${element.type}-${element.id}`;

  // Parse name - try multiple sources for better names
  let name = tags.name;

  if (!name) {
    // Try to generate a descriptive name from available data
    if (geocodedAddress?.park) {
      // Named after the park
      name = `${geocodedAddress.park} Basketball Court`;
    } else if (geocodedAddress?.neighbourhood) {
      // Named after the neighborhood
      name = `${geocodedAddress.neighbourhood} Basketball Court`;
    } else if (geocodedAddress?.suburb) {
      // Named after the suburb
      name = `${geocodedAddress.suburb} Basketball Court`;
    } else if (geocodedAddress?.address) {
      // Named after the street — strip leading house number to get full street name
      const streetName = geocodedAddress.address.replace(/^\d+\s+/, ''); // e.g. "719 Brittain Drive NW" → "Brittain Drive NW"
      name = `${streetName} Basketball Court`;
    } else if (tags['addr:street']) {
      // Use OSM street tag
      name = `${tags['addr:street']} Basketball Court`;
    } else {
      // Last resort: use generic name with ID
      name = `Basketball Court ${element.id}`;
    }
  }

  // Parse address - prefer geocoded data, fallback to OSM tags
  const streetNumber = tags['addr:housenumber'] || '';
  const street = tags['addr:street'] || '';
  const osmAddress = streetNumber && street ? `${streetNumber} ${street}` : street || null;
  const address = geocodedAddress?.address || osmAddress;

  // Parse indoor/outdoor
  // Default to false (outdoor) since most basketball courts are outdoor
  // and the database requires a non-null value
  let indoor = false;
  if (tags.indoor === 'yes') indoor = true;
  else if (tags.indoor === 'no') indoor = false;
  else if (tags.leisure === 'sports_hall' || tags.leisure === 'sports_centre') indoor = true;

  // Parse surface type
  const surfaceMap: { [key: string]: string } = {
    asphalt: 'asphalt',
    concrete: 'concrete',
    wood: 'hardwood',
    parquet: 'hardwood',
    rubber: 'rubber',
    tartan: 'rubber',
    metal: 'metal',
    grass: 'grass',
  };
  const surface = tags.surface ? (surfaceMap[tags.surface.toLowerCase()] || tags.surface) : null;

  // Parse lighting
  let lighting: boolean | null = null;
  if (tags.lit === 'yes') lighting = true;
  else if (tags.lit === 'no') lighting = false;

  // Parse number of hoops
  let numHoops: number | null = null;
  if (tags.hoops) {
    const parsed = parseInt(tags.hoops, 10);
    if (!isNaN(parsed)) numHoops = parsed;
  }

  // Parse hours
  let hoursJson = null;
  let open24h = false;
  if (tags.opening_hours) {
    if (tags.opening_hours === '24/7') {
      open24h = true;
    } else {
      hoursJson = { raw: tags.opening_hours };
    }
  }

  // Parse free vs paid (OSM fee tag)
  let isFree: boolean | null = null;
  if (tags.fee === 'no') isFree = true;
  else if (tags.fee === 'yes') isFree = false;

  // Parse public vs private access (OSM access tag)
  let isPublic: boolean | null = null;
  if (tags.access === 'yes' || tags.access === 'public' || tags.access === 'permissive') isPublic = true;
  else if (tags.access === 'private' || tags.access === 'members' || tags.access === 'customers') isPublic = false;

  // Parse amenities
  const amenities: string[] = [];
  if (tags.wheelchair === 'yes') amenities.push('wheelchair_accessible');
  if (tags.description) amenities.push(tags.description);

  return {
    id,
    name,
    latitude: lat,
    longitude: lon,
    address,
    city: geocodedAddress?.city || tags['addr:city'] || cityName.replace(/\b\w/g, c => c.toUpperCase()),
    state: geocodedAddress?.state || tags['addr:state'] || state,
    postal_code: geocodedAddress?.postal_code || tags['addr:postcode'] || null,
    country: 'US',
    timezone: 'America/New_York',
    indoor,
    surface_type: surface,
    num_hoops: numHoops,
    lighting,
    open_24h: open24h,
    is_free: isFree,
    is_public: isPublic,
    hours_json: hoursJson,
    amenities_json: amenities.length > 0 ? amenities : null,
    osm_type: element.type,
    osm_id: element.id,
    source: 'osm',
    photos_count: 0,
  };
}

/**
 * Import courts to Supabase
 */
async function importCourts(supabase: any, courts: Court[], replace: boolean = false): Promise<void> {
  if (courts.length === 0) {
    console.log('⚠️  No courts to import.');
    return;
  }

  console.log(`📦 Importing ${courts.length} courts to Supabase...`);

  if (replace) {
    // Note: bulk delete is blocked by a storage cascade trigger on the courts table.
    // Upsert below will overwrite existing courts by OSM id. To fully wipe courts,
    // delete them manually in the Supabase dashboard.
    console.log('ℹ️  --replace: skipping bulk delete (blocked by storage trigger). Upsert will overwrite existing courts by id.');
  }

  // Batch insert in chunks of 100
  const BATCH_SIZE = 100;
  let imported = 0;

  for (let i = 0; i < courts.length; i += BATCH_SIZE) {
    const batch = courts.slice(i, i + BATCH_SIZE);

    const { error } = await supabase
      .from('courts')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Failed to import batch ${i / BATCH_SIZE + 1}:`, error);
      throw error;
    }

    imported += batch.length;
    console.log(`   ✓ Imported ${imported}/${courts.length} courts`);
  }

  console.log(`✅ Successfully imported ${courts.length} courts!`);
}

/**
 * City configurations
 *
 * Each city has two options:
 * - City proper: Smaller bounding box, faster queries
 * - Metro area: Larger bounding box covering suburbs, more comprehensive
 *
 * Use --metro flag to import metro area instead of city proper
 */
const CITIES: { [key: string]: { bbox: string; metroBbox: string; state: string } } = {
  'atlanta': {
    bbox: '-84.552,33.649,-84.290,33.887',           // City proper (~240 sq mi)
    metroBbox: '-85.100,33.100,-83.650,34.500',      // Full 30-county MSA: Paulding, Carroll, Coweta, Henry, Walton, Barrow, Hall, Cherokee, Forsyth, Gwinnett + core
    state: 'GA',
  },
  'los angeles': {
    bbox: '-118.668,33.704,-118.155,34.337',         // City proper (~500 sq mi)
    metroBbox: '-118.945,33.403,-117.646,34.823',    // Metro: includes Pasadena, Long Beach, Glendale, Santa Monica
    state: 'CA',
  },
  'new york': {
    bbox: '-74.259,40.477,-73.700,40.917',           // City proper (5 boroughs)
    metroBbox: '-74.520,40.345,-73.487,41.122',      // Metro: includes Yonkers, Jersey City, parts of Nassau County
    state: 'NY',
  },
  'chicago': {
    bbox: '-87.940,41.644,-87.524,42.023',           // City proper (~230 sq mi)
    metroBbox: '-88.263,41.469,-87.524,42.154',      // Metro: includes Evanston, Oak Park, Cicero
    state: 'IL',
  },
  'houston': {
    bbox: '-95.788,29.523,-95.014,30.110',           // City proper (~670 sq mi)
    metroBbox: '-95.823,29.413,-94.797,30.217',      // Metro: includes Pearland, Sugar Land, The Woodlands area
    state: 'TX',
  },
  'phoenix': {
    bbox: '-112.323,33.295,-111.933,33.863',         // City proper (~520 sq mi)
    metroBbox: '-112.664,32.974,-111.184,34.024',    // Metro: includes Scottsdale, Mesa, Tempe, Glendale
    state: 'AZ',
  },
  'philadelphia': {
    bbox: '-75.280,39.867,-74.956,40.138',           // City proper (~140 sq mi)
    metroBbox: '-75.544,39.719,-74.696,40.241',      // Metro: includes Camden, parts of Delaware County
    state: 'PA',
  },
  'san antonio': {
    bbox: '-98.691,29.214,-98.295,29.649',           // City proper (~500 sq mi)
    metroBbox: '-98.935,29.135,-98.040,29.796',      // Metro: includes surrounding areas
    state: 'TX',
  },
  'san diego': {
    bbox: '-117.255,32.534,-116.908,33.114',         // City proper (~370 sq mi)
    metroBbox: '-117.375,32.422,-116.746,33.260',    // Metro: includes La Jolla, Chula Vista, Coronado
    state: 'CA',
  },
  'dallas': {
    bbox: '-97.039,32.617,-96.463,33.023',           // City proper (~340 sq mi)
    metroBbox: '-97.084,32.543,-96.463,33.168',      // Metro: includes Irving, parts of Fort Worth metro
    state: 'TX',
  },
};

/**
 * Main execution
 */
async function main() {
  // Get Supabase credentials
  const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!SUPABASE_URL) {
    console.error('❌ Missing EXPO_PUBLIC_SUPABASE_URL in .env file');
    process.exit(1);
  }

  const SUPABASE_SECRET_KEY = await getSecretKey();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

  const args = process.argv.slice(2);

  // Parse arguments
  let cityName: string | null = null;
  let bbox: string | null = null;
  let replace = false;
  let useMetro = false;
  let geocode = false;

  for (const arg of args) {
    if (arg.startsWith('--city=')) {
      cityName = arg.split('=')[1].replace(/['"]/g, '');
    } else if (arg.startsWith('--bbox=')) {
      bbox = arg.split('=')[1].replace(/['"]/g, '');
    } else if (arg === '--replace') {
      replace = true;
    } else if (arg === '--metro') {
      useMetro = true;
    } else if (arg === '--geocode') {
      geocode = true;
    }
  }

  // If no city specified, show available cities
  if (!cityName) {
    console.log('📍 Available cities:');
    console.log('');
    Object.keys(CITIES).forEach(city => {
      console.log(`   ${city}`);
    });
    console.log('');
    console.log('Usage:');
    console.log('  npm run import-courts -- --city="atlanta"                    # City proper');
    console.log('  npm run import-courts -- --city="atlanta" --metro            # Metro area (includes suburbs)');
    console.log('  npm run import-courts -- --city="atlanta" --metro --replace  # Replace all existing courts');
    console.log('  npm run import-courts -- --city="custom" --bbox="..."        # Custom bounding box');
    console.log('');
    console.log('Flags:');
    console.log('  --metro      Use metro area bounding box (larger, includes suburbs)');
    console.log('  --geocode    Reverse geocode coordinates to get detailed addresses (slower, 1/sec)');
    console.log('  --replace    Delete all existing courts before importing');
    console.log('  --bbox       Custom bounding box (west,south,east,north)');
    console.log('');
    console.log('Find custom bounding boxes at: https://boundingbox.klokantech.com/');
    process.exit(0);
  }

  const cityKey = cityName.toLowerCase();
  const cityConfig = CITIES[cityKey];

  if (!cityConfig && !bbox) {
    console.error(`❌ Unknown city: ${cityName}`);
    console.log('');
    console.log('Either use a predefined city or provide a custom --bbox');
    console.log('Find bounding boxes at: https://boundingbox.klokantech.com/');
    process.exit(1);
  }

  const useBbox = bbox || (useMetro ? cityConfig.metroBbox : cityConfig.bbox);
  const useState = cityConfig?.state || 'Unknown';

  console.log('');
  console.log(`🏀 Importing courts for: ${cityName}${useMetro ? ' (Metro Area)' : ' (City Proper)'}`);
  console.log(`📍 Bounding box: ${useBbox}`);
  console.log(`🌍 Geocoding: ${geocode ? 'YES (slower, detailed addresses)' : 'NO (OSM tags only)'}`);
  console.log(`🗑️  Replace mode: ${replace ? 'YES' : 'NO'}`);
  console.log('');

  try {
    // Fetch from OSM
    const osmData = await fetchOSMCourts(useBbox);
    console.log(`   ✓ Found ${osmData.elements.length} courts in OpenStreetMap`);

    // Transform to court schema
    const courts: Court[] = [];
    const errors: string[] = [];

    if (geocode) {
      console.log(`   🌍 Reverse geocoding ${osmData.elements.length} courts (1/sec, will take ~${Math.ceil(osmData.elements.length / 60)} min)...`);
    }

    for (let i = 0; i < osmData.elements.length; i++) {
      const element = osmData.elements[i];

      try {
        // Reverse geocode if flag is enabled
        let geocodedAddress;
        if (geocode) {
          const lat = element.lat || element.center?.lat;
          const lon = element.lon || element.center?.lon;

          if (lat && lon) {
            geocodedAddress = await reverseGeocode(lat, lon);

            // Rate limit: 1 request per second for Nominatim
            if (i < osmData.elements.length - 1) {
              await sleep(1000);
            }

            // Progress indicator
            if ((i + 1) % 10 === 0) {
              console.log(`   ✓ Geocoded ${i + 1}/${osmData.elements.length} courts`);
            }
          }
        }

        const court = transformOSMToCourt(element, cityName, useState, geocodedAddress);
        courts.push(court);
      } catch (err) {
        errors.push(`Failed to transform ${element.type}/${element.id}: ${err}`);
      }
    }

    if (errors.length > 0) {
      console.log(`   ⚠️  ${errors.length} elements failed to transform`);
    }

    console.log(`   ✓ Transformed ${courts.length} courts`);

    // Deduplicate courts within 50m of each other, aggregating hoops
    const deduped = deduplicateCourts(courts, 50);
    if (deduped.length < courts.length) {
      console.log(`   ✓ Deduplicated ${courts.length - deduped.length} duplicate courts (within 50m)`);
    }

    // Import to Supabase
    await importCourts(supabase, deduped, replace);

    console.log('');
    console.log('🎉 Import complete!');
    console.log('');
    console.log(`Next steps:`);
    console.log(`  1. Open your app and verify courts appear`);
    console.log(`  2. Import another city: npx tsx scripts/import-osm-courts.ts --city="new york"`);
    console.log('');

  } catch (err) {
    console.error('');
    console.error('❌ Import failed:', err);
    console.error('');
    process.exit(1);
  }
}

main();
