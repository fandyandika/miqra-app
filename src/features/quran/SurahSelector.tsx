import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import { useContinueReading } from '@/features/baca/hooks/useContinueReading';
import { loadSurahMetadata } from '@/services/quran/quranData';
import { getJuzStartAyah } from '@/services/quran/pageMap';
import { colors } from '@/theme/colors';
import SymbolAyat2 from '@/../assets/symbol-ayat2.svg';

type Tab = 'surah' | 'juz' | 'bookmark';

// Import SVG components dynamically
const surahComponents: { [key: number]: React.ComponentType<any> | null } = {};

// Juz list from JSON (single source of truth)
type JuzJson = {
  index: string;
  start: { index: string; verse: string; name: string };
  end: { index: string; verse: string; name: string };
}[];

function parseVerseNumber(verseKey: string): number {
  const m = /verse_(\d+)/.exec(verseKey);
  return m ? parseInt(m[1], 10) : 1;
}

function parseSurahIndex(indexStr: string): number {
  const n = parseInt(indexStr, 10);
  return Number.isFinite(n) ? n : 1;
}

const juzList: JuzJson = require('@/../assets/quran/juz.json');
const juzData = juzList.map((j) => ({
  number: parseInt(j.index, 10),
  surahNumber: parseSurahIndex(j.start.index),
  surahName: j.start.name,
  ayat: parseVerseNumber(j.start.verse),
}));

