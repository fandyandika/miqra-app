import { supabase } from '@/lib/supabase';

export async function getProfileTimezone(): Promise<string> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) return 'Asia/Jakarta';

  const { data, error } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[Profile] Fetch timezone error:', error);
    return 'Asia/Jakarta';
  }

  return data?.timezone || 'Asia/Jakarta';
}

export async function getUserProfile() {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  
  if (!userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, display_name, timezone')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[Profile] Fetch profile error:', error);
    return null;
  }
  return data;
}
