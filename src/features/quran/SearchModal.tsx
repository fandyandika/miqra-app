import React from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { searchSurah, searchInSurah, SurahHit, AyatHit } from '@/services/quran/search';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '@/theme/colors';

type Mode = 'surah' | 'ayat';

export default function SearchModal() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const currentSurah: number | undefined = route.params?.currentSurah;

  const [mode, setMode] = React.useState<Mode>('surah');
  const [q, setQ] = React.useState('');
  const [surahResults, setSurahResults] = React.useState<SurahHit[]>([]);
  const [ayatResults, setAyatResults] = React.useState<AyatHit[]>([]);
  const [loading, setLoading] = React.useState(false);

  const runSearch = React.useCallback(async () => {
    const query = q.trim();
    if (!query) {
      setSurahResults([]);
      setAyatResults([]);
      return;
    }
    setLoading(true);
    try {
      if (mode === 'surah') {
        setSurahResults(await searchSurah(query));
      } else {
        if (!currentSurah) {
          setAyatResults([]);
        } else {
          setAyatResults(await searchInSurah(currentSurah, query, 'both'));
        }
      }
    } finally {
      setLoading(false);
    }
  }, [q, mode, currentSurah]);

  React.useEffect(() => {
    const t = setTimeout(runSearch, 250);
    return () => clearTimeout(t);
  }, [q, mode, runSearch]);

  const goSurah = (n: number) => {
    navigation.replace('Reader', { surahNumber: n });
  };

  const goAyat = (s: number, a: number) => {
    navigation.replace('Reader', { surahNumber: s, ayatNumber: a });
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <View style={styles.seg}>
          <Pressable
            onPress={() => setMode('surah')}
            style={[styles.segBtn, mode === 'surah' && styles.segActive]}
          >
            <Text style={[styles.segTxt, mode === 'surah' && styles.segTxtActive]}>Surah</Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('ayat')}
            style={[styles.segBtn, mode === 'ayat' && styles.segActive]}
          >
            <Text style={[styles.segTxt, mode === 'ayat' && styles.segTxtActive]}>Ayat</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          autoFocus
          placeholder={
            mode === 'surah' ? 'Cari surah (nama/nomor)...' : 'Cari ayat di surah ini (Arab/ID)...'
          }
          value={q}
          onChangeText={setQ}
          style={styles.input}
          returnKeyType="search"
          onSubmitEditing={runSearch}
        />
      </View>

      {mode === 'surah' ? (
        <FlatList
          data={surahResults}
          keyExtractor={(i) => String(i.number)}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => goSurah(item.number)}>
              <View>
                <Text style={styles.title}>
                  {item.number}. {item.name}
                </Text>
                <Text style={styles.sub}>{item.ayat_count} ayat</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            !loading ? <Text style={styles.empty}>Ketik untuk mencari surah…</Text> : null
          }
        />
      ) : (
        <FlatList
          data={ayatResults}
          keyExtractor={(i) => `${i.surah}:${i.ayat}`}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => goAyat(item.surah, item.ayat)}>
              <View style={{ flex: 1 }}>
                {item.snippet_ar ? <Text style={styles.ar}>{item.snippet_ar}</Text> : null}
                {item.snippet_id ? <Text style={styles.sub}>{item.snippet_id}</Text> : null}
                <Text style={styles.tag}>
                  QS {item.surah}:{item.ayat}
                </Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            !loading ? <Text style={styles.empty}>Cari ayat di surah ini…</Text> : null
          }
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 10 },
  back: { fontSize: 22, marginRight: 8 },
  seg: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4 },
  segBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  segActive: { backgroundColor: '#fff' },
  segTxt: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  segTxtActive: { color: colors.primary },
  searchBox: { padding: 12 },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sep: { height: 1, backgroundColor: '#F3F4F6' },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  sub: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  ar: { fontSize: 18, textAlign: 'right' },
  tag: { marginTop: 6, fontSize: 11, color: colors.primary },
  arrow: { fontSize: 18, color: colors.primary },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 24 },
});
