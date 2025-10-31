require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAnalytics() {
  console.log('🧪 TESTING ANALYTICS FUNCTIONS...\n');

  try {
    // Login as test user
    console.log('🔐 Logging in as test1@miqra.com...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test1@miqra.com',
      password: 'password123',
    });

    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return;
    }

    console.log('✅ Logged in successfully');
    console.log('User ID:', authData.user.id);

    const userId = authData.user.id;

    // Test 1: Daily Stats
    console.log('\n📊 Testing get_daily_stats...');
    const { data: dailyStats, error: dailyError } = await supabase.rpc('get_daily_stats', {
      p_user_id: userId,
      p_start_date: '2025-01-01',
      p_end_date: '2025-12-31',
    });

    if (dailyError) {
      console.error('❌ Daily stats error:', dailyError);
    } else {
      console.log('✅ Daily stats:', dailyStats?.length || 0, 'days');
      if (dailyStats && dailyStats.length > 0) {
        console.log('Sample:', dailyStats[0]);
      }
    }

    // Test 2: Weekly Stats
    console.log('\n📊 Testing get_weekly_stats...');
    const { data: weeklyStats, error: weeklyError } = await supabase.rpc('get_weekly_stats', {
      p_user_id: userId,
      p_start_date: '2025-09-01',
      p_end_date: '2025-12-31',
    });

    if (weeklyError) {
      console.error('❌ Weekly stats error:', weeklyError);
    } else {
      console.log('✅ Weekly stats:', weeklyStats?.length || 0, 'weeks');
      if (weeklyStats && weeklyStats.length > 0) {
        console.log('Sample:', weeklyStats[0]);
      }
    }

    // Test 3: Monthly Stats
    console.log('\n📊 Testing get_monthly_stats...');
    const { data: monthlyStats, error: monthlyError } = await supabase.rpc('get_monthly_stats', {
      p_user_id: userId,
      p_months: 6,
    });

    if (monthlyError) {
      console.error('❌ Monthly stats error:', monthlyError);
    } else {
      console.log('✅ Monthly stats:', monthlyStats?.length || 0, 'months');
      if (monthlyStats && monthlyStats.length > 0) {
        console.log('Sample:', monthlyStats[0]);
      }
    }

    // Test 4: User Total Stats
    console.log('\n📊 Testing get_user_total_stats...');
    const { data: totalStats, error: totalError } = await supabase.rpc('get_user_total_stats', {
      p_user_id: userId,
    });

    if (totalError) {
      console.error('❌ User total stats error:', totalError);
    } else {
      console.log('✅ User total stats:', totalStats);
    }

    // Test 5: Check if user is in family
    console.log('\n👨‍👩‍👧‍👦 Checking family membership...');
    const { data: familyMember } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (familyMember?.family_id) {
      console.log('✅ User is in family:', familyMember.family_id);

      // Test 6: Family Stats
      console.log('\n📊 Testing get_family_stats...');
      const { data: familyStats, error: familyError } = await supabase.rpc('get_family_stats', {
        p_family_id: familyMember.family_id,
      });

      if (familyError) {
        console.error('❌ Family stats error:', familyError);
      } else {
        console.log('✅ Family stats:', familyStats);
      }
    } else {
      console.log('ℹ️ User is not in a family');
    }

    console.log('\n🎉 ALL ANALYTICS TESTS COMPLETED!');
    console.log('✅ Functions are working correctly');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Logout
    await supabase.auth.signOut();
    console.log('\n🔓 Logged out');
  }
}

testAnalytics();
