#!/usr/bin/env node
/**
 * Manual Court Importer
 *
 * Imports indoor courts from a CSV file (Google Sheets export) into Supabase.
 * Each row must have at minimum: name, city, state, latitude, longitude.
 *
 * Usage:
 *   npx ts-node scripts/import-manual-courts.ts templates/indoor-courts-template.csv
 *   npx ts-node scripts/import-manual-courts.ts path/to/your-courts.csv --dry-run
 *
 * Export from Google Sheets:
 *   File → Download → Comma Separated Values (.csv)
 *
 * Column reference:
 *   name          Court name (required)
 *   description   Short description
 *   address       Street address
 *   city          City (required)
 *   state         State abbreviation, e.g. GA (required)
 *   postal_code   ZIP code
 *   country       Default: United States
 *   latitude      Decimal latitude (required)
 *   longitude     Decimal longitude (required)
 *   surface_type  hardwood | rubber | synthetic | concrete | other
 *   num_hoops     Number of hoops (integer)
 *   lighting      yes | no | (blank = unknown)
 *   open_24h      yes | no | (blank = unknown)
 *   is_free       yes | no | (blank = unknown)
 *   is_public     yes | no | (blank = unknown)
 *   hours_open    e.g. 06:00
 *   hours_close   e.g. 22:00
 *   timezone      e.g. America/New_York (default: America/New_York)
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { createClient } from '@supabase/supabase-js';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CsvRow {
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude: string;
  longitude: string;
  surface_type: string;
  num_hoops: string;
  lighting: string;
  open_24h: string;
  is_free: string;
  is_public: string;
  hours_open: string;
  hours_close: string;
  timezone: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 40);
}

function makeId(row: CsvRow): string {
  const parts = [row.name, row.city, row.state, row.latitude, row.longitude]
    .map((s) => slugify(s))
    .join('-');
  return `manual-${parts}`.substring(0, 120);
}

function parseBool(val: string): boolean | null {
  const v = val.trim().toLowerCase();
  if (v === 'yes' || v === 'true' || v === '1') return true;
  if (v === 'no' || v === 'false' || v === '0') return false;
  return null;
}

function parseNum(val: string): number | null {
  const n = parseInt(val.trim(), 10);
  return isNaN(n) ? null : n;
}

function parseHours(open: string, close: string): unknown | null {
  const o = open.trim();
  const c = close.trim();
  if (!o && !c) return null;
  return { open: o || null, close: c || null };
}

function parseCsv(content: string): CsvRow[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('#'));
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim());

  return lines.slice(1).map((line) => {
    // Handle quoted fields with commas inside
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);

    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] ?? '').trim();
    });
    return row as unknown as CsvRow;
  });
}

function rowToDbCourt(row: CsvRow): Record<string, unknown> {
  const lat = parseFloat(row.latitude);
  const lon = parseFloat(row.longitude);

  return {
    id: makeId(row),
    name: row.name.trim(),
    description: row.description.trim() || null,
    address: row.address.trim() || null,
    city: row.city.trim() || null,
    state: row.state.trim() || null,
    postal_code: row.postal_code.trim() || null,
    country: row.country.trim() || 'United States',
    timezone: row.timezone.trim() || 'America/New_York',
    latitude: isNaN(lat) ? null : lat,
    longitude: isNaN(lon) ? null : lon,
    indoor: true, // This template is for indoor courts
    surface_type: row.surface_type.trim() || null,
    num_hoops: parseNum(row.num_hoops),
    lighting: parseBool(row.lighting),
    open_24h: parseBool(row.open_24h),
    is_free: parseBool(row.is_free),
    is_public: parseBool(row.is_public),
    hours_json: parseHours(row.hours_open, row.hours_close),
    amenities_json: null,
    osm_type: null,
    osm_id: null,
    photos_count: 0,
  };
}

function validateRow(row: CsvRow, index: number): string[] {
  const errors: string[] = [];
  if (!row.name?.trim()) errors.push(`Row ${index + 2}: 'name' is required`);
  if (!row.city?.trim()) errors.push(`Row ${index + 2}: 'city' is required`);
  if (!row.state?.trim()) errors.push(`Row ${index + 2}: 'state' is required`);
  const lat = parseFloat(row.latitude);
  const lon = parseFloat(row.longitude);
  if (isNaN(lat) || lat < -90 || lat > 90) errors.push(`Row ${index + 2}: invalid latitude '${row.latitude}'`);
  if (isNaN(lon) || lon < -180 || lon > 180) errors.push(`Row ${index + 2}: invalid longitude '${row.longitude}'`);
  return errors;
}

async function getSecretKey(): Promise<string> {
  const envKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (envKey) return envKey;

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('📋 Paste your Supabase secret key (Dashboard → Settings → API): ', (answer) => {
      rl.close();
      const key = answer.trim();
      if (!key) { console.error('❌ No key provided'); process.exit(1); }
      resolve(key);
    });
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const csvPath = args.find((a) => !a.startsWith('--'));
  const dryRun = args.includes('--dry-run');

  if (!csvPath) {
    console.error('Usage: npx ts-node scripts/import-manual-courts.ts <path-to-csv> [--dry-run]');
    process.exit(1);
  }

  const fullPath = path.resolve(csvPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ File not found: ${fullPath}`);
    process.exit(1);
  }

  console.log(`\n📄 Reading ${path.basename(fullPath)}...`);
  const content = fs.readFileSync(fullPath, 'utf8');
  const rows = parseCsv(content);

  if (rows.length === 0) {
    console.error('❌ No data rows found (check the CSV has a header row and at least one data row)');
    process.exit(1);
  }

  console.log(`📋 Found ${rows.length} court(s)\n`);

  // Validate
  const allErrors: string[] = rows.flatMap((r, i) => validateRow(r, i));
  if (allErrors.length > 0) {
    console.error('❌ Validation errors:');
    allErrors.forEach((e) => console.error(`   ${e}`));
    process.exit(1);
  }

  // Preview
  const courts = rows.map(rowToDbCourt);
  courts.forEach((c, i) => {
    const lat = typeof c.latitude === 'number' ? c.latitude.toFixed(4) : '?';
    const lon = typeof c.longitude === 'number' ? c.longitude.toFixed(4) : '?';
    console.log(`  ${i + 1}. ${c.name} — ${c.city}, ${c.state} (${lat}, ${lon})`);
  });

  if (dryRun) {
    console.log('\n✅ Dry run complete — no data written.');
    return;
  }

  // Connect to Supabase
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    console.error('❌ EXPO_PUBLIC_SUPABASE_URL not set in .env');
    process.exit(1);
  }

  const secretKey = await getSecretKey();
  const supabase = createClient(supabaseUrl, secretKey);

  console.log(`\n📦 Upserting ${courts.length} courts to Supabase...`);

  const { error } = await supabase
    .from('courts')
    .upsert(courts, { onConflict: 'id' });

  if (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }

  console.log(`✅ Successfully imported ${courts.length} court(s)!`);
  console.log('   Re-running with the same CSV will update existing rows (no duplicates).\n');
}

main().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
