import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getTodaySessions } from '@/services/reading';
import { SURAH_META } from '@/data/quran_meta';

export default function TodaySessions() {
  const { data } = useQuery({ queryKey: ['reading','today'], queryFn: getTodaySessions });
  const total = (data ?? []).reduce((s,i)=>s+(i.ayat_count||0),0);
  if (!data || data.length===0) return <Text style={{ color:'#6B7280' }}>Belum ada catatan hari ini.</Text>;

  return (
    <View>
      <Text style={{ fontWeight:'600', marginBottom:8 }}>Hari ini: {total} ayat</Text>
      <FlatList
        data={data}
        keyExtractor={(i)=>i.id}
        renderItem={({ item }) => {
          const meta = SURAH_META[item.surah_number-1];
          const time = new Date(item.session_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return (
            <View style={{ paddingVertical:8, flexDirection:'row', justifyContent:'space-between', borderBottomWidth:0.5, borderColor:'#E5E7EB' }}>
              <Text>{meta?.number}. {meta?.name} {item.ayat_start}-{item.ayat_end}</Text>
              <Text>{item.ayat_count} • {time}</Text>
            </View>
          );
        }}
      />
    </View>
  );
}
