import { supabase } from '@/lib/supabase';

export type UserProfile = {
  user_id: string;
  display_name: string | null;
  avatar_url?: string | null;
  timezone: string;
  language?: string;
  lat?: number | null;
  lng?: number | null;
  created_at: string;
  updated_at?: string;
};

export type UserSettings = {
  user_id: string;
  hasanat_visible: boolean;
  share_with_family: boolean;
  join_leaderboard: boolean;
  daily_reminder_enabled: boolean;
  reminder_time: string; // 'HH:MM:SS'
  streak_warning_enabled: boolean;
  family_nudge_enabled: boolean;
  milestone_celebration_enabled: boolean;
  daily_goal_ayat: number;
  theme: 'light' | 'dark' | 'auto';
  created_at: string;
  updated_at: string;
};

export async function getProfile(): Promise<UserProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) throw error;
  return data as UserProfile;
}

export async function getProfileTimezone(): Promise<string> {
  const profile = await getProfile();
  return profile?.timezone ?? 'Asia/Jakarta';
}

export async function getUserProfile(): Promise<UserProfile | null> {
  return getProfile();
}

export async function updateProfile(updates: Partial<UserProfile>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No user');

  console.log('[updateProfile] User ID:', user.id);
  console.log('[updateProfile] Updates:', updates);

  // Remove updated_at from updates as it's handled by trigger
  const { updated_at, ...updateData } = updates;

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('[updateProfile] Error:', error);
    throw error;
  }

  console.log('[updateProfile] Success:', data);
  return data as UserProfile;
}

export async function uploadAvatar(file: File | Blob): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No user');

  const fileExt = 'jpg'; // TODO: detect mime
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  return data.publicUrl;
}

export async function getSettings(): Promise<UserSettings> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No user');

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    // Row belum ada → buat default di server, lalu kembalikan
    const { data: inserted, error: upErr } = await supabase
      .from('user_settings')
      .insert({ user_id: user.id })
      .select()
      .single();
    if (upErr) throw upErr;
    return inserted as UserSettings;
  }

  return data as UserSettings;
}

export async function updateSettings(updates: Partial<UserSettings>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No user');

  const { data, error } = await supabase
    .from('user_settings')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data as UserSettings;
}

/**
 * Request account deletion: Placeholder (requires Edge Function).
 * Client must NOT call admin.deleteUser.
 */
export async function requestAccountDeletion() {
  // Example (future):
  // await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-user`, { method:'POST', headers:{ Authorization:`Bearer ${session.access_token}` }})
  throw new Error(
    'Penghapusan akun memerlukan fungsi server. Fitur dinonaktifkan untuk sementara.'
  );
}
