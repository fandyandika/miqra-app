import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import BismillahSvg from '@/../assets/Bismillah.svg';

export default function BasmalahHeader() {
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.topLine} />
        <View style={styles.container}>
          <View style={styles.line} />
          <BismillahSvg width={200} height={48} />
          <View style={styles.line} />
        </View>
        <View style={styles.bottomLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16 },
  card: {
    backgroundColor: '#FAF5F0',
    borderRadius: 0,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#1F2937',
    marginHorizontal: 12,
  },
  topLine: {
    height: 1,
    backgroundColor: '#1F2937',
    marginBottom: 12,
    marginHorizontal: 20,
  },
  bottomLine: {
    height: 1,
    backgroundColor: '#1F2937',
    marginTop: 12,
    marginHorizontal: 20,
  },
});
