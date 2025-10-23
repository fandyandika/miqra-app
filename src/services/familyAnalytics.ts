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
 * Get user's total statistics
 */
export async function getUserTotalStats(): Promise<UserTotalStats> {
  const userId = await getAuthUserId();

  const { data, error } = await supabase.rpc('get_user_total_stats', {
    p_user_id: userId,
  });

  if (error) {
    console.error('❌ Get user stats error:', error);
    throw error;
  }

  return {
    total_ayat: data?.total_ayat || 0,
    current_streak: data?.current_streak || 0,
    longest_streak: data?.longest_streak || 0,
    total_sessions: data?.total_sessions || 0,
  } as UserTotalStats;
}

/**
 * Get family statistics for a specific family
 */
export async function getFamilyStats(familyId: string): Promise<FamilyStats | null> {
  const { data, error } = await supabase.rpc('get_family_stats', {
    p_family_id: familyId,
  });

  if (error) {
    console.error('❌ Get family stats error:', error);
    return null;
  }

  return {
    total_family_ayat: data?.total_family_ayat || 0,
    avg_ayat_per_member: data?.avg_ayat_per_member || 0,
    member_count: data?.member_count || 0,
  } as FamilyStats;
}

/**
 * Get comparative stats with family selection
 */
export async function getComparativeStatsWithFamilies(
  selectedFamilyId?: string
): Promise<ComparativeStats> {
  const userId = await getAuthUserId();

  // Get user's families
  const families = await getUserFamilies();

  // Get personal stats
  const personal = await getUserTotalStats();

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
  const family = await getFamilyStats(familyId);

  return {
    personal,
    family,
    families,
    selectedFamilyId: familyId,
  };
}
