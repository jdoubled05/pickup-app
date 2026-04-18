#!/usr/bin/env node
/**
 * Backfills the PostGIS `location` geometry column for courts that have
 * latitude/longitude but a null location. The courts_nearby RPC uses
 * ST_DWithin(c.location, ...) so courts with null location are invisible.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;

if (!SUPABASE_URL || !SECRET_KEY) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SECRET_KEY);

async function main() {
  console.log('Backfilling location geometry for courts with null location...');

  // Use raw SQL via the REST API to run the UPDATE
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      UPDATE public.courts
      SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
      WHERE location IS NULL
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
    `
  });

  if (error) {
    // exec_sql RPC may not exist — try a workaround by fetching courts with null location
    // and upserting them to trigger the BEFORE INSERT trigger
    console.log('exec_sql RPC not available, using upsert workaround...');

    let offset = 0;
    const batchSize = 500;
    let totalFixed = 0;

    while (true) {
      // Fetch courts where location is null (we can't query PostGIS directly via REST easily)
      // Instead, re-upsert all newly imported courts to trigger the location trigger
      const { data: courts, error: fetchErr } = await supabase
        .from('courts')
        .select('id, latitude, longitude, name, city, state, country, timezone, source')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .in('source', ['osm', 'google'])
        .range(offset, offset + batchSize - 1);

      if (fetchErr) {
        console.error('Fetch error:', fetchErr.message);
        break;
      }

      if (!courts || courts.length === 0) break;

      // Re-upsert to trigger the BEFORE INSERT/UPDATE trigger that populates location
      const { error: upsertErr } = await supabase
        .from('courts')
        .upsert(courts, { onConflict: 'id' });

      if (upsertErr) {
        console.error('Upsert error:', upsertErr.message);
        break;
      }

      totalFixed += courts.length;
      console.log(`  Processed ${totalFixed} courts...`);
      offset += batchSize;

      if (courts.length < batchSize) break;
    }

    console.log(`Done. Re-upserted ${totalFixed} courts to trigger location backfill.`);
  } else {
    console.log('Location backfill complete via SQL:', data);
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
