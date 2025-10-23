import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '@/theme/colors';

export default function SimpleStatsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>📊 Statistik Bacaan</Text>
      <Text style={styles.subtitle}>
        Analisis progres bacaan Al-Qur'an Anda
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total Ayat</Text>
        <Text style={styles.cardValue}>282</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Rata-rata/Hari</Text>
        <Text style={styles.cardValue}>71</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Hari Aktif</Text>
        <Text style={styles.cardValue}>4</Text>
      </View>

      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>💡 Insight</Text>
        <Text style={styles.insightText}>
          Alhamdulillah! Rata-rata Anda 71 ayat/hari. Istiqomah yang luar biasa!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
  },
  insightCard: {
    backgroundColor: '#FFF8F0',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
});
