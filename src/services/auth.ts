import { supabase } from '@/lib/supabase';

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

export async function signInEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data.session ?? null;
}

export async function signUpEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data.user ?? null;
}

export async function signOut() {
  await supabase.auth.signOut();
}
