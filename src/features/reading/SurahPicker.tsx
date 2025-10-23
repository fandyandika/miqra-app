import React from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { SURAH_META } from '@/data/quran_meta';

export function SurahPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const selected = SURAH_META.find(s => s.number === value);
  const filtered = SURAH_META.filter(s => {
    const hay = `${s.number}. ${s.name}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <View>
      <Text style={{ marginBottom: 6 }}>Surah</Text>
      <Pressable onPress={() => setOpen(true)} style={{ paddingVertical: 8 }}>
        <Text style={{ fontWeight: '600' }}>
          {selected ? `${selected.number}. ${selected.name}` : 'Pilih Surah'}
        </Text>
      </Pressable>

      <Modal visible={open} animationType='slide'>
        <View style={{ flex: 1, padding: 16 }}>
          <Pressable onPress={() => setOpen(false)}>
            <Text>← Kembali</Text>
          </Pressable>
          <TextInput
            placeholder='Cari surah...'
            value={q}
            onChangeText={setQ}
            style={{
              borderWidth: 1,
              borderColor: '#E5E7EB',
              borderRadius: 8,
              padding: 8,
              marginVertical: 12,
            }}
          />
          <FlatList
            data={filtered}
            keyExtractor={s => String(s.number)}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onChange(item.number);
                  setOpen(false);
                }}
                style={{ paddingVertical: 10 }}
              >
                <Text>
                  {item.number}. {item.name} ({item.ayatCount})
                </Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}
