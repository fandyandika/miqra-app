import { supabase } from '@/lib/supabase';

export type FamilyData = {
  id: string;
  name: string;
  role: string;
};

export type FamilyStats = {
  total_family_ayat: number;
  avg_ayat_per_member: number;
  member_count: number;
};

export type UserTotalStats = {
  total_ayat: number;
  current_streak: number;
  longest_streak: number;
  total_sessions: number;
};

export type ComparativeStats = {
  personal: UserTotalStats;
  family: FamilyStats | null;
  families: FamilyData[];
  selectedFamilyId: string | null;
};

/**
 * Get authenticated user ID or throw error
 */
const getAuthUserId = async (): Promise<string> => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('❌ Auth error:', error);
    throw new Error('Authentication failed');
  }

  if (!user) {
    throw new Error('Not authenticated');
  }

  return user.id;
};

/**
 * Get user's families
 */
export async function getUserFamilies(): Promise<FamilyData[]> {
  const userId = await getAuthUserId();

  const { data, error } = await supabase
    .from('family_members')
    .select('family_id, role, families(id, name)')
    .eq('user_id', userId);

  if (error) {
    console.error('❌ Get families error:', error);
    throw error;
  }

  return (data || []).map((item: any) => ({
    id: item.families?.id || '',
    name: item.families?.name || 'Unknown Family',
    role: item.role || 'member',
  }));
}

/**
 * Get user's total statistics (direct from reading_sessions)
 */
export async function getUserTotalStatsDirect(): Promise<UserTotalStats> {
  const userId = await getAuthUserId();

  // Get total ayat and sessions from reading_sessions
  const { data: sessions, error: sessionsError } = await supabase
    .from('reading_sessions')
    .select('ayat_count')
    .eq('user_id', userId);

  if (sessionsError) {
    console.error('❌ Get sessions error:', sessionsError);
    throw sessionsError;
  }

  const totalAyat = sessions?.reduce((sum, session) => sum + (session.ayat_count || 0), 0) || 0;
  const totalSessions = sessions?.length || 0;

  // Get streak from streaks table
  const { data: streakData, error: streakError } = await supabase
    .from('streaks')
    .select('current, longest')
    .eq('user_id', userId)
    .maybeSingle();

  if (streakError) {
    console.warn('❌ Get streak error:', streakError);
  }

  return {
    total_ayat: totalAyat,
    current_streak: streakData?.current || 0,
    longest_streak: streakData?.longest || 0,
    total_sessions: totalSessions,
  };
}

/**
 * Get family statistics directly (without RPC)
 */
export async function getFamilyStatsDirect(familyId: string): Promise<FamilyStats | null> {
  try {
    // Get family members
    const { data: members, error: membersError } = await supabase
      .from('family_members')
      .select('user_id')
      .eq('family_id', familyId);

    if (membersError) {
      console.error('❌ Get family members error:', membersError);
      return null;
    }

    if (!members || members.length === 0) {
      return {
        total_family_ayat: 0,
        avg_ayat_per_member: 0,
        member_count: 0,
      };
    }

    const memberIds = members.map((m) => m.user_id);

    // Get reading sessions for all family members
    const { data: sessions, error: sessionsError } = await supabase
      .from('reading_sessions')
      .select('user_id, ayat_count')
      .in('user_id', memberIds);

    if (sessionsError) {
      console.error('❌ Get family sessions error:', sessionsError);
      return null;
    }

    // Calculate stats
    const totalFamilyAyat =
      sessions?.reduce((sum, session) => sum + (session.ayat_count || 0), 0) || 0;
    const memberCount = memberIds.length;
    const avgAyatPerMember = memberCount > 0 ? totalFamilyAyat / memberCount : 0;

    console.log('📊 Family stats calculated:', {
      familyId,
      memberIds,
      totalFamilyAyat,
      memberCount,
      avgAyatPerMember,
      sessionsCount: sessions?.length || 0,
      sessions: sessions?.map((s) => ({ userId: s.user_id, ayat: s.ayat_count })) || [],
    });

    return {
      total_family_ayat: totalFamilyAyat,
      avg_ayat_per_member: avgAyatPerMember,
      member_count: memberCount,
    };
  } catch (error) {
    console.error('❌ Get family stats direct error:', error);
    return null;
  }
}

/**
 * Get comparative stats with family selection (direct method)
 */
export async function getComparativeStatsWithFamiliesDirect(
  selectedFamilyId?: string
): Promise<ComparativeStats> {
  const userId = await getAuthUserId();

  // Get user's families
  const families = await getUserFamilies();

  // Get personal stats
  const personal = await getUserTotalStatsDirect();

  // If no families, return personal stats only
  if (families.length === 0) {
    return {
      personal,
      family: null,
      families: [],
      selectedFamilyId: null,
    };
  }

  // Use selected family or first family as default
  const familyId = selectedFamilyId || families[0].id;

  // Get family stats
  const family = await getFamilyStatsDirect(familyId);

  return {
    personal,
    family,
    families,
    selectedFamilyId: familyId,
  };
}
