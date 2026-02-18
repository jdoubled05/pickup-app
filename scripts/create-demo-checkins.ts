/**
 * Create Demo Check-ins for Screenshots
 *
 * This script creates check-ins for existing courts to populate the "Hot Now" filter
 *
 * Run with: npm run create-checkins
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

// Generate a random user ID for check-ins
const generateUserId = () => `demo-user-${Math.random().toString(36).substr(2, 9)}`;

async function createDemoCheckIns() {
  console.log('🔥 Creating demo check-ins for screenshots...\n');

  try {
    // 1. Get existing courts (limit to 10)
    console.log('📍 Fetching existing courts...');
    const { data: courts, error: courtsError } = await supabase
      .from('courts')
      .select('id, name, city')
      .limit(10);

    if (courtsError) {
      console.error('❌ Failed to fetch courts:', courtsError.message);
      process.exit(1);
    }

    if (!courts || courts.length === 0) {
      console.log('\n❌ No courts found in database.');
      console.log('\nℹ️  You need to import courts first!');
      console.log('   Run: npm run import-courts');
      process.exit(1);
    }

    console.log(`✅ Found ${courts.length} courts\n`);

    // 2. Select first 4 courts to make "hot"
    const hotCourts = courts.slice(0, Math.min(4, courts.length));

    // 3. Create check-ins for each hot court
    console.log('🏀 Creating check-ins...');

    for (let i = 0; i < hotCourts.length; i++) {
      const court = hotCourts[i];
      // Create 2-5 check-ins per court (varying amounts)
      const numCheckIns = 5 - i; // 5, 4, 3, 2 check-ins

      const checkInsToCreate = [];
      for (let j = 0; j < numCheckIns; j++) {
        checkInsToCreate.push({
          court_id: court.id,
          anonymous_user_id: generateUserId(),
          expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        });
      }

      const { error } = await supabase
        .from('check_ins')
        .insert(checkInsToCreate);

      if (error) {
        console.error(`   ❌ Failed to create check-ins for ${court.name}:`, error.message);
      } else {
        console.log(`   ✅ ${court.name} (${court.city || 'Unknown'}) - ${numCheckIns} player${numCheckIns > 1 ? 's' : ''} checked in`);
      }
    }

    // 4. Summary
    console.log('\n✨ Demo check-ins created!\n');
    console.log('📸 Ready for screenshots:');
    console.log('   1. Pull to refresh in the app');
    console.log('   2. Tap "Hot Now" filter');
    console.log(`   3. You should see ${hotCourts.length} hot courts with active players`);
    console.log('\nℹ️  Check-ins will expire in 2 hours');

  } catch (error) {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  }
}

// Run the script
createDemoCheckIns();
