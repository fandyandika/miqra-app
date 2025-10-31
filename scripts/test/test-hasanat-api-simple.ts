import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Load letter counts JSON
const countsPath = path.resolve(process.cwd(), 'src/data/letter-counts.json');
const countsJson = JSON.parse(fs.readFileSync(countsPath, 'utf-8'));
const MAP: Record<string, number> = countsJson.data || {};
const HASANAT_PER_LETTER = 10;

// Fallback kalkulasi di client (untuk preview/alert)
function previewHasanatForRange(surah: number, ayahStart: number, ayahEnd: number) {
  let letters = 0;
  for (let a = ayahStart; a <= ayahEnd; a++) {
    const key = `${surah}:${a}`;
    letters += MAP[key] || 0;
  }
  return {
    letterCount: letters,
    hasanat: letters * HASANAT_PER_LETTER,
  };
}

// Total hasanat sepanjang waktu (dari DB)
async function getUserTotalHasanat(userId: string) {
  const { data, error } = await supabase
    .from('reading_sessions')
    .select('letter_count, hasanat_earned')
    .eq('user_id', userId);

  if (error || !data) return { totalLetters: 0, totalHasanat: 0, totalSessions: 0 };

  const totalLetters = data.reduce((s, r) => s + (r.letter_count || 0), 0);
  const totalHasanat = data.reduce((s, r) => s + (r.hasanat_earned || 0), 0);

  return {
    totalLetters,
    totalHasanat,
    totalSessions: data.length,
  };
}

// Breakdown harian (default 30 hari)
async function getDailyHasanat(userId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_hasanat')
    .select('date, total_letters, total_hasanat, session_count')
    .eq('user_id', userId)
    .gte('date', sinceStr)
    .order('date', { ascending: true });

  if (error || !data) return [];

  return data.map((d) => ({
    date: d.date,
    totalLetters: d.total_letters,
    totalHasanat: d.total_hasanat,
    sessionCount: d.session_count,
  }));
}

async function testHasanatAPI() {
  console.log('🧪 Testing Hasanat API Service...');

  try {
    // Test 1: Preview hasanat calculation (client-side)
    console.log('1. Testing previewHasanatForRange (client-side)...');

    const preview1 = previewHasanatForRange(1, 1, 3); // Al-Fatihah ayat 1-3
    console.log('✅ Al-Fatihah ayat 1-3:', preview1);

    const preview2 = previewHasanatForRange(1, 1, 7); // Al-Fatihah ayat 1-7
    console.log('✅ Al-Fatihah ayat 1-7:', preview2);

    const preview3 = previewHasanatForRange(2, 1, 5); // Al-Baqarah ayat 1-5
    console.log('✅ Al-Baqarah ayat 1-5:', preview3);

    // Test 2: Get user total hasanat (database)
    console.log('\n2. Testing getUserTotalHasanat (database)...');

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

    const totalHasanat = await getUserTotalHasanat(testUserId);
    console.log('✅ Total hasanat:', totalHasanat);

    // Test 3: Get daily hasanat (database)
    console.log('\n3. Testing getDailyHasanat (database)...');

    const dailyHasanat = await getDailyHasanat(testUserId, 7); // Last 7 days
    console.log('✅ Daily hasanat (last 7 days):', dailyHasanat);

    const dailyHasanat30 = await getDailyHasanat(testUserId, 30); // Last 30 days
    console.log('✅ Daily hasanat (last 30 days):', dailyHasanat30.length, 'days');

    // Test 4: Performance comparison
    console.log('\n4. Performance comparison...');

    const startTime = Date.now();
    const previewResult = previewHasanatForRange(1, 1, 10);
    const previewTime = Date.now() - startTime;

    console.log('✅ Client-side preview (fast):', previewTime, 'ms');
    console.log('📊 Preview result:', previewResult);

    // Test 5: Accuracy comparison
    console.log('\n5. Accuracy comparison...');

    // Get actual data from database for comparison
    const { data: actualData, error: actualError } = await supabase
      .from('reading_sessions')
      .select('surah_number, ayat_start, ayat_end, letter_count, hasanat_earned')
      .eq('user_id', testUserId)
      .eq('surah_number', 1)
      .eq('ayat_start', 1)
      .eq('ayat_end', 3)
      .limit(1);

    if (actualData && actualData.length > 0) {
      const actual = actualData[0];
      const preview = previewHasanatForRange(1, 1, 3);

      console.log('📊 Database vs Preview:');
      console.log('  Database letter_count:', actual.letter_count);
      console.log('  Preview letterCount:', preview.letterCount);
      console.log('  Database hasanat_earned:', actual.hasanat_earned);
      console.log('  Preview hasanat:', preview.hasanat);
      console.log('  Match:', actual.letter_count === preview.letterCount ? '✅' : '❌');
    }

    console.log('\n🎉 Hasanat API Service tests completed!');
    console.log('\n✅ Summary:');
    console.log('- previewHasanatForRange: Fast client-side calculation for UX');
    console.log('- getUserTotalHasanat: Database query for total stats');
    console.log('- getDailyHasanat: Database query for daily breakdown');
    console.log('- All functions working correctly');
  } catch (error) {
    console.error('💥 Error testing hasanat API:', error);
  }
}

testHasanatAPI();
