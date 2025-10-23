import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';

type InitialAvatarProps = {
  name: string | null;
  size?: number;
  onPress?: () => void;
};

export function InitialAvatar({
  name,
  size = 80,
  onPress,
}: InitialAvatarProps) {
  const getInitials = (fullName: string | null): string => {
    if (!fullName) return 'U';

    const words = fullName.trim().split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }

    return (
      words[0].charAt(0) + words[words.length - 1].charAt(0)
    ).toUpperCase();
  };

  const getBackgroundColor = (name: string | null): string => {
    if (!name) return colors.primary;

    // Generate consistent color based on name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const colors_list = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFEAA7',
      '#DDA0DD',
      '#98D8C8',
      '#F7DC6F',
      '#BB8FCE',
      '#85C1E9',
      '#F8C471',
      '#82E0AA',
      '#F1948A',
      '#85C1E9',
      '#D7BDE2',
    ];

    return colors_list[Math.abs(hash) % colors_list.length];
  };

  const initials = getInitials(name);
  const backgroundColor = getBackgroundColor(name);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole='button'
      accessibilityLabel='Ubah avatar'
      style={[styles.container, { width: size, height: size }]}
    >
      <View style={[styles.avatarContainer, { backgroundColor }]}>
        <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
          {initials}
        </Text>
      </View>

      <View style={styles.editBadge}>
        <Text style={styles.editText}>✏️</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 999,
    overflow: 'hidden',
    position: 'relative',
    alignSelf: 'center',
  },
  avatarContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
  },
  initials: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  editText: {
    fontSize: 12,
    color: '#fff',
  },
});
