import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import BacaScreen from '@/features/baca/BacaScreen';
import ReaderScreen from '@/features/quran/ReaderScreen';
import AyahReader from '@/features/baca/components/AyahReader';
import SurahSelector from '@/features/quran/SurahSelector';
import LogReadingScreen from '@/features/reading/LogReadingScreen';
import SearchModal from '@/features/quran/SearchModal';
import LastReadScreen from '@/screens/LastReadScreen';

export type BacaStackParamList = {
  BacaHome: undefined;
  Reader: { surahNumber?: number; ayatNumber?: number; juzNumber?: number } | undefined;
  AyahReader: { surahNumber?: number; ayatNumber?: number } | undefined;
  SurahSelector: undefined;
  LogReading: undefined;
  LastRead: undefined;
};

const Stack = createNativeStackNavigator<BacaStackParamList>();

export default function BacaStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="BacaHome" component={BacaScreen} options={{ title: 'Baca' }} />
      <Stack.Screen
        name="SurahSelector"
        component={SurahSelector}
        options={{ title: '', headerShown: false }}
      />
      <Stack.Screen
        name="AyahReader"
        component={AyahReader}
        options={{
          title: '',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Reader"
        component={ReaderScreen}
        options={{
          title: '',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="LogReading"
        component={LogReadingScreen}
        options={{ title: 'Catat Bacaan' }}
      />
      <Stack.Screen
        name="Search"
        component={SearchModal}
        options={{ title: 'Cari', presentation: 'modal' }}
      />
      <Stack.Screen
        name="LastRead"
        component={LastReadScreen}
        options={{ title: 'Terakhir Baca', headerShown: false }}
      />
    </Stack.Navigator>
  );
}
