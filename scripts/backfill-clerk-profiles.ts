/**
 * Backfill Script: Sync Clerk Users to Supabase Profiles
 * 
 * This script fetches all users from Clerk and creates Supabase profiles
 * for any users that don't already have one.
 * 
 * Required Environment Variables:
 * - CLERK_SECRET_KEY: Your Clerk secret key (from Clerk Dashboard > API Keys)
 * - SUPABASE_URL: Your Supabase project URL (loaded from .env)
 * - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key (loaded from .env)
 * 
 * Usage:
 *   CLERK_SECRET_KEY=sk_live_xxx npx tsx scripts/backfill-clerk-profiles.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load .env file
config();

// Configuration
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment
if (!CLERK_SECRET_KEY) {
  console.error('❌ Missing CLERK_SECRET_KEY environment variable');
  console.log('   Get it from: Clerk Dashboard > API Keys > Secret keys');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.log('   Need: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client with service role (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface ClerkUser {
  id: string;
  email_addresses: Array<{
    email_address: string;
    id: string;
    verification: { status: string };
  }>;
  first_name: string | null;
  last_name: string | null;
  created_at: number;
}

interface ClerkUserListResponse {
  data: ClerkUser[];
  total_count: number;
}

/**
 * Fetch all users from Clerk (paginated)
 */
async function fetchAllClerkUsers(): Promise<ClerkUser[]> {
  const allUsers: ClerkUser[] = [];
  let offset = 0;
  const limit = 100; // Clerk's max per page
  
  console.log('📥 Fetching users from Clerk...');
  
  while (true) {
    const response = await fetch(
      `https://api.clerk.com/v1/users?limit=${limit}&offset=${offset}`,
      {
        headers: {
          'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Clerk API error: ${response.status} - ${error}`);
    }
    
    const users: ClerkUser[] = await response.json();
    
    if (users.length === 0) break;
    
    allUsers.push(...users);
    console.log(`   Fetched ${allUsers.length} users so far...`);
    
    if (users.length < limit) break; // Last page
    offset += limit;
  }
  
  console.log(`✅ Total Clerk users: ${allUsers.length}`);
  return allUsers;
}

/**
 * Get all existing profile user_ids from Supabase
 */
async function getExistingProfileUserIds(): Promise<Set<string>> {
  console.log('📥 Fetching existing profiles from Supabase...');
  
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id');
  
  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }
  
  const userIds = new Set(data?.map(p => p.user_id) || []);
  console.log(`✅ Existing Supabase profiles: ${userIds.size}`);
  return userIds;
}

/**
 * Create a profile for a Clerk user
 */
async function createProfile(user: ClerkUser): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      user_id: user.id,
      user_context: 'high_school_11th', // Default context
      credits: 10, // Give them the standard 10 free credits
      has_completed_assessment: false,
      status: 'initial',
    })
    .select('id')
    .single();
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true };
}

/**
 * Main backfill function
 */
async function backfillProfiles() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Clerk → Supabase Profile Backfill Script');
  console.log('═══════════════════════════════════════════════════\n');
  
  try {
    // Fetch data from both sources
    const clerkUsers = await fetchAllClerkUsers();
    const existingUserIds = await getExistingProfileUserIds();
    
    // Find missing profiles
    const missingUsers = clerkUsers.filter(u => !existingUserIds.has(u.id));
    
    console.log('\n📊 Summary:');
    console.log(`   Clerk users:      ${clerkUsers.length}`);
    console.log(`   Supabase profiles: ${existingUserIds.size}`);
    console.log(`   Missing profiles:  ${missingUsers.length}`);
    
    if (missingUsers.length === 0) {
      console.log('\n✅ All users already have profiles! Nothing to do.');
      return;
    }
    
    // Display missing users
    console.log('\n📋 Users without profiles:');
    missingUsers.forEach((user, i) => {
      const email = user.email_addresses[0]?.email_address || 'no-email';
      const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Unknown';
      const created = new Date(user.created_at).toLocaleDateString();
      console.log(`   ${i + 1}. ${email} (${name}) - signed up ${created}`);
    });
    
    // Confirm before proceeding
    console.log('\n⚠️  About to create profiles for these users.');
    console.log('   Each will receive 10 free credits.\n');
    
    // Create missing profiles
    console.log('🔄 Creating profiles...\n');
    
    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ user: string; error: string }> = [];
    
    for (const user of missingUsers) {
      const email = user.email_addresses[0]?.email_address || user.id;
      const result = await createProfile(user);
      
      if (result.success) {
        successCount++;
        console.log(`   ✅ Created profile for ${email}`);
      } else {
        errorCount++;
        errors.push({ user: email, error: result.error || 'Unknown error' });
        console.log(`   ❌ Failed for ${email}: ${result.error}`);
      }
    }
    
    // Final summary
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  Backfill Complete!');
    console.log('═══════════════════════════════════════════════════');
    console.log(`   ✅ Profiles created: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\n   Failed users:');
      errors.forEach(e => console.log(`      - ${e.user}: ${e.error}`));
    }
    
    // Verify final count
    const finalCount = await getExistingProfileUserIds();
    console.log(`\n   📊 Final Supabase profile count: ${finalCount.size}`);
    
  } catch (error: any) {
    console.error('\n❌ Error during backfill:', error.message);
    process.exit(1);
  }
}

// Run the script
backfillProfiles();

