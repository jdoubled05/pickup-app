#!/usr/bin/env node
/**
 * Court Submission Review Tool
 *
 * Admin tool to review pending court submissions.
 *
 * Usage:
 *   npm run review-courts                # List all pending submissions
 *   npm run review-courts -- approve <id>  # Approve a submission
 *   npm run review-courts -- reject <id> "reason"  # Reject a submission
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
  console.log('   Or pass it via: SUPABASE_SECRET_KEY=xxx npm run review-courts');
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

interface PendingCourt {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number;
  longitude: number;
  indoor: boolean | null;
  num_hoops: number | null;
  lighting: boolean | null;
  surface_type: string | null;
  notes: string | null;
  submitted_by: string;
  submitted_at: string;
  status: string;
}

async function listPendingCourts(supabase: any) {
  const { data, error } = await supabase
    .from('pending_courts')
    .select('*')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching submissions:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('✓ No pending submissions!');
    return;
  }

  console.log(`\n📋 ${data.length} Pending Court Submission${data.length > 1 ? 's' : ''}:\n`);

  data.forEach((court, index) => {
    console.log(`${index + 1}. ${court.name}`);
    console.log(`   ID: ${court.id}`);
    console.log(`   Address: ${court.address || 'Not provided'}`);
    console.log(`   City/State: ${court.city || '?'}, ${court.state || '?'}`);
    console.log(`   Location: ${court.latitude}, ${court.longitude}`);
    console.log(`   Indoor: ${court.indoor === null ? 'Unknown' : court.indoor ? 'Yes' : 'No'}`);
    console.log(`   Hoops: ${court.num_hoops || 'Unknown'}`);
    console.log(`   Lighting: ${court.lighting === null ? 'Unknown' : court.lighting ? 'Yes' : 'No'}`);
    console.log(`   Surface: ${court.surface_type || 'Unknown'}`);
    if (court.notes) console.log(`   Notes: ${court.notes}`);
    console.log(`   Submitted: ${new Date(court.submitted_at).toLocaleString()}`);
    console.log(`   Google Maps: https://www.google.com/maps?q=${court.latitude},${court.longitude}`);
    console.log('');
  });

  console.log('Next steps:');
  console.log('  npm run review-courts -- approve <id>');
  console.log('  npm run review-courts -- reject <id> "reason"');
  console.log('');
}

async function approveCourt(supabase: any, courtId: string) {
  console.log(`\n🔍 Fetching court ${courtId}...`);

  const { data: pending, error: fetchError } = await supabase
    .from('pending_courts')
    .select('*')
    .eq('id', courtId)
    .single();

  if (fetchError || !pending) {
    console.error('❌ Court not found');
    return;
  }

  console.log(`\nApproving: ${pending.name}`);

  // Generate new court ID
  const newCourtId = `user-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  // Insert into courts table
  const { error: insertError } = await supabase.from('courts').insert({
    id: newCourtId,
    name: pending.name,
    address: pending.address,
    city: pending.city,
    state: pending.state,
    postal_code: pending.postal_code,
    country: 'United States',
    timezone: 'America/New_York', // TODO: Infer from coords
    latitude: pending.latitude,
    longitude: pending.longitude,
    indoor: pending.indoor,
    surface_type: pending.surface_type,
    num_hoops: pending.num_hoops,
    lighting: pending.lighting,
    open_24h: null,
    hours_json: null,
    amenities_json: null,
    osm_type: 'user-submitted',
    osm_id: null,
    photos_count: 0,
    photo_url: null,
  });

  if (insertError) {
    console.error('❌ Failed to create court:', insertError);
    return;
  }

  // Update pending court status
  const { error: updateError } = await supabase
    .from('pending_courts')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', courtId);

  if (updateError) {
    console.error('❌ Failed to update status:', updateError);
    return;
  }

  console.log(`✅ Court approved and added to database!`);
  console.log(`   Court ID: ${newCourtId}`);
  console.log(`   Name: ${pending.name}`);
  console.log('');
  console.log('TODO: Send notification to user (not implemented yet)');
  console.log('');
}

async function rejectCourt(supabase: any, courtId: string, reason: string) {
  console.log(`\n🔍 Fetching court ${courtId}...`);

  const { data: pending, error: fetchError } = await supabase
    .from('pending_courts')
    .select('*')
    .eq('id', courtId)
    .single();

  if (fetchError || !pending) {
    console.error('❌ Court not found');
    return;
  }

  console.log(`\nRejecting: ${pending.name}`);
  console.log(`Reason: ${reason}`);

  const { error: updateError } = await supabase
    .from('pending_courts')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq('id', courtId);

  if (updateError) {
    console.error('❌ Failed to reject:', updateError);
    return;
  }

  console.log(`✅ Court rejected.`);
  console.log('');
  console.log('TODO: Send notification to user (not implemented yet)');
  console.log('');
}

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

  if (args.length === 0) {
    // List pending
    await listPendingCourts(supabase);
    return;
  }

  const command = args[0];
  const courtId = args[1];

  if (command === 'approve') {
    if (!courtId) {
      console.error('❌ Usage: npm run review-courts -- approve <court-id>');
      process.exit(1);
    }
    await approveCourt(supabase, courtId);
  } else if (command === 'reject') {
    const reason = args[2];
    if (!courtId || !reason) {
      console.error('❌ Usage: npm run review-courts -- reject <court-id> "reason"');
      process.exit(1);
    }
    await rejectCourt(supabase, courtId, reason);
  } else {
    console.error(`❌ Unknown command: ${command}`);
    console.log('Available commands:');
    console.log('  npm run review-courts              # List pending');
    console.log('  npm run review-courts -- approve <id>');
    console.log('  npm run review-courts -- reject <id> "reason"');
    process.exit(1);
  }
}

main();
