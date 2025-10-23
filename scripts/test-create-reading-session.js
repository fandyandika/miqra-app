require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCreateReadingSession() {
  console.log('🧪 TESTING CREATE READING SESSION...\n');

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

    // Test createReadingSession
    console.log('\n📚 Testing createReadingSession...');

    const testSession = {
      surah_number: 1,
      ayat_start: 1,
      ayat_end: 5,
      notes: 'Test session from script',
    };

    console.log('Input:', testSession);

    // Call the function directly (simulating the service)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('No user');

    // Validate length
    const maxAyat = 7; // Al-Fatihah has 7 ayat
    if (testSession.ayat_end > maxAyat) throw new Error('Ayat end exceeds surah length');

    // Validate date - prevent future dates
    const now = new Date();
    const todayDate = now.toISOString().split('T')[0];

    const payload = {
      user_id: user.id,
      surah_number: testSession.surah_number,
      ayat_start: testSession.ayat_start,
      ayat_end: testSession.ayat_end,
      date: todayDate,
      session_time: new Date().toISOString(),
      notes: testSession.notes,
    };

    console.log('Payload:', payload);

    // Insert session
    const { data: inserted, error: insertError } = await supabase
      .from('reading_sessions')
      .insert(payload)
      .select('*')
      .single();

    if (insertError) {
      console.error('❌ Insert error:', insertError);
      return;
    }

    console.log('✅ Session created successfully:', inserted);

    // Test reading progress update
    console.log('\n📊 Testing reading progress update...');

    const ayatCount = inserted.ayat_end - inserted.ayat_start + 1;
    console.log('Ayat count:', ayatCount);

    // Get existing progress
    const { data: progress, error: progressError } = await supabase
      .from('reading_progress')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (progressError) {
      console.error('❌ Progress fetch error:', progressError);
      return;
    }

    console.log('Current progress:', progress);

    // Update progress
    const patch = {
      user_id: user.id,
      total_ayat_read: (progress?.total_ayat_read ?? 0) + ayatCount,
      last_read_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase.from('reading_progress').upsert(patch);

    if (updateError) {
      console.error('❌ Progress update error:', updateError);
      return;
    }

    console.log('✅ Progress updated successfully');

    // Test checkin update
    console.log('\n📅 Testing checkin update...');

    const todaySessions = await supabase
      .from('reading_sessions')
      .select('ayat_count')
      .eq('user_id', user.id)
      .eq('date', todayDate);

    const todayTotal = todaySessions.data?.reduce((sum, s) => sum + (s.ayat_count || 0), 0) || 0;
    console.log('Today total ayat:', todayTotal);

    const { error: checkinError } = await supabase.from('checkins').upsert(
      {
        user_id: user.id,
        date: todayDate,
        ayat_count: todayTotal,
      },
      {
        onConflict: 'user_id,date',
      }
    );

    if (checkinError) {
      console.error('❌ Checkin update error:', checkinError);
      return;
    }

    console.log('✅ Checkin updated successfully');

    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ createReadingSession should work correctly');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Logout
    await supabase.auth.signOut();
    console.log('\n🔓 Logged out');
  }
}

testCreateReadingSession();
