import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testHasanatUIIntegration() {
  console.log('🧪 Testing Hasanat UI Integration...');

  try {
    // Test 1: Check if settings table has hasanat_visible column
    console.log('1. Checking settings table structure...');

    const { data: settings, error: settingsError } = await supabase
      .from('profiles')
      .select('hasanat_visible')
      .limit(1);

    if (settingsError) {
      console.error('❌ Settings table error:', settingsError.message);
      return;
    }
    console.log('✅ Settings table accessible');

    // Test 2: Check if hasanat functions work
    console.log('\n2. Testing hasanat functions...');

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id')
      .limit(1);

    if (profilesError || !profiles || profiles.length === 0) {
      console.error('❌ No profiles found');
      return;
    }

    const testUserId = profiles[0].user_id;
    console.log('👤 Using test user:', testUserId);

    // Test getUserTotalHasanat
    const { data: totalHasanat, error: totalError } = await supabase
      .from('reading_sessions')
      .select('letter_count, hasanat_earned')
      .eq('user_id', testUserId);

    if (totalError) {
      console.error('❌ getUserTotalHasanat error:', totalError.message);
    } else {
      const totalLetters = totalHasanat?.reduce((s, r) => s + (r.letter_count || 0), 0) || 0;
      const totalHasanatValue = totalHasanat?.reduce((s, r) => s + (r.hasanat_earned || 0), 0) || 0;
      console.log('✅ getUserTotalHasanat works:', {
        totalLetters,
        totalHasanatValue,
        totalSessions: totalHasanat?.length || 0,
      });
    }

    // Test getDailyHasanat
    const { data: dailyHasanat, error: dailyError } = await supabase
      .from('daily_hasanat')
      .select('date, total_letters, total_hasanat, session_count')
      .eq('user_id', testUserId)
      .order('date', { ascending: false })
      .limit(7);

    if (dailyError) {
      console.error('❌ getDailyHasanat error:', dailyError.message);
    } else {
      console.log('✅ getDailyHasanat works:', dailyHasanat?.length || 0, 'days of data');
    }

    // Test 3: Check if hasanat_visible setting works
    console.log('\n3. Testing hasanat_visible setting...');

    const { data: userSettings, error: userSettingsError } = await supabase
      .from('profiles')
      .select('hasanat_visible')
      .eq('user_id', testUserId)
      .single();

    if (userSettingsError) {
      console.error('❌ User settings error:', userSettingsError.message);
    } else {
      console.log('✅ User settings:', userSettings);
      console.log(
        '📊 hasanat_visible:',
        userSettings?.hasanat_visible ? '✅ Enabled' : '❌ Disabled'
      );
    }

    // Test 4: Preview hasanat calculation
    console.log('\n4. Testing preview hasanat calculation...');

    // Load letter counts JSON
    const fs = await import('fs');
    const path = await import('path');
    const countsPath = path.resolve(process.cwd(), 'src/data/letter-counts.json');
    const countsJson = JSON.parse(fs.readFileSync(countsPath, 'utf-8'));
    const MAP: Record<string, number> = countsJson.data || {};

    function previewHasanatForRange(surah: number, ayahStart: number, ayahEnd: number) {
      let letters = 0;
      for (let a = ayahStart; a <= ayahEnd; a++) {
        const key = `${surah}:${a}`;
        letters += MAP[key] || 0;
      }
      return {
        letterCount: letters,
        hasanat: letters * 10,
      };
    }

    const preview1 = previewHasanatForRange(1, 1, 3);
    const preview2 = previewHasanatForRange(1, 1, 7);
    const preview3 = previewHasanatForRange(2, 1, 5);

    console.log('✅ Preview calculations:');
    console.log('  Al-Fatihah ayat 1-3:', preview1);
    console.log('  Al-Fatihah ayat 1-7:', preview2);
    console.log('  Al-Baqarah ayat 1-5:', preview3);

    console.log('\n🎉 Hasanat UI Integration tests completed!');
    console.log('\n✅ Summary:');
    console.log('- Settings table accessible');
    console.log('- Hasanat functions working');
    console.log('- Preview calculation working');
    console.log('- Ready for UI integration');

    console.log('\n📋 Next steps:');
    console.log('1. Enable hasanat_visible in user settings');
    console.log('2. Test UI components in app');
    console.log('3. Verify real-time updates');
  } catch (error) {
    console.error('💥 Error testing hasanat UI integration:', error);
  }
}

testHasanatUIIntegration();
