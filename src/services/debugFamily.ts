import { supabase } from '@/lib/supabase';

/**
 * Debug function untuk melihat data keluarga
 */
export async function debugFamilyData() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.log('❌ No user found');
    return;
  }

  console.log('🔍 Debug Family Data for user:', user.id);

  // 1. Cek families user
  const { data: userFamilies, error: familiesError } = await supabase
    .from('family_members')
    .select('family_id, role, families(id, name)')
    .eq('user_id', user.id);

  console.log('👥 User families:', userFamilies);
  if (familiesError) console.error('❌ Families error:', familiesError);

  if (!userFamilies || userFamilies.length === 0) {
    console.log('❌ User not in any family');
    return;
  }

  const familyId = userFamilies[0].family_id;
  console.log('🏠 Using family ID:', familyId);

  // 2. Cek family members
  const { data: familyMembers, error: membersError } = await supabase
    .from('family_members')
    .select('user_id')
    .eq('family_id', familyId);

  console.log('👨‍👩‍👧‍👦 Family members:', familyMembers);
  if (membersError) console.error('❌ Members error:', membersError);

  // 3. Cek reading sessions untuk semua member
  const memberIds = familyMembers?.map((m) => m.user_id) || [];
  console.log('📚 Member IDs:', memberIds);

  if (memberIds.length > 0) {
    const { data: readingSessions, error: sessionsError } = await supabase
      .from('reading_sessions')
      .select('user_id, ayat_count, session_time, created_at')
      .in('user_id', memberIds);

    console.log('📖 Reading sessions:', readingSessions);
    if (sessionsError) console.error('❌ Sessions error:', sessionsError);

    // Manual calculation
    const totalAyat =
      readingSessions?.reduce((sum, session) => sum + (session.ayat_count || 0), 0) || 0;
    const avgAyat = memberIds.length > 0 ? totalAyat / memberIds.length : 0;

    console.log('📊 Manual calculation:');
    console.log('  - Total family ayat:', totalAyat);
    console.log('  - Member count:', memberIds.length);
    console.log('  - Average per member:', avgAyat);
  }

  // 4. Test RPC function
  const { data: rpcResult, error: rpcError } = await supabase.rpc('get_family_stats', {
    p_family_id: familyId.toString(),
  });

  console.log('🔧 RPC result:', rpcResult);
  if (rpcError) console.error('❌ RPC error:', rpcError);

  return {
    userFamilies,
    familyMembers,
    readingSessions:
      memberIds.length > 0
        ? await supabase
            .from('reading_sessions')
            .select('user_id, ayat_count')
            .in('user_id', memberIds)
        : null,
    rpcResult,
  };
}
