import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { colors } from '@/theme/colors';

type FamilyData = {
  id: string;
  name: string;
  role: string;
};

type FamilyStats = {
  total_family_ayat: number;
  avg_ayat_per_member: number;
  member_count: number;
};

type FamilyComparisonCardProps = {
  personalAyat: number;
  familyStats: FamilyStats | null;
  families: FamilyData[];
  selectedFamilyId: string | null;
  onFamilyChange: (familyId: string) => void;
  period: '7D' | '30D' | '90D' | '365D';
  onPeriodChange: (period: '7D' | '30D' | '90D' | '365D') => void;
  isLoading?: boolean;
};

// Helper function untuk membuat pesan yang delighting
const getComparisonMessage = (personalAyat: number, avgFamily: number, percentage: number) => {
  if (avgFamily === 0) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageIcon}>🎯</Text>
        <Text style={styles.messageText}>
          Anda adalah <Text style={styles.messageHighlight}>pionir</Text> bacaan di keluarga!
        </Text>
      </View>
    );
  }

  const ratio = personalAyat / avgFamily;

  if (ratio >= 3) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageIcon}>🚀</Text>
        <Text style={styles.messageText}>
          MasyaAllah, Tabarakallah! Anda membaca{' '}
          <Text style={styles.messageHighlight}>3x lipat</Text> lebih banyak dari rata-rata
          keluarga!
        </Text>
      </View>
    );
  } else if (ratio >= 2) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageIcon}>⭐</Text>
        <Text style={styles.messageText}>
          MasyaAllah, Tabarakallah! Anda membaca{' '}
          <Text style={styles.messageHighlight}>2x lipat</Text> lebih banyak dari rata-rata
          keluarga!
        </Text>
      </View>
    );
  } else if (ratio >= 1.5) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageIcon}>🌟</Text>
        <Text style={styles.messageText}>
          MasyaAllah! Anda membaca <Text style={styles.messageHighlight}>50% lebih banyak</Text>{' '}
          dari rata-rata keluarga!
        </Text>
      </View>
    );
  } else if (ratio >= 1) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageIcon}>👍</Text>
        <Text style={styles.messageText}>
          Alhamdulillah! Anda membaca <Text style={styles.messageHighlight}>sama atau lebih</Text>{' '}
          dari rata-rata keluarga!
        </Text>
      </View>
    );
  } else if (ratio >= 0.7) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageIcon}>💪</Text>
        <Text style={styles.messageText}>
          Barakallah! Anda sudah <Text style={styles.messageHighlight}>mendekati rata-rata</Text>{' '}
          keluarga. Tingkatkan sedikit lagi!
        </Text>
      </View>
    );
  } else if (ratio >= 0.3) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageIcon}>🌱</Text>
        <Text style={styles.messageText}>
          Mari mulai kebiasaan baik! <Text style={styles.messageHighlight}>Satu ayat per hari</Text>{' '}
          sudah cukup untuk memulai!
        </Text>
      </View>
    );
  } else {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageIcon}>🤲</Text>
        <Text style={styles.messageText}>
          Bismillah! Mari mulai perjalanan bacaan Al-Qur'an.{' '}
          <Text style={styles.messageHighlight}>Setiap ayat adalah berkah</Text>!
        </Text>
      </View>
    );
  }
};

