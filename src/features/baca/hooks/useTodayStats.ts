import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useTodayStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['today-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { totalAyat: 0, totalHasanat: 0 };

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();

      // Get today's readings
      const { data: readings, error: readingsError } = await supabase
        .from('reading_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', todayStart)
        .order('created_at', { ascending: false });

      if (readingsError) throw readingsError;

      // Calculate total ayat and hasanat
      let totalAyat = 0;
      for (const reading of readings || []) {
        const ayatCount = (reading.ayat_end || 0) - (reading.ayat_start || 0) + 1;
        totalAyat += ayatCount;
      }

      const totalHasanat = totalAyat * 10; // 10 hasanat per ayat

      return { totalAyat, totalHasanat };
    },
    enabled: !!user?.id,
  });
}
