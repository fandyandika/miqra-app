import React from 'react';
import { View, TextInput, Pressable, Text, StyleSheet } from 'react-native';
import { parseJumpInput } from '@/services/quran/search';
import { colors } from '@/theme/colors';

export default function JumpBar({
  currentSurah,
  onJump,
}: {
  currentSurah: number;
  onJump: (surah: number, ayat: number) => void;
}) {
  const [v, setV] = React.useState('');
  const go = async () => {
    const parsed = await parseJumpInput(v, currentSurah);
    if (parsed) onJump(parsed.surah, parsed.ayat);
  };
  return (
    <View style={s.wrap}>
      <TextInput
        placeholder="Loncat ke… (mis. 2:255 atau 255)"
        value={v}
        onChangeText={setV}
        style={s.input}
        onSubmitEditing={go}
        returnKeyType="go"
      />
      <Pressable style={s.btn} onPress={go}>
        <Text style={s.btnTxt}>Go</Text>
      </Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  btnTxt: { color: '#fff', fontWeight: '700' },
});
