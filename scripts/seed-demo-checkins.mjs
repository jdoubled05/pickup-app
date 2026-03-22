/**
 * Seed demo check-ins for App Store screenshots.
 * Usage:
 *   node scripts/seed-demo-checkins.mjs seed
 *   node scripts/seed-demo-checkins.mjs cleanup
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config(); // load .env
config({ path: '.env.local', override: true }); // .env.local takes priority

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Atlanta center — matches DEFAULT_CENTER in location.ts
const ATLANTA_LAT = 33.749;
const ATLANTA_LON = -84.388;

// Marker prefix so cleanup is safe
const DEMO_PREFIX = 'demo-screenshot-';

async function seed() {
  console.log('Fetching nearby courts...');
  const { data: courts, error } = await supabase.rpc('courts_nearby', {
    lat: ATLANTA_LAT,
    lon: ATLANTA_LON,
    radius_meters: 10000,
    limit_count: 10,
  });

  if (error) throw new Error(`courts_nearby RPC failed: ${error.message}`);
  if (!courts?.length) throw new Error('No courts returned — is Supabase configured?');

  console.log(`Found ${courts.length} courts. Seeding check-ins...`);

  // Seed different player counts across first several courts
  const playerCounts = [5, 3, 2, 1, 4, 2];
  const now = new Date();
  const expires = new Date(now.getTime() + 3 * 60 * 60 * 1000);

  const checkIns = courts.slice(0, playerCounts.length).flatMap((court, i) =>
    Array.from({ length: playerCounts[i] }, (_, j) => ({
      court_id: court.id,
      anonymous_user_id: `${DEMO_PREFIX}${i}-${j}`,
      expires_at: expires.toISOString(),
    }))
  );

  const { error: insertError } = await supabase.from('check_ins').insert(checkIns);
  if (insertError) throw new Error(`Insert failed: ${insertError.message}`);

  console.log(`✓ Seeded ${checkIns.length} check-ins across ${playerCounts.length} courts:`);
  courts.slice(0, playerCounts.length).forEach((c, i) =>
    console.log(`  ${playerCounts[i]} players @ ${c.name}`)
  );
}

async function cleanup() {
  const { error, count } = await supabase
    .from('check_ins')
    .delete({ count: 'exact' })
    .like('anonymous_user_id', `${DEMO_PREFIX}%`);

  if (error) throw new Error(`Cleanup failed: ${error.message}`);
  console.log(`✓ Removed ${count ?? 'all'} demo check-ins`);
}

const mode = process.argv[2];
if (mode === 'seed') {
  seed().catch(err => { console.error(err.message); process.exit(1); });
} else if (mode === 'cleanup') {
  cleanup().catch(err => { console.error(err.message); process.exit(1); });
} else {
  console.error('Usage: node scripts/seed-demo-checkins.mjs seed|cleanup');
  process.exit(1);
}
