const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugProgressTabData() {
  console.log('🔍 Debugging Progress Tab Data...\n');

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
    console.log(
      '👤 Test user:',
      testUser.display_name,
      '(ID:',
      testUser.user_id,
      ')'
    );

    // 2. Check all checkins for October 2025
    console.log('\n📅 All checkins for October 2025:');
    const { data: octoberCheckins, error: octoberError } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', testUser.user_id)
      .gte('date', '2025-10-01')
      .lte('date', '2025-10-31')
      .order('date', { ascending: true });

    if (octoberError) {
      console.error('❌ Error fetching October checkins:', octoberError);
    } else {
      console.log('October checkins:', octoberCheckins?.length || 0);
      octoberCheckins?.forEach(checkin => {
        console.log(`  ${checkin.date}: ${checkin.ayat_count} ayat`);
      });
    }

    // 3. Check if there are any duplicate checkins
    console.log('\n🔍 Checking for duplicate checkins:');
    const checkinDates = octoberCheckins?.map(c => c.date) || [];
    const uniqueDates = [...new Set(checkinDates)];

    console.log('Total checkins:', checkinDates.length);
    console.log('Unique dates:', uniqueDates.length);
    console.log(
      'Duplicates found:',
      checkinDates.length !== uniqueDates.length ? '❌' : '✅'
    );

    if (checkinDates.length !== uniqueDates.length) {
      const duplicates = checkinDates.filter(
        (date, index) => checkinDates.indexOf(date) !== index
      );
      console.log('Duplicate dates:', duplicates);
    }

    // 4. Check reading sessions for October
    console.log('\n📚 Reading sessions for October 2025:');
    const { data: octoberSessions, error: sessionsError } = await supabase
      .from('reading_sessions')
      .select('*')
      .eq('user_id', testUser.user_id)
      .gte('date', '2025-10-01')
      .lte('date', '2025-10-31')
      .order('date', { ascending: true });

    if (sessionsError) {
      console.error('❌ Error fetching October sessions:', sessionsError);
    } else {
      console.log('October sessions:', octoberSessions?.length || 0);
      octoberSessions?.forEach(session => {
        console.log(
          `  ${session.date}: Surah ${session.surah_number}, Ayat ${session.ayat_start}-${session.ayat_end} (${session.ayat_count} ayat)`
        );
      });
    }

    // 5. Check if there are any old checkins that might be causing confusion
    console.log('\n📅 All checkins (all time):');
    const { data: allCheckins, error: allError } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', testUser.user_id)
      .order('date', { ascending: true });

    if (allError) {
      console.error('❌ Error fetching all checkins:', allError);
    } else {
      console.log('All checkins:', allCheckins?.length || 0);
      allCheckins?.forEach(checkin => {
        console.log(`  ${checkin.date}: ${checkin.ayat_count} ayat`);
      });
    }

    // 6. Calculate what the streak should be based on all data
    console.log('\n🧮 Calculating streak from all data:');

    if (allCheckins && allCheckins.length > 0) {
      let currentStreak = 0;
      let lastDate = null;

      // Sort by date descending (most recent first)
      const sortedCheckins = allCheckins.sort((a, b) =>
        b.date.localeCompare(a.date)
      );

      // Start from most recent checkin
      let tempDate = new Date(sortedCheckins[0].date);
      currentStreak = 1;
      lastDate = tempDate;

      console.log(`Starting from ${sortedCheckins[0].date}`);

      // Check consecutive days backwards
      for (let i = 1; i < sortedCheckins.length; i++) {
        const checkinDate = new Date(sortedCheckins[i].date);
        const daysDiff = Math.floor(
          (tempDate - checkinDate) / (1000 * 60 * 60 * 24)
        );

        console.log(
          `  Checking ${sortedCheckins[i].date}: diff = ${daysDiff} days`
        );

        if (daysDiff === 1) {
          // Consecutive day
          currentStreak++;
          tempDate = checkinDate;
          console.log(`    ✅ Consecutive! Streak now: ${currentStreak}`);
        } else {
          // Gap found, streak breaks
          console.log(
            `    ❌ Gap found! Streak breaks at ${sortedCheckins[i].date}`
          );
          break;
        }
      }

      console.log('\n📊 Final calculation:');
      console.log('Calculated streak:', currentStreak, 'days');
      console.log(
        'Last checkin date:',
        lastDate?.toISOString().split('T')[0] || 'None'
      );
    }

    // 7. Check if there are any checkins for dates 17-23 October
    console.log('\n📅 Checking specific dates (17-23 October):');
    const specificDates = [
      '2025-10-17',
      '2025-10-18',
      '2025-10-19',
      '2025-10-20',
      '2025-10-21',
      '2025-10-22',
      '2025-10-23',
    ];

    for (const date of specificDates) {
      const checkin = allCheckins?.find(c => c.date === date);
      if (checkin) {
        console.log(`  ${date}: ${checkin.ayat_count} ayat ✅`);
      } else {
        console.log(`  ${date}: No checkin ❌`);
      }
    }

    console.log('\n✅ Progress tab data debug completed!');
    console.log('\n📱 Analysis:');
    console.log('1. Database shows 2-day streak (20-21 October)');
    console.log('2. Progress tab might be showing cached or incorrect data');
    console.log(
      '3. Need to check if there are any old checkins or data inconsistencies'
    );
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugProgressTabData();