export default function SurahSelector() {
  const navigation = useNavigation<any>();
  const [surahs, setSurahs] = React.useState<any[]>([]);
  const [activeTab, setActiveTab] = React.useState<Tab>('surah');
  const { user } = useAuth();
  const { bookmark } = useContinueReading(user?.id);

  React.useEffect(() => {
    (async () => {
      const meta = await loadSurahMetadata();
      setSurahs(meta);
    })();
  }, []);

  const openSurah = (surahNumber: number) => {
    navigation.replace('Reader', { surahNumber });
  };

  const openJuz = (juzData: {
    number: number;
    surahName: string;
    ayat: number;
    surahNumber?: number;
  }) => {
    console.log('Opening Juz:', juzData);
    console.log(
      'Available surahs:',
      surahs.map((s) => s.name_id)
    );

    // Prefer exact start from page map
    const exact = getJuzStartAyah(juzData.number);
    if (exact) {
      navigation.replace('Reader', {
        surahNumber: exact.surah,
        ayahNumber: exact.ayah,
        juzNumber: juzData.number,
      });
      return;
    }

    // Fallback to juz.json mapping and metadata name match
    const targetSurahNumber = juzData.surahNumber
      ? juzData.surahNumber
      : surahs.find((s) => s.name_id?.toUpperCase() === juzData.surahName.toUpperCase())?.number;

    if (!targetSurahNumber) {
      console.error('Surah not found for Juz:', juzData);
      return;
    }

    navigation.replace('Reader', {
      surahNumber: targetSurahNumber,
      ayahNumber: juzData.ayat,
      juzNumber: juzData.number,
    });
  };

  const openSearch = () => {
    navigation.navigate('Search', { currentSurah: undefined });
  };

  const openSurahPicker = () => {
    // TODO: Implement surah picker modal
    navigation.navigate('Search', { currentSurah: undefined });
  };

  const getTypeLabel = (type: string) => {
    return type === 'Makkiyah' ? 'MEKAH' : 'MADINAH';
  };

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </Pressable>
        <View style={styles.topBarContent}>
          <Text style={styles.topBarTitle}>Pilih Bacaan</Text>
        </View>
        <View style={styles.topBarActions}>
          <Pressable onPress={openSearch} style={styles.topBarIcon}>
            <Feather name="search" size={20} color="#FFFFFF" />
          </Pressable>
          <Pressable onPress={openSurahPicker} style={styles.topBarIcon}>
            <Feather name="menu" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <Pressable
          onPress={() => setActiveTab('surah')}
          style={[styles.tab, activeTab === 'surah' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'surah' && styles.tabTextActive]}>SURAH</Text>
          {activeTab === 'surah' && <View style={styles.tabIndicator} />}
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('juz')}
          style={[styles.tab, activeTab === 'juz' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'juz' && styles.tabTextActive]}>JUZ</Text>
          {activeTab === 'juz' && <View style={styles.tabIndicator} />}
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('bookmark')}
          style={[styles.tab, activeTab === 'bookmark' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'bookmark' && styles.tabTextActive]}>
            BOOKMARK
          </Text>
          {activeTab === 'bookmark' && <View style={styles.tabIndicator} />}
        </Pressable>
      </View>

      {/* Content based on active tab */}
      {activeTab === 'bookmark' ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          {bookmark ? (
            <Pressable
              style={styles.row}
              onPress={() =>
                navigation.replace('Reader', {
                  surahNumber: bookmark.surahNumber,
                  ayahNumber: bookmark.ayatNumber,
                })
              }
            >
              <View style={styles.badge}>
                <SymbolAyat2 width={40} height={40} />
                <Text style={styles.badgeText}>{bookmark.surahNumber}</Text>
              </View>
              <View style={styles.surahInfo}>
                <Text style={styles.surahName}>Lanjut dari Bookmark</Text>
                <Text style={styles.surahMeta}>
                  {bookmark.surahNumber}. {bookmark.surahName} — Ayat {bookmark.ayatNumber}
                </Text>
              </View>
              <Feather
                name="chevron-right"
                size={24}
                color={colors.primary}
                style={styles.arrowIcon}
              />
            </Pressable>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Text style={{ color: '#636E72' }}>Belum ada bookmark tersimpan</Text>
            </View>
          )}
        </View>
      ) : (
        <FlatList
          data={activeTab === 'juz' ? juzData : surahs}
          keyExtractor={(item) => String(activeTab === 'juz' ? item.number : item.number)}
          renderItem={({ item }) => {
            if (activeTab === 'juz') {
              // Render Juz list
              return (
                <>
                  <Pressable style={styles.row} onPress={() => openJuz(item)}>
                    {/* Symbol Ayat Badge */}
                    <View style={styles.badge}>
                      <SymbolAyat2 width={40} height={40} />
                      <Text style={styles.badgeText}>{item.number}</Text>
                    </View>

                    {/* Juz Info */}
                    <View style={styles.surahInfo}>
                      <Text style={styles.surahName}>Juz {item.number}</Text>
                      <Text style={styles.surahMeta}>
                        MULAI DARI : {item.surahName.toUpperCase()} ({item.surahNumber}) AYAT{' '}
                        {item.ayat}
                      </Text>
                    </View>

                    {/* Navigation Arrow */}
                    <Feather
                      name="chevron-right"
                      size={24}
                      color={colors.primary}
                      style={styles.arrowIcon}
                    />
                  </Pressable>
                  <View style={styles.separator} />
                </>
              );
            }

            // Render Surah list
            return (
              <>
                <Pressable style={styles.row} onPress={() => openSurah(item.number)}>
                  {/* Symbol Ayat Badge */}
                  <View style={styles.badge}>
                    <SymbolAyat2 width={40} height={40} />
                    <Text style={styles.badgeText}>{item.number}</Text>
                  </View>

                  {/* Surah Info */}
                  <View style={styles.surahInfo}>
                    <View style={styles.surahNameRow}>
                      <Text style={styles.surahName}>{item.name_id}</Text>
                      {item.name_translation && (
                        <Text style={styles.surahTranslation}>{`(${item.name_translation})`}</Text>
                      )}
                    </View>
                    <Text style={styles.surahMeta}>
                      {getTypeLabel(item.type)} | {item.ayat_count} AYAT
                    </Text>
                  </View>

                  {/* Navigation Arrow */}
                  <Feather
                    name="chevron-right"
                    size={24}
                    color={colors.primary}
                    style={styles.arrowIcon}
                  />
                </Pressable>
                <View style={styles.separator} />
              </>
            );
          }}
          style={styles.listContent}
          contentContainerStyle={styles.listContentContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Same as ReaderScreen
  },
  topBar: {
    backgroundColor: '#00C896', // Brand green
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
  },
  topBarContent: {
    flex: 1,
    marginLeft: 12,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  topBarActions: {
    flexDirection: 'row',
    gap: 12,
  },
  topBarIcon: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#00C896', // Brand green
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  tabActive: {
    backgroundColor: '#1B5E4F',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.7,
  },
  tabTextActive: {
    opacity: 1,
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.primary, // Light green
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  listContent: {
    flex: 1,
    backgroundColor: '#FFFFF',
  },
  listContentContainer: {
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingLeft: 8,
    paddingRight: 16,
    backgroundColor: '#FFFFFF',
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
    position: 'relative',
  },
  badgeText: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: '400', // Not bold
    color: '#000000', // Black
  },
  surahInfo: {
    flex: 1,
    marginRight: 12,
  },
  surahNameRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  surahName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginRight: 4,
  },
  surahTranslation: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280', // Same color as surahMeta
  },
  surahMeta: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '400',
  },
  arrowIcon: {
    opacity: 0.6,
  },
  separator: {
    height: 0.5, // Thinner line
    backgroundColor: '#E5E5E5',
    marginHorizontal: 20,
  },
});
