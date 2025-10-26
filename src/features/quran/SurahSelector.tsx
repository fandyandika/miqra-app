import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { loadSurahMetadata } from '@/services/quran/quranData';
import { colors } from '@/theme/colors';

export default function SurahSelector() {
  const navigation = useNavigation<any>();
  const [surahs, setSurahs] = React.useState<any[]>([]);

  React.useEffect(() => {
    (async () => {
      const meta = await loadSurahMetadata();
      setSurahs(meta);
    })();
  }, []);

  const openSurah = (surahNumber: number) => {
    navigation.replace('Reader', { surahNumber });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={surahs}
        keyExtractor={(item) => String(item.number)}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => openSurah(item.number)}>
            <View>
              <Text style={styles.title}>
                {item.number}. {item.name}
              </Text>
              <Text style={styles.sub}>{item.ayat_count} ayat</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  sub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  arrow: { fontSize: 18, color: colors.primary },
  sep: { height: 1, backgroundColor: '#F3F4F6' },
});
