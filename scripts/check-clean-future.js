const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndCleanFutureData() {
  console.log('🔍 CHECKING AND CLEANING FUTURE DATA...\n');

  try {
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Today: ${today}`);

    // Check all checkins
    const { data: allCheckins } = await supabase
      .from('checkins')
      .select('user_id, date, ayat_count')
      .order('date', { ascending: true });

    console.log(`📊 Total checkins: ${allCheckins?.length || 0}`);

    if (allCheckins) {
      allCheckins.forEach((checkin, index) => {
        const isFuture = checkin.date > today;
        const isToday = checkin.date === today;
        const isPast = checkin.date < today;
        console.log(
          `  ${index + 1}. ${checkin.date} (${checkin.ayat_count} ayat) - ${isFuture ? '❌ FUTURE' : isToday ? '✅ TODAY' : '✅ PAST'}`
        );
      });
    }

    // Find future checkins
    const futureCheckins = allCheckins?.filter((c) => c.date > today) || [];
    console.log(`\n🗑️ Future checkins found: ${futureCheckins.length}`);

    if (futureCheckins.length > 0) {
      console.log('Removing future checkins...');

      for (const checkin of futureCheckins) {
        const { error } = await supabase
          .from('checkins')
          .delete()
          .eq('user_id', checkin.user_id)
          .eq('date', checkin.date);

        if (error) {
          console.log(`❌ Error removing ${checkin.date}: ${error.message}`);
        } else {
          console.log(`✅ Removed ${checkin.date}`);
        }
      }
    }

    // Check again
    const { data: finalCheckins } = await supabase
      .from('checkins')
      .select('user_id, date, ayat_count')
      .order('date', { ascending: true });

    const finalFutureCheckins = finalCheckins?.filter((c) => c.date > today) || [];
    console.log(`\n📊 Final future checkins: ${finalFutureCheckins.length}`);

    if (finalFutureCheckins.length === 0) {
      console.log('✅ All future data cleaned successfully!');
    } else {
      console.log('⚠️ Some future data still exists');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAndCleanFutureData();
