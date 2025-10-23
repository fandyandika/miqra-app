const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncCheckinsAndSessions() {
  console.log('🔄 Syncing Checkins and Sessions...\n');

  try {
    // 1. Get test user
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.error('❌ No users found:', userError);
      return;
    }

    const testUser = users[0];
    console.log('👤 Test user:', testUser.display_name, '(ID:', testUser.user_id, ')');

    // 2. Get all reading sessions for October
    console.log('\n📚 Getting reading sessions for October:');
    const { data: sessions, error: sessionsError } = await supabase
      .from('reading_sessions')
      .select('*')
      .eq('user_id', testUser.user_id)
      .gte('date', '2025-10-01')
      .lte('date', '2025-10-31')
      .order('date', { ascending: true });

    if (sessionsError) {
      console.error('❌ Error fetching sessions:', sessionsError);
      return;
    }

    console.log('Total sessions:', sessions?.length || 0);

    // 3. Group sessions by date and calculate daily totals
    console.log('\n📊 Grouping sessions by date:');
    const dailyTotals = {};

    sessions?.forEach((session) => {
      const date = session.date;
      if (!dailyTotals[date]) {
        dailyTotals[date] = 0;
      }
      dailyTotals[date] += session.ayat_count || 0;
    });

    console.log('Daily totals from sessions:');
    Object.keys(dailyTotals)
      .sort()
      .forEach((date) => {
        console.log(`  ${date}: ${dailyTotals[date]} ayat`);
      });

    // 4. Get current checkins
    console.log('\n📅 Current checkins:');
    const { data: currentCheckins, error: checkinsError } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', testUser.user_id)
      .order('date', { ascending: true });

    if (checkinsError) {
      console.error('❌ Error fetching checkins:', checkinsError);
      return;
    }

    console.log('Current checkins:', currentCheckins?.length || 0);
    currentCheckins?.forEach((checkin) => {
      console.log(`  ${checkin.date}: ${checkin.ayat_count} ayat`);
    });

    // 5. Compare sessions vs checkins
    console.log('\n🔍 Comparing sessions vs checkins:');
    const sessionDates = Object.keys(dailyTotals);
    const checkinDates = currentCheckins?.map((c) => c.date) || [];

    console.log('Dates with sessions:', sessionDates.length);
    console.log('Dates with checkins:', checkinDates.length);

    // Find dates that have sessions but no checkins
    const missingCheckins = sessionDates.filter((date) => !checkinDates.includes(date));
    console.log('Dates with sessions but no checkins:', missingCheckins);

    // 6. Create missing checkins
    if (missingCheckins.length > 0) {
      console.log('\n🔧 Creating missing checkins...');

      for (const date of missingCheckins) {
        const ayatCount = dailyTotals[date];

        const { data: newCheckin, error: checkinError } = await supabase.from('checkins').insert({
          user_id: testUser.user_id,
          date: date,
          ayat_count: ayatCount,
          created_at: new Date(date + 'T08:00:00Z').toISOString(),
        });

        if (checkinError) {
          console.error(`❌ Error creating checkin for ${date}:`, checkinError);
        } else {
          console.log(`✅ Created checkin for ${date}: ${ayatCount} ayat`);
        }
      }
    }

    // 7. Recalculate streak
    console.log('\n🧮 Recalculating streak...');

    const { data: updatedCheckins } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', testUser.user_id)
      .order('date', { ascending: false });

    let currentStreak = 0;
    let lastDate = null;

    if (updatedCheckins && updatedCheckins.length > 0) {
      const sortedCheckins = updatedCheckins.sort((a, b) => b.date.localeCompare(a.date));

      // Start from most recent checkin
      let tempDate = new Date(sortedCheckins[0].date);
      currentStreak = 1;
      lastDate = tempDate;

      console.log(`Starting from ${sortedCheckins[0].date}`);

      // Check consecutive days backwards
      for (let i = 1; i < sortedCheckins.length; i++) {
        const checkinDate = new Date(sortedCheckins[i].date);
        const daysDiff = Math.floor((tempDate - checkinDate) / (1000 * 60 * 60 * 24));

        console.log(`  Checking ${sortedCheckins[i].date}: diff = ${daysDiff} days`);

        if (daysDiff === 1) {
          currentStreak++;
          tempDate = checkinDate;
          console.log(`    ✅ Consecutive! Streak now: ${currentStreak}`);
        } else {
          console.log(`    ❌ Gap found! Streak breaks at ${sortedCheckins[i].date}`);
          break;
        }
      }
    }

    console.log('\n📊 Final calculation:');
    console.log('Current streak:', currentStreak, 'days');
    console.log('Last checkin date:', lastDate?.toISOString().split('T')[0] || 'None');

    // 8. Update streaks table
    console.log('\n🔧 Updating streaks table...');

    const { data: updateResult, error: updateError } = await supabase
      .from('streaks')
      .upsert(
        {
          user_id: testUser.user_id,
          current: currentStreak,
          longest: Math.max(0, currentStreak),
          last_date: lastDate?.toISOString().split('T')[0] || null,
        },
        {
          onConflict: 'user_id',
        }
      )
      .select();

    if (updateError) {
      console.error('❌ Error updating streaks:', updateError);
    } else {
      console.log('✅ Streaks updated:', updateResult);
    }

    // 9. Verify final state
    console.log('\n🔍 Final verification:');

    const { data: finalCheckins } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', testUser.user_id)
      .order('date', { ascending: true });

    console.log('Final checkins:');
    finalCheckins?.forEach((checkin) => {
      console.log(`  ${checkin.date}: ${checkin.ayat_count} ayat`);
    });

    const { data: finalStreaks } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', testUser.user_id);

    console.log('Final streaks:', finalStreaks);

    console.log('\n✅ Sync completed!');
    console.log('\n📱 Expected App Behavior:');
    console.log('1. Home screen should show streak:', currentStreak, 'days');
    console.log('2. Progress tab should show the same streak');
    console.log('3. Calendar should highlight all reading days');
    console.log('4. Both should be consistent now');
  } catch (error) {
    console.error('❌ Sync failed:', error);
  }
}

syncCheckinsAndSessions();
