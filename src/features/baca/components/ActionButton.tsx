import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { colors } from '@/theme/colors';

export function ActionButton({
  icon,
  title,
  subtitle,
  onPress,
  color = colors.primary,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.container, { borderColor: color + '30' }]}>
      <View style={styles.iconWrapper}>
        <Text style={[styles.icon, { color }]}>{icon}</Text>
      </View>
      <View style={styles.textWrapper}>
        <Text style={[styles.title, { color }]}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  icon: { fontSize: 22 },
  textWrapper: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 4 },
});
