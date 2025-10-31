import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import BismillahSvg from '@/../assets/icons/Bismillah.svg';

export default function BasmalahHeader() {
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <BismillahSvg width={240} height={60} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 10,
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
