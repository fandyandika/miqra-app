import React from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { getReadingProgress, createReadingSession } from '@/services/reading';
import { getAyatCount, getNextPosition } from '@/data/quran_meta';
import { SurahPicker } from './SurahPicker';
import { AyatRangeInput } from './AyatRangeInput';
import { colors } from '@/theme/colors';

export default function LogReadingScreen() {
  const nav = useNavigation<any>();
  const qc = useQueryClient();
  const { data: progress } = useQuery({ queryKey:['reading','progress'], queryFn: getReadingProgress });

  const [surah, setSurah] = React.useState(progress?.current_surah ?? 1);
  const [range, setRange] = React.useState({ start: progress?.current_ayat ?? 1, end: progress?.current_ayat ?? 1 });
  const [notes, setNotes] = React.useState('');

  const m = useMutation({
    mutationFn: createReadingSession,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey:['reading','progress'] });
      qc.invalidateQueries({ queryKey:['reading','today'] });
      Alert.alert('Tersimpan', 'Catatan bacaan berhasil disimpan.');
      // clear form but keep next suggestion
      const next = getNextPosition(surah, range.end);
      setSurah(next.surah);
      setRange({ start: next.ayat, end: next.ayat });
      setNotes('');
    }
  });

  React.useEffect(() => {
    if (progress) {
      setSurah(progress.current_surah ?? 1);
      const a = progress.current_ayat ?? 1;
      setRange({ start: a, end: a });
    }
  }, [progress]);

  function prefillFromCurrent() {
    const s = progress?.current_surah ?? 1;
    const a = progress?.current_ayat ?? 1;
    setSurah(s);
    setRange({ start: a, end: a });
  }

  function submit() {
    if (!surah || !range.start || !range.end) return;
    if (range.end < range.start) return Alert.alert('Cek lagi', 'Ayat akhir tidak boleh lebih kecil dari awal.');
    const max = getAyatCount(surah);
    if (range.end > max) return Alert.alert('Cek lagi', `Surah ini hanya ${max} ayat.`);
    m.mutate({ surah_number: surah, ayat_start: range.start, ayat_end: range.end, notes: notes?.trim() || undefined });
  }

  return (
    <View style={{ flex:1, backgroundColor: colors.surface, padding:16 }}>
      <View style={{ marginBottom:12 }}>
        <Pressable onPress={()=>nav.goBack()}><Text>← Kembali</Text></Pressable>
      </View>

      <Text style={{ fontSize:18, fontWeight:'700', marginBottom:12 }}>Catat Bacaan</Text>

      <Pressable
        onPress={prefillFromCurrent}
        style={{ alignSelf:'flex-start', marginBottom:10, paddingVertical:6, paddingHorizontal:10, borderWidth:1, borderColor:'#E5E7EB', borderRadius:8 }}
      >
        <Text>Lanjutkan dari posisi terakhir</Text>
      </Pressable>

      <SurahPicker value={surah} onChange={(n)=>{ setSurah(n); const max = getAyatCount(n); setRange(r => ({start: Math.min(r.start, max), end: Math.min(r.end, max)})); }} />
      <AyatRangeInput surah={surah} start={range.start} end={range.end} onChange={(s,e)=>setRange({start:s,end:e})} />

      <View style={{ marginTop:12 }}>
        <Text style={{ marginBottom:6 }}>Catatan (opsional)</Text>
        <TextInput
          value={notes} onChangeText={setNotes}
          placeholder="Refleksi singkat..."
          multiline
          style={{ minHeight:80, borderWidth:1, borderColor:'#E5E7EB', borderRadius:8, padding:8 }}
        />
      </View>

      <Pressable onPress={submit} disabled={m.isLoading}
        style={{ backgroundColor:'#0E7A6D', paddingVertical:14, borderRadius:10, alignItems:'center', marginTop:16 }}>
        <Text style={{ color:'#fff', fontWeight:'700' }}>{m.isLoading ? 'Menyimpan…' : 'Simpan'}</Text>
      </Pressable>
    </View>
  );
}


