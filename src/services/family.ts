import { supabase } from '@/lib/supabase';
import { startOfDay, subDays, formatISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export async function createFamily(name: string) {
  const { data: session } = await supabase.auth.getSession();
  const uid = session?.session?.user?.id;

  if (!uid) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('families')
    .insert({ name, created_by: uid })
    .select()
    .single();

  if (error) {
    console.error('[Family] Insert family error:', error);
    throw error;
  }

  // creator becomes owner
  try {
    const { error: memberError } = await supabase
      .from('family_members')
      .insert({ family_id: data.id, user_id: uid, role: 'owner' });

    if (memberError) {
      console.warn('[Family] Failed to add owner to family_members:', memberError);
    } else {
      // owner added
    }
  } catch (error) {
    console.warn('[Family] Failed to add owner to family_members:', error);
  }

  return data;
}

export async function myFamilies() {
  const { data: session } = await supabase.auth.getSession();
  const uid = session?.session?.user?.id;

  if (!uid) {
    // no session
    return [];
  }

  const { data, error } = await supabase
    .from('family_members')
    .select('family_id, role, families(id, name, created_at)')
    .eq('user_id', uid);

  if (error) throw error;

  const result = (data ?? []).map((r: any) => ({
    id: r.families?.id || '',
    name: r.families?.name || 'Unknown Family',
    role: r.role || 'member',
  }));

  return result;
}

export async function familyMembers(familyId: string) {
  // Try with relationship first
  const { data, error } = await supabase
    .from('family_members')
    .select(
      `
      user_id,
      role,
      created_at,
      profiles(display_name)
    `
    )
    .eq('family_id', familyId);

  if (error) {
    // Fallback: get members without relationship
    const { data: membersData, error: membersError } = await supabase
      .from('family_members')
      .select('user_id, role, created_at')
      .eq('family_id', familyId);

    if (membersError) throw membersError;

    // Get profiles separately
    const userIds = membersData?.map((m) => m.user_id) || [];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', userIds);

    // Combine data
    data = membersData?.map((member) => ({
      ...member,
      profiles: [
        profilesData?.find((p) => p.user_id === member.user_id) || {
          user_id: member.user_id,
          display_name: null,
        },
      ],
    }));
  }

  return data || [];
}

export async function createInvite(familyId: string, ttlMinutes = 1440) {
  const { data, error } = await supabase.rpc('create_invite', {
    fid: familyId,
    ttl_minutes: ttlMinutes,
  });

  if (error) throw new Error(`Gagal membuat kode undangan: ${error.message}`);
  return data?.[0] ?? null; // { code, expires_at }
}

export async function redeemInvite(code: string) {
  const { data, error } = await supabase.rpc('redeem_invite', { p_code: code });
  if (error) throw error;
  return data as string; // family_id
}

export async function getFamilyTodayStats(familyId: string, timezone = 'Asia/Jakarta') {
  if (!familyId) throw new Error('familyId required');

  // 1. Fetch family members
  const { data: members, error: memberErr } = await supabase
    .from('family_members')
    .select('user_id')
    .eq('family_id', familyId);
  if (memberErr) {
    throw memberErr;
  }

  // 2. Fetch profiles separately to avoid relationship issues
  const memberIds = members?.map((m) => m.user_id) || [];
  let memberList: { id: string; name: string }[] = [];

  if (memberIds.length > 0) {
    const { data: profiles, error: profilesErr } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', memberIds);

    if (profilesErr) {
      memberList = memberIds.map((id) => ({
        id,
        name: `User ${id.slice(0, 6)}`,
      }));
    } else {
      memberList = memberIds.map((id) => {
        const profile = profiles?.find((p) => p.user_id === id);
        return {
          id,
          name: profile?.display_name || `User ${id.slice(0, 6)}`,
        };
      });
    }
  }

  if (memberIds.length === 0)
    return {
      totalMembers: 0,
      membersReadToday: 0,
      familyStreakDays: 0,
      members: [],
    };

  // 2. Determine local today range
  const nowLocal = toZonedTime(new Date(), timezone);
  const todayStart = startOfDay(nowLocal);
  const todayStr = formatISO(todayStart, { representation: 'date' });

  // 3. Fetch check-ins (30 days window)
  const since = subDays(todayStart, 30);
  const { data: checkins, error: chkErr } = await supabase
    .from('checkins')
    .select('user_id, date')
    .in('user_id', memberIds)
    .gte('date', formatISO(since, { representation: 'date' }));
  if (chkErr) {
    throw chkErr;
  }

  // 4. Compute membersReadToday
  const todayCheckins = checkins.filter((c) => c.date === todayStr);
  const readTodayIds = new Set(todayCheckins.map((c) => c.user_id));
  const membersReadToday = readTodayIds.size;

  // 5. Simple familyStreakDays (client-side)
  // Count consecutive days from today backward with any checkin
  const distinctDates = Array.from(new Set(checkins.map((c) => c.date)))
    .sort()
    .reverse();
  let streak = 0;
  let current = todayStr;
  for (const date of distinctDates) {
    if (date === current) {
      streak++;
      const prev = subDays(new Date(date), 1);
      current = formatISO(prev, { representation: 'date' });
    } else if (date < current) {
      break;
    }
  }

  const result = {
    totalMembers: memberIds.length,
    membersReadToday,
    familyStreakDays: streak,
    members: memberList.map((m) => ({
      name: m.name,
      readToday: readTodayIds.has(m.id),
    })),
  };
  return result;
}
