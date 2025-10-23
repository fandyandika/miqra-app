import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/services/auth';

export function useAuthSession() {
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[useAuth] Initializing auth session...');

    getSession()
      .then(s => {
        console.log('[useAuth] Initial session:', s ? 'Found' : 'None');
        setSession(s);
        setLoading(false);
      })
      .catch(error => {
        console.error('[useAuth] Error getting session:', error);
        setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      console.log(
        '[useAuth] Auth state change:',
        event,
        s ? 'Session exists' : 'No session'
      );
      setSession(s);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}
