/**
 * Seed Test Data for App Store Screenshots
 *
 * This script creates realistic test data including:
 * - Courts with various attributes
 * - Active check-ins for "Hot Now" filter
 * - Saved courts
 *
 * Run with: npx tsx scripts/seed-test-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// San Francisco Bay Area coordinates for test courts
const TEST_COURTS = [
  {
    name: 'Golden Gate Park Courts',
    latitude: 37.7694,
    longitude: -122.4862,
    address: 'Golden Gate Park',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94118',
    indoor: false,
    surface_type: 'asphalt',
    num_hoops: 4,
    lighting: true,
    open_24h: false,
    checkIns: 5, // Hot court!
  },
  {
    name: 'Mission Rec Center',
    latitude: 37.7599,
    longitude: -122.4148,
    address: '2450 Harrison St',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94110',
    indoor: true,
    surface_type: 'hardwood',
    num_hoops: 2,
    lighting: true,
    open_24h: false,
    checkIns: 3, // Hot court!
  },
  {
    name: 'Dolores Park Basketball Courts',
    latitude: 37.7596,
    longitude: -122.4269,
    address: 'Dolores Park',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94114',
    indoor: false,
    surface_type: 'concrete',
    num_hoops: 2,
    lighting: false,
    open_24h: true,
    checkIns: 2, // Hot court!
  },
  {
    name: 'Presidio YMCA',
    latitude: 37.7989,
    longitude: -122.4662,
    address: '63 Funston Ave',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94129',
    indoor: true,
    surface_type: 'hardwood',
    num_hoops: 2,
    lighting: true,
    open_24h: false,
    checkIns: 0, // Regular court
  },
  {
    name: 'Sunset Playground',
    latitude: 37.7589,
    longitude: -122.4938,
    address: '28th Ave & Lawton St',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94122',
    indoor: false,
    surface_type: 'asphalt',
    num_hoops: 2,
    lighting: true,
    open_24h: true,
    checkIns: 0, // Regular court
  },
  {
    name: 'Chinatown YMCA',
    latitude: 37.7946,
    longitude: -122.4078,
    address: '855 Sacramento St',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94108',
    indoor: true,
    surface_type: 'hardwood',
    num_hoops: 1,
    lighting: true,
    open_24h: false,
    checkIns: 1, // Hot court!
  },
  {
    name: 'Alamo Square Courts',
    latitude: 37.7766,
    longitude: -122.4345,
    address: 'Alamo Square',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94117',
    indoor: false,
    surface_type: 'asphalt',
    num_hoops: 2,
    lighting: false,
    open_24h: true,
    checkIns: 0, // Regular court
  },
  {
    name: 'Marina Green Courts',
    latitude: 37.8043,
    longitude: -122.4376,
    address: 'Marina Blvd',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94123',
    indoor: false,
    surface_type: 'concrete',
    num_hoops: 2,
    lighting: true,
    open_24h: true,
    checkIns: 0, // Regular court
  },
];

// Generate a random user ID for check-ins
const generateUserId = () => `test-user-${Math.random().toString(36).substr(2, 9)}`;

async function seedData() {
  console.log('🌱 Starting data seeding...\n');

  try {
    // 1. Insert courts
    console.log('📍 Creating test courts...');
    const courtResults = [];

    for (const courtData of TEST_COURTS) {
      const { checkIns, ...courtFields } = courtData;

      const { data: court, error } = await supabase
        .from('courts')
        .insert({
          ...courtFields,
          location: `POINT(${courtFields.longitude} ${courtFields.latitude})`,
        })
        .select()
        .single();

      if (error) {
        console.error(`   ❌ Failed to create ${courtData.name}:`, error.message);
        continue;
      }

      console.log(`   ✅ Created: ${court.name}`);
      courtResults.push({ court, checkIns });
    }

    // 2. Create check-ins for hot courts
    console.log('\n🔥 Creating check-ins for hot courts...');

    for (const { court, checkIns } of courtResults) {
      if (checkIns === 0) continue;

      for (let i = 0; i < checkIns; i++) {
        const userId = generateUserId();
        const { error } = await supabase
          .from('check_ins')
          .insert({
            court_id: court.id,
            user_id: userId,
            expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
          });

        if (error) {
          console.error(`   ❌ Failed to create check-in for ${court.name}:`, error.message);
        }
      }

      console.log(`   ✅ Created ${checkIns} check-in${checkIns > 1 ? 's' : ''} at ${court.name}`);
    }

    // 3. Summary
    console.log('\n✨ Seed data complete!\n');
    console.log('Summary:');
    console.log(`   • ${courtResults.length} courts created`);

    const totalCheckIns = courtResults.reduce((sum, { checkIns }) => sum + checkIns, 0);
    console.log(`   • ${totalCheckIns} active check-ins created`);

    const hotCourtsCount = courtResults.filter(({ checkIns }) => checkIns > 0).length;
    console.log(`   • ${hotCourtsCount} courts are "hot" (have active check-ins)`);

    console.log('\n📸 Ready for screenshots!');
    console.log('   → Tap "Hot Now" filter to see live courts');
    console.log('   → Pull to refresh to reload data');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seed
seedData();
