import React, { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';

export default function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      className='bg-surface rounded-2xl p-4 border border-border'
      style={style}
    >
      {children}
    </View>
  );
}
