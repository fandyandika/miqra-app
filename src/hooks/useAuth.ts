import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/services/auth';

export function useAuthSession() {
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession().then((s) => { setSession(s); setLoading(false); });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  return { session, loading };
}