export function FamilyComparisonCard({
  personalAyat,
  familyStats,
  families,
  selectedFamilyId,
  onFamilyChange,
  period,
  onPeriodChange,
  isLoading = false,
}: FamilyComparisonCardProps) {
  const [showFamilySelector, setShowFamilySelector] = useState(false);

  const selectedFamily = families?.find((f) => f.id === selectedFamilyId);

  // Debug logging untuk perhitungan
  console.log('🔍 Family Comparison Debug:', {
    personalAyat,
    familyStats,
    selectedFamilyId,
    selectedFamily: selectedFamily?.name,
    families: families?.length || 0,
  });

  // Safe calculation dengan null checks
  const safePersonalAyat = personalAyat || 0;
  const safeFamilyStats = familyStats || null;
  const safeAvgAyat = safeFamilyStats?.avg_ayat_per_member || 0;

  const isAboveAverage = safeFamilyStats ? safePersonalAyat >= safeAvgAyat : false;
  const percentage =
    safeFamilyStats && safeAvgAyat > 0 ? Math.round((safePersonalAyat / safeAvgAyat) * 100) : 0;

  console.log('📊 Percentage calculation:', {
    personalAyat: safePersonalAyat,
    avgAyatPerMember: safeAvgAyat,
    percentage,
    isAboveAverage,
  });

  if (!families || families.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>👨‍👩‍👧‍👦 Perbandingan Keluarga</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyText}>Anda belum bergabung dengan keluarga</Text>
          <Text style={styles.emptySubtext}>
            Bergabunglah dengan keluarga untuk melihat perbandingan bacaan
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>👨‍👩‍👧‍👦 Perbandingan Keluarga</Text>
        <View style={styles.headerControls}>
          {/* Period Selector */}
          <View style={styles.periodSelector}>
            {(['7D', '30D', '90D', '365D'] as const).map((p) => (
              <Pressable
                key={p}
                style={[styles.periodButton, period === p && styles.periodButtonActive]}
                onPress={() => onPeriodChange(p)}
              >
                <Text
                  style={[styles.periodButtonText, period === p && styles.periodButtonTextActive]}
                >
                  {p === '7D' ? '7H' : p === '30D' ? '30H' : p === '90D' ? '90H' : '1T'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Family Selector */}
          {families && families.length > 1 && (
            <Pressable
              style={styles.selectorButton}
              onPress={() => {
                console.log('🔄 Toggle family selector, current families:', families.length);
                setShowFamilySelector(!showFamilySelector);
              }}
            >
              <Text style={styles.selectorButtonText}>
                {selectedFamily?.name || 'Pilih Keluarga'} {showFamilySelector ? '▲' : '▼'}
              </Text>
              <Text style={styles.selectorButtonSubtext}>{families.length} keluarga</Text>
            </Pressable>
          )}
        </View>
      </View>

      {families && families.length > 1 && showFamilySelector && (
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorTitle}>Pilih Keluarga ({families.length} keluarga):</Text>
          {families.map((family) => (
            <Pressable
              key={family.id}
              style={[
                styles.selectorOption,
                selectedFamilyId === family.id && styles.selectorOptionActive,
              ]}
              onPress={() => {
                console.log('🔄 Switching to family:', family.name, family.id);
                onFamilyChange(family.id);
                setShowFamilySelector(false);
              }}
            >
              <View style={styles.selectorOptionContent}>
                <Text
                  style={[
                    styles.selectorOptionText,
                    selectedFamilyId === family.id && styles.selectorOptionTextActive,
                  ]}
                >
                  {family.name}
                </Text>
                <Text
                  style={[
                    styles.selectorOptionRole,
                    selectedFamilyId === family.id && styles.selectorOptionRoleActive,
                  ]}
                >
                  {family.role === 'owner' ? '👑 Owner' : '👤 Member'}
                </Text>
              </View>
              {selectedFamilyId === family.id && <Text style={styles.selectorCheckmark}>✓</Text>}
            </Pressable>
          ))}
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Memuat data keluarga...</Text>
        </View>
      ) : familyStats ? (
        <>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Bacaan Anda</Text>
              <Text style={styles.statValue}>
                {(personalAyat || 0).toLocaleString('id-ID')} ayat
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Rata-rata Keluarga</Text>
              <Text style={styles.statValue}>
                {Math.round(familyStats?.avg_ayat_per_member || 0).toLocaleString('id-ID')} ayat
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Keluarga</Text>
              <Text style={[styles.statValue, styles.highlight]}>
                {(familyStats?.total_family_ayat || 0).toLocaleString('id-ID')} ayat
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Anggota Keluarga</Text>
              <Text style={styles.statValue}>{familyStats?.member_count || 0} orang</Text>
            </View>
          </View>

          {/* Delighting Comparison Message */}
          <View style={styles.comparisonMessage}>
            {getComparisonMessage(
              personalAyat || 0,
              familyStats?.avg_ayat_per_member || 0,
              percentage
            )}
          </View>
        </>
      ) : (
        <View style={styles.errorState}>
          <Text style={styles.errorText}>❌ Gagal memuat data keluarga</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    padding: 2,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  periodButtonTextActive: {
    color: colors.white,
  },
  selectorButton: {
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  selectorButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  selectorButtonSubtext: {
    fontSize: 10,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  selectorContainer: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  selectorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  selectorOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  selectorOptionContent: {
    flex: 1,
  },
  selectorCheckmark: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  selectorOptionActive: {
    backgroundColor: colors.primary,
  },
  selectorOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  selectorOptionTextActive: {
    color: colors.white,
  },
  selectorOptionRole: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  selectorOptionRoleActive: {
    color: colors.white + 'CC',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.text.secondary,
  },
  errorState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
  },
  statLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  highlight: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  comparisonBar: {
    marginBottom: 16,
  },
  barTrack: {
    height: 8,
    backgroundColor: colors.gray[100],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  calculationDetails: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  comparisonMessage: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  messageText: {
    fontSize: 16,
    color: colors.text.primary,
    flex: 1,
    lineHeight: 22,
  },
  messageHighlight: {
    fontWeight: '700',
    color: colors.primary,
  },
  encouragement: {
    borderRadius: 12,
    padding: 16,
  },
  encouragementPositive: {
    backgroundColor: colors.success + '15',
  },
  encouragementNeutral: {
    backgroundColor: colors.warning + '15',
  },
  encouragementText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.text.primary,
  },
});
