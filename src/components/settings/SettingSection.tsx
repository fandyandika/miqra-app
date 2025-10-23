import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type SettingSectionProps = { title: string; children: React.ReactNode };

export function SettingSection({ title, children }: SettingSectionProps) {
  return (
    <View style={styles.container} accessible accessibilityLabel={`Bagian ${title}`}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 24 },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  content: { gap: 0 },
});
