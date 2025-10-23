import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Milestone } from '@/lib/quranProgress';
import { colors } from '@/theme/colors';

type Props = {
  milestones: Milestone[];
  compact?: boolean;
};

export function MilestoneGrid({ milestones, compact = false }: Props) {
  const list = compact
    ? ([
        ...milestones.filter(m => m.achieved),
        milestones.find(m => !m.achieved),
      ].filter(Boolean) as Milestone[])
    : milestones;

  return (
    <View style={{ marginVertical: 8 }}>
      {!compact && <Text style={s.title}>Pencapaian</Text>}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.row}
      >
        {list.map(m => (
          <View
            key={m.id}
            style={[s.badge, m.achieved ? s.badgeOn : s.badgeOff]}
            accessible
            accessibilityLabel={`${m.label}, ${m.percentage}%${m.achieved ? ' (tercapai)' : ''}`}
          >
            <Text style={s.icon}>{m.icon}</Text>
            <Text style={[s.perc, m.achieved && s.percOn]}>
              {m.percentage}%
            </Text>
            <Text style={[s.label, m.achieved && s.labelOn]}>{m.label}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: (colors as any).text?.primary ?? '#111827',
    marginBottom: 12,
  },
  row: {
    gap: 12,
    paddingRight: 16,
  },
  badge: {
    width: 100,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  badgeOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  badgeOff: {
    opacity: 0.55,
  },
  icon: {
    fontSize: 32,
    marginBottom: 8,
  },
  perc: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral,
    marginBottom: 4,
  },
  percOn: {
    color: colors.primary,
  },
  label: {
    fontSize: 11,
    color: colors.neutral,
    textAlign: 'center',
  },
  labelOn: {
    color: (colors as any).text?.primary ?? '#111827',
    fontWeight: '600',
  },
});
