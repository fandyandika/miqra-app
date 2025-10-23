import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { getKhatamProgress } from '@/services/reading';
import { calculateProgress, estimateCompletion, getMilestones } from '@/lib/quranProgress';
import { ProgressBar } from './ProgressBar';
import { CurrentPositionCard } from './CurrentPositionCard';
import { MilestoneGrid } from './MilestoneGrid';
import { colors } from '@/theme/colors';

export default function KhatamProgressScreen() {
  const navigation = useNavigation<any>();
  const [showCelebration, setShowCelebration] = React.useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['khatam', 'progress'],
    queryFn: getKhatamProgress,
    retry: 1,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Calculate progress data (always call hooks before early returns)
  const progress = data?.progress;
  const recentSessions = data?.recentSessions;
  const uniqueData = data?.uniqueData;

  const prog = progress
    ? calculateProgress(
        progress.total_ayat_read || 0,
        progress.current_surah || 1,
        progress.current_ayat || 1,
        progress.khatam_count || 0
      )
    : null;

  const est =
    progress && recentSessions
      ? estimateCompletion(
          progress.total_ayat_read || 0,
          recentSessions.map((s: any) => ({
            date: s?.date || new Date().toISOString(),
            ayat_count: s?.ayat_count || 0,
          }))
        )
      : null;

  const milestones = progress ? getMilestones(progress.total_ayat_read || 0) : [];

  // useEffect must be called before any early returns
  React.useEffect(() => {
    if (prog && prog.percentage >= 100 && prog.khatamCount > 0) {
      setShowCelebration(true);
    }
  }, [prog?.percentage, prog?.khatamCount]);

  if (isLoading)
    return (
      <View style={st.center}>
        <ActivityIndicator color={colors.primary} />
        <Text style={st.muted}>Memuat progres…</Text>
        <Text style={[st.muted, { fontSize: 10, marginTop: 8 }]}>
          Debug: isLoading={String(isLoading)}
        </Text>
      </View>
    );

  if (error) {
    console.error('[KhatamProgress] Error:', error);
    return (
      <View style={st.center}>
        <Text style={st.muted}>Error: {error.message}</Text>
        <Pressable
          style={{
            marginTop: 16,
            padding: 12,
            backgroundColor: colors.primary,
            borderRadius: 8,
          }}
          onPress={() => window.location.reload()}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>Coba Lagi</Text>
        </Pressable>
      </View>
    );
  }

  if (!progress || !prog || !est)
    return (
      <View style={st.center}>
        <Text style={st.muted}>Belum ada data bacaan</Text>
        <Text style={[st.muted, { fontSize: 12, marginTop: 8 }]}>
          Mulai catat bacaan untuk melihat progres khatam
        </Text>
      </View>
    );

  return (
    <>
      <ScrollView style={st.root} contentContainerStyle={st.content}>
        <View style={{ marginBottom: 16 }}>
          <Text style={st.title}>Progres Khatam</Text>
          {prog.khatamCount > 0 && (
            <View style={st.badge}>
              <Text style={st.badgeText}>🎉 {prog.khatamCount}x Khatam</Text>
            </View>
          )}
        </View>

        <View style={st.card}>
          <Text style={st.cardTitle}>Progres Saat Ini</Text>
          <ProgressBar
            percentage={prog.percentage}
            totalRead={prog.totalRead}
            totalQuran={prog.totalQuran}
          />
        </View>

        <CurrentPositionCard
          surahNumber={prog.currentSurah}
          ayahNumber={prog.currentAyat}
          isNextUnread={true}
          onContinuePress={() => navigation.navigate('LogReading')}
        />

        <View style={st.card}>
          <Text style={st.cardTitle}>Estimasi Khatam</Text>
          {est.avgPerDay > 0 ? (
            <>
              <Row label="Rata-rata baca" value={`${est.avgPerDay} ayat/hari`} />
              <Row label="Sisa hari" value={`~${est.daysRemaining} hari`} />
              <Row label="Perkiraan selesai" value={est.estimatedDateText} />
              <Text style={st.hint}>💡 Jika istiqomah dengan kecepatan saat ini</Text>
            </>
          ) : (
            <Text style={st.muted}>Belum cukup data untuk estimasi. Terus membaca! 📖</Text>
          )}
        </View>

        <View style={st.card}>
          <MilestoneGrid milestones={milestones} />
        </View>

        <View style={st.remain}>
          <Text style={st.remainText}>
            Sisa {prog.remaining.toLocaleString('id-ID')} ayat lagi untuk khatam! 🎯
          </Text>
        </View>
      </ScrollView>

      <Celebration
        visible={showCelebration}
        khatamCount={prog.khatamCount}
        onClose={() => setShowCelebration(false)}
        onContinue={() => navigation.navigate('LogReading')}
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={st.row}>
      <Text style={st.label}>{label}:</Text>
      <Text style={st.value}>{value}</Text>
    </View>
  );
}

function Celebration({
  visible,
  khatamCount,
  onClose,
  onContinue,
}: {
  visible: boolean;
  khatamCount: number;
  onClose: () => void;
  onContinue: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={st.overlay}>
        <View style={st.modal}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🎉✨🎊</Text>
          <Text style={st.modalTitle}>MasyaAllah, Tabarakallah!</Text>
          <Text style={st.modalSub}>Khatam ke-{khatamCount}</Text>
          <Text style={st.modalMsg}>
            Alhamdulillah! Semoga Allah memberkahi perjalanan membacamu dan menjadikannya syafaat di
            hari akhir. 🤲
          </Text>
          <Pressable
            style={st.primary}
            onPress={() => {
              onClose();
              onContinue();
            }}
          >
            <Text style={st.primaryText}>Mulai Khatam Berikutnya 📖</Text>
          </Pressable>
          <Pressable style={{ paddingVertical: 12 }} onPress={onClose}>
            <Text style={st.secondaryText}>Nanti Saja</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 16 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  muted: {
    color: colors.neutral,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: (colors as any).text?.primary ?? '#111827',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: (colors as any).text?.primary ?? '#111827',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    color: colors.neutral,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: (colors as any).text?.primary ?? '#111827',
  },
  hint: {
    fontSize: 12,
    color: colors.neutral,
    marginTop: 8,
    fontStyle: 'italic',
  },
  remain: {
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    marginBottom: 16,
  },
  remainText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: (colors as any).text?.primary ?? '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 16,
  },
  modalMsg: {
    fontSize: 14,
    color: colors.neutral,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },

  primary: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: '100%',
    marginBottom: 12,
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryText: {
    color: colors.neutral,
    fontSize: 14,
    fontWeight: '600',
  },
});
