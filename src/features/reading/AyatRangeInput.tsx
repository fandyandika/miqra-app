import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { getAyatCount } from '@/data/quran_meta';

export function AyatRangeInput({ surah, start, end, onChange }:{
  surah:number; start:number; end:number; onChange:(s:number,e:number)=>void
}) {
  const max = getAyatCount(surah || 1);
  const clamp = (v:number) => Math.max(1, Math.min(max, v));

  return (
    <View style={{ marginTop:12 }}>
      <Text style={{ marginBottom:6 }}>Ayat (dari - sampai)</Text>
      <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
        <TextInput
          value={String(start)}
          onChangeText={(t)=>onChange(clamp(parseInt(t||'1')), end)}
          keyboardType="number-pad"
          style={{ borderWidth:1, borderColor:'#E5E7EB', borderRadius:8, padding:8, width:80, textAlign:'center' }}
        />
        <Text>—</Text>
        <TextInput
          value={String(end)}
          onChangeText={(t)=>onChange(start, clamp(parseInt(t||String(start))))}
          keyboardType="number-pad"
          style={{ borderWidth:1, borderColor:'#E5E7EB', borderRadius:8, padding:8, width:80, textAlign:'center' }}
        />
        <Text style={{ marginLeft:8, color:'#6B7280' }}>Maks: {max}</Text>
      </View>

      <View style={{ flexDirection:'row', gap:8, marginTop:8 }}>
        <Pressable onPress={()=>onChange(start, clamp(start+4))} style={{ padding:6, borderWidth:1, borderColor:'#E5E7EB', borderRadius:8 }}>
          <Text>+5 ayat</Text>
        </Pressable>
        <Pressable onPress={()=>onChange(start, clamp(start+9))} style={{ padding:6, borderWidth:1, borderColor:'#E5E7EB', borderRadius:8 }}>
          <Text>+10 ayat</Text>
        </Pressable>
        <Pressable onPress={()=>onChange(start, clamp(start+14))} style={{ padding:6, borderWidth:1, borderColor:'#E5E7EB', borderRadius:8 }}>
          <Text>+15 ayat</Text>
        </Pressable>
      </View>
    </View>
  );
}


