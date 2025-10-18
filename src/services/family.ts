import { supabase } from '@/lib/supabase';

export async function createFamily(name: string) {
  console.log('[Family] Creating family:', name);
  
  const { data: session } = await supabase.auth.getSession();
  const uid = session?.session?.user?.id;
  console.log('[Family] User ID:', uid);
  
  if (!uid) throw new Error('Not authenticated');

  console.log('[Family] Inserting family...');
  const { data, error } = await supabase
    .from('families')
    .insert({ name, created_by: uid })
    .select()
    .single();
    
  if (error) {
    console.error('[Family] Insert family error:', error);
    throw error;
  }
  
  console.log('[Family] Family created:', data);

  // creator becomes owner
  try {
    console.log('[Family] Adding owner to family_members...');
    const { error: memberError } = await supabase
      .from('family_members')
      .insert({ family_id: data.id, user_id: uid, role: 'owner' });
      
    if (memberError) {
      console.warn('[Family] Failed to add owner to family_members:', memberError);
    } else {
      console.log('[Family] Owner added successfully');
    }
  } catch (error) {
    console.warn('[Family] Failed to add owner to family_members:', error);
  }
  
  return data;
}

export async function myFamilies() {
  const { data: session } = await supabase.auth.getSession();
  const uid = session?.session?.user?.id;
  if (!uid) return [];
  const { data, error } = await supabase
    .from('family_members')
    .select('family_id, role, families(id, name, created_at)')
    .eq('user_id', uid);
  if (error) throw error;
  return (data ?? []).map((r:any)=>({ 
    id: r.families?.id || '', 
    name: r.families?.name || 'Unknown Family', 
    role: r.role || 'member' 
  }));
}

export async function familyMembers(familyId: string) {
  console.log('[Family] Fetching members for family:', familyId);
  
  // Try with relationship first
  let { data, error } = await supabase
    .from('family_members')
    .select(`
      user_id, 
      role, 
      created_at,
      profiles(display_name)
    `)
    .eq('family_id', familyId);
    
  if (error) {
    console.warn('[Family] Relationship query failed, trying without relationship:', error.message);
    
    // Fallback: get members without relationship
    const { data: membersData, error: membersError } = await supabase
      .from('family_members')
      .select('user_id, role, created_at')
      .eq('family_id', familyId);
      
    if (membersError) {
      console.error('[Family] Fetch members error:', membersError);
      throw membersError;
    }
    
    // Get profiles separately
    const userIds = membersData?.map(m => m.user_id) || [];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', userIds);
    
    // Combine data
    data = membersData?.map(member => ({
      ...member,
      profiles: profilesData?.find(p => p.user_id === member.user_id) || { user_id: member.user_id, display_name: null }
    }));
  }
  
  console.log('[Family] Members fetched:', data);
  return data || [];
}

export async function createInvite(familyId: string, ttlMinutes = 1440) {
  console.log('[Family] Creating invite for family:', familyId, 'TTL:', ttlMinutes);
  
  const { data, error } = await supabase.rpc('create_invite', { 
    fid: familyId, 
    ttl_minutes: ttlMinutes 
  });
  
  if (error) {
    console.error('[Family] Create invite RPC error:', error);
    throw new Error(`Gagal membuat kode undangan: ${error.message}`);
  }
  
  console.log('[Family] Invite created successfully:', data);
  return data?.[0] ?? null; // { code, expires_at }
}

export async function redeemInvite(code: string) {
  const { data, error } = await supabase.rpc('redeem_invite', { p_code: code });
  if (error) throw error;
  return data as string; // family_id
}


