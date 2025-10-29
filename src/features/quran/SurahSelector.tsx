import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, TextInput, Alert, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import { useContinueReading } from '@/features/baca/hooks/useContinueReading';
import { loadSurahMetadata } from '@/services/quran/quranData';
import { getJuzStartAyah } from '@/services/quran/pageMap';
import { colors } from '@/theme/colors';
import LogoAyat1 from '../../../assets/nomorayat/logoayat1.svg';
import { useQuery } from '@tanstack/react-query';
import { getBookmark } from '@/services/quran/bookmarkService';
import {
  getBookmarks,
  getBookmarksByFolder,
  removeBookmark,
  createFolderAndMoveBookmark,
  createEmptyFolder,
  renameFolder,
} from '@/services/quran/favoriteBookmarks';

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

const juzList: JuzJson = require('../../../assets/quran/juz.json');
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
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortType, setSortType] = React.useState<
    'newest' | 'oldest' | 'name-az' | 'name-za' | 'item-az'
  >('newest');
  // Create/Rename modals state
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showRenameFolderModal, setShowRenameFolderModal] = useState(false);
  const [renameOldFolder, setRenameOldFolder] = useState<string | null>(null);
  const [renameNewFolder, setRenameNewFolder] = useState('');
  const [showFolderMenuModal, setShowFolderMenuModal] = useState(false);
  const [selectedFolderName, setSelectedFolderName] = useState<string | null>(null);
  const { user } = useAuth();
  const { bookmark: oldBookmark } = useContinueReading(user?.id);

  // Use new bookmark service
  const { data: bookmark, isLoading: bookmarkLoading } = useQuery({
    queryKey: ['bookmark'],
    queryFn: getBookmark,
    enabled: !!user,
  });

  // Get bookmarks
  const { data: bookmarks, isLoading: bookmarksLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: getBookmarks,
    enabled: !!user,
  });

  const { data: bookmarksByFolder } = useQuery({
    queryKey: ['bookmarks-by-folder'],
    queryFn: getBookmarksByFolder,
    enabled: !!user,
  });

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

  // Filter surah based on search
  const filteredSurah = useMemo(() => {
    if (!searchQuery.trim() || activeTab !== 'surah') return surahs;

    const query = searchQuery.toLowerCase().trim();
    return surahs.filter((surah) => {
      // Search by name
      if (surah.name_id?.toLowerCase().includes(query)) return true;

      // Search by transliteration
      if (surah.name_ar?.toLowerCase().includes(query)) return true;

      // Search by meaning/translation
      if (surah.name_translation?.toLowerCase().includes(query)) return true;

      // Search by revelation type
      if (query === 'mekah' && surah.type === 'Makkiyah') return true;
      if (query === 'madinah' && surah.type === 'Madaniyah') return true;

      // Search by number
      if (surah.number.toString() === query) return true;

      // Search by ayat count
      if (surah.ayat_count.toString().includes(query)) return true;

      return false;
    });
  }, [searchQuery, surahs, activeTab]);

  // Sort bookmarks by folder
  const sortedBookmarksByFolder = useMemo(() => {
    if (!bookmarksByFolder) return {};

    const sortedEntries = Object.entries(bookmarksByFolder).sort(([a], [b]) => {
      switch (sortType) {
        case 'newest':
          // Sort by newest bookmark in folder
          const aNewest = bookmarksByFolder[a]?.[0]?.created_at || '';
          const bNewest = bookmarksByFolder[b]?.[0]?.created_at || '';
          return new Date(bNewest).getTime() - new Date(aNewest).getTime();
        case 'oldest':
          // Sort by oldest bookmark in folder
          const aOldest = bookmarksByFolder[a]?.[0]?.created_at || '';
          const bOldest = bookmarksByFolder[b]?.[0]?.created_at || '';
          return new Date(aOldest).getTime() - new Date(bOldest).getTime();
        case 'name-az':
          return a.localeCompare(b);
        case 'name-za':
          return b.localeCompare(a);
        default:
          return 0;
      }
    });

    return Object.fromEntries(sortedEntries);
  }, [bookmarksByFolder, sortType]);

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
        {/* Actions removed: search and hamburger */}
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

      {/* Search Input */}
      {activeTab === 'surah' && (
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari surah (nama, nomor, atau arti)..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Feather name="x" size={20} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      )}

      {/* Content based on active tab */}
      {activeTab === 'bookmark' ? (
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 10 }}>
          <View style={styles.bookmarkHeader}>
            <Pressable
              style={styles.sortButton}
              onPress={() => {
                Alert.alert('Urutkan Folder', 'Pilih cara mengurutkan folder:', [
                  { text: 'Batal', style: 'cancel' },
                  {
                    text: 'Terbaru ke Terlama',
                    onPress: () => setSortType('newest'),
                  },
                  {
                    text: 'Terlama ke Terbaru',
                    onPress: () => setSortType('oldest'),
                  },
                  {
                    text: 'Dari Nama [A-Z]',
                    onPress: () => setSortType('name-az'),
                  },
                  {
                    text: 'Dari Nama [Z-A]',
                    onPress: () => setSortType('name-za'),
                  },
                  {
                    text: 'Bookmark [A-Z] dalam Folder',
                    onPress: () => setSortType('item-az'),
                  },
                ]);
              }}
            >
              <Feather name="filter" size={16} color={colors.primary} />
              <Text style={styles.sortText}>Urutkan</Text>
            </Pressable>
            <Pressable
              style={styles.addFolderButton}
              onPress={() => {
                setShowCreateFolderModal(true);
                setNewFolderName('');
              }}
            >
              <Feather name="folder-plus" size={16} color={colors.primary} />
              <Text style={styles.addFolderText}>Folder</Text>
            </Pressable>
          </View>

          {/* Last Read Section */}
          {bookmark && (
            <View style={styles.lastReadSection}>
              <View style={styles.lastReadHeader}>
                <Feather name="book-open" size={14} color="#8B5A2B" />
                <Text style={styles.lastReadTitle}>Terakhir Baca</Text>
              </View>
              <Pressable
                style={styles.lastReadItem}
                onPress={() => navigation.navigate('LastRead')}
              >
                <View style={styles.lastReadContent}>
                  <Text style={styles.lastReadText}>
                    QS.{' '}
                    {surahs.find((s) => s.number === bookmark.surah)?.name ||
                      `Surah ${bookmark.surah}`}{' '}
                    {bookmark.surah}: Ayat {bookmark.ayat} (Juz: {bookmark.juz || '?'})
                  </Text>
                </View>
                <View style={styles.lastReadActions}>
                  <Text style={styles.historyLink}>Lihat Riwayat</Text>
                  <Text style={styles.lastReadDateRight}>
                    {bookmark.timestamp
                      ? new Date(bookmark.timestamp).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Belum ada riwayat'}
                  </Text>
                </View>
              </Pressable>
            </View>
          )}

          {bookmarksLoading ? (
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <Text style={{ color: '#636E72' }}>Memuat bookmark...</Text>
            </View>
          ) : bookmarks && bookmarks.length > 0 ? (
            <FlatList
              data={Object.entries(sortedBookmarksByFolder || {})}
              keyExtractor={([folderName]) => folderName}
              renderItem={({ item: [folderName, folderBookmarks] }) => (
                <View style={styles.folderSection}>
                  <View style={styles.folderHeader}>
                    <View style={styles.folderInfo}>
                      <Feather name="folder" size={14} color="#8B5A2B" />
                      <Text style={styles.folderName}>{folderName}</Text>
                    </View>
                    <Pressable
                      style={styles.folderMenu}
                      onPress={() => {
                        setSelectedFolderName(folderName);
                        setShowFolderMenuModal(true);
                      }}
                    >
                      <Feather name="more-horizontal" size={16} color="#6B7280" />
                    </Pressable>
                  </View>

                  {(sortType === 'item-az'
                    ? [...folderBookmarks].sort((a, b) => {
                        const aName =
                          surahs.find((s) => s.number === a.surah_number)?.name ||
                          `Surah ${a.surah_number}`;
                        const bName =
                          surahs.find((s) => s.number === b.surah_number)?.name ||
                          `Surah ${b.surah_number}`;
                        const byName = aName.localeCompare(bName);
                        if (byName !== 0) return byName;
                        return a.ayat_number - b.ayat_number;
                      })
                    : folderBookmarks
                  ).map((bookmark) => (
                    <Pressable
                      key={`${bookmark.surah_number}-${bookmark.ayat_number}`}
                      style={styles.bookmarkItem}
                      onPress={() =>
                        navigation.replace('Reader', {
                          surahNumber: bookmark.surah_number,
                          ayahNumber: bookmark.ayat_number,
                        })
                      }
                      onLongPress={() => {
                        Alert.alert(
                          'Kelola Bookmark',
                          `Surah ${bookmark.surah_number} ayat ${bookmark.ayat_number}`,
                          [
                            {
                              text: 'Hapus',
                              style: 'destructive',
                              onPress: () => {
                                Alert.alert(
                                  'Konfirmasi Hapus',
                                  'Yakin ingin menghapus bookmark ini?',
                                  [
                                    { text: 'Batal', style: 'cancel' },
                                    {
                                      text: 'Hapus',
                                      style: 'destructive',
                                      onPress: () =>
                                        removeBookmark(bookmark.surah_number, bookmark.ayat_number),
                                    },
                                  ]
                                );
                              },
                            },
                            {
                              text: 'Pindah Folder',
                              onPress: () => {
                                Alert.prompt(
                                  'Pindah ke Folder',
                                  'Masukkan nama folder baru:',
                                  [
                                    { text: 'Batal', style: 'cancel' },
                                    {
                                      text: 'Pindah',
                                      onPress: (folderName) => {
                                        if (folderName?.trim()) {
                                          createFolderAndMoveBookmark(
                                            bookmark.surah_number,
                                            bookmark.ayat_number,
                                            folderName.trim(),
                                            bookmark.notes
                                          );
                                        }
                                      },
                                    },
                                  ],
                                  'plain-text',
                                  bookmark.folder_name
                                );
                              },
                            },
                            { text: 'Batal', style: 'cancel' },
                          ]
                        );
                      }}
                    >
                      <View style={styles.bookmarkContent}>
                        <Text style={styles.bookmarkText}>
                          QS.{' '}
                          {surahs.find((s) => s.number === bookmark.surah_number)?.name ||
                            `Surah ${bookmark.surah_number}`}{' '}
                          {bookmark.surah_number}: Ayat {bookmark.ayat_number} (Juz:{' '}
                          {bookmark.juz || '?'})
                        </Text>
                        <Text style={styles.bookmarkDate}>
                          {new Date(bookmark.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>⭐</Text>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 8 }}>
                Belum Ada Bookmark
              </Text>
              <Text style={{ color: '#636E72', textAlign: 'center', lineHeight: 20 }}>
                Long-press ayat untuk menambah ke bookmark
              </Text>
            </View>
          )}
        </View>
      ) : (
        <FlatList
          data={activeTab === 'juz' ? juzData : filteredSurah}
          keyExtractor={(item) => String(activeTab === 'juz' ? item.number : item.number)}
          renderItem={({ item }) => {
            if (activeTab === 'juz') {
              // Render Juz list
              return (
                <>
                  <Pressable style={styles.row} onPress={() => openJuz(item)}>
                    {/* Symbol Ayat Badge */}
                    <View style={styles.badge}>
                      <LogoAyat1 width={40} height={40} />
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
                    <LogoAyat1 width={40} height={40} />
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

      {/* Create Folder Modal */}
      <Modal
        visible={showCreateFolderModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateFolderModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCreateFolderModal(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Buat Folder Baru</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Masukkan nama folder..."
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={async () => {
                if (newFolderName.trim()) {
                  await createEmptyFolder(newFolderName.trim());
                  setShowCreateFolderModal(false);
                  setNewFolderName('');
                }
              }}
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.backButton} onPress={() => setShowCreateFolderModal(false)}>
                <Text style={styles.backButtonText}>‹ Kembali</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalConfirm]}
                onPress={async () => {
                  if (newFolderName.trim()) {
                    await createEmptyFolder(newFolderName.trim());
                    setShowCreateFolderModal(false);
                    setNewFolderName('');
                  }
                }}
              >
                <Text style={styles.modalBtnText}>Buat</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Rename Folder Modal */}
      <Modal
        visible={showRenameFolderModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRenameFolderModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowRenameFolderModal(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Rename Folder</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nama folder baru..."
              value={renameNewFolder}
              onChangeText={setRenameNewFolder}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={async () => {
                if (
                  renameOldFolder &&
                  renameNewFolder.trim() &&
                  renameNewFolder !== renameOldFolder
                ) {
                  await renameFolder(renameOldFolder, renameNewFolder.trim());
                  setShowRenameFolderModal(false);
                }
              }}
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.backButton} onPress={() => setShowRenameFolderModal(false)}>
                <Text style={styles.backButtonText}>‹ Kembali</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalConfirm]}
                onPress={async () => {
                  if (
                    renameOldFolder &&
                    renameNewFolder.trim() &&
                    renameNewFolder !== renameOldFolder
                  ) {
                    await renameFolder(renameOldFolder, renameNewFolder.trim());
                    setShowRenameFolderModal(false);
                  }
                }}
              >
                <Text style={styles.modalBtnText}>Simpan</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Folder Menu Modal */}
      <Modal
        visible={showFolderMenuModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFolderMenuModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowFolderMenuModal(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Kelola Folder</Text>
            <Text style={styles.modalSubtitle}>📂 Folder: {selectedFolderName}</Text>

            <View style={styles.menuOptions}>
              <Pressable
                style={styles.menuOption}
                onPress={() => {
                  setShowFolderMenuModal(false);
                  if (selectedFolderName) {
                    setRenameOldFolder(selectedFolderName);
                    setRenameNewFolder(selectedFolderName);
                    setShowRenameFolderModal(true);
                  }
                }}
              >
                <Feather name="edit-2" size={20} color="#10b981" />
                <Text style={styles.menuOptionText}>Rename</Text>
              </Pressable>

              <Pressable
                style={[styles.menuOption, styles.menuOptionDanger]}
                onPress={() => {
                  setShowFolderMenuModal(false);
                  Alert.alert(
                    'Hapus Folder',
                    `Yakin ingin menghapus folder "${selectedFolderName}" dan semua bookmark di dalamnya?`,
                    [
                      { text: 'Batal', style: 'cancel' },
                      {
                        text: 'Hapus',
                        style: 'destructive',
                        onPress: () => {
                          if (selectedFolderName && bookmarksByFolder?.[selectedFolderName]) {
                            bookmarksByFolder[selectedFolderName].forEach((bookmark) => {
                              removeBookmark(bookmark.surah_number, bookmark.ayat_number);
                            });
                          }
                        },
                      },
                    ]
                  );
                }}
              >
                <Feather name="trash-2" size={20} color="#DC2626" />
                <Text style={[styles.menuOptionText, styles.menuOptionTextDanger]}>
                  Hapus Folder
                </Text>
              </Pressable>
            </View>

            <Pressable style={styles.backButton} onPress={() => setShowFolderMenuModal(false)}>
              <Text style={styles.backButtonText}>‹ Kembali</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Same as ReaderScreen
  },
  topBar: {
    backgroundColor: '#10b981', // Brand green
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
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
    backgroundColor: '#10b981', // Brand green
    borderBottomWidth: 0,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    position: 'relative',
  },
  tabActive: {
    backgroundColor: '#0FA37F',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.8,
  },
  tabTextActive: {
    opacity: 1,
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 3,
    backgroundColor: '#C6F7E2',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  listContent: {
    flex: 1,
    backgroundColor: '#FFFFF',
  },
  listContentContainer: {
    paddingTop: 4,
    paddingBottom: 12,
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
    fontWeight: '700',
    color: '#111827',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  bookmarkActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookmarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3FDF9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#B9F4E2',
  },
  sortText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 6,
  },
  addFolderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3FDF9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#B9F4E2',
  },
  addFolderText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 4,
  },
  folderSection: {
    marginBottom: 14,
  },
  folderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 6,
    backgroundColor: '#F7FDFC',
    borderRadius: 10,
  },
  folderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 8,
  },
  folderMenu: {
    padding: 6,
  },
  bookmarkItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginLeft: 16,
    marginBottom: 2,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  bookmarkContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookmarkText: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
    lineHeight: 20,
  },
  bookmarkDate: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 12,
  },
  lastReadSection: {
    marginBottom: 16,
  },
  lastReadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  lastReadTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 8,
  },
  lastReadItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  lastReadContent: {
    flex: 1,
  },
  lastReadText: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 2,
  },
  lastReadDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  lastReadActions: {
    alignItems: 'flex-end',
  },
  historyLink: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  lastReadDateRight: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'right',
  },
  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    width: '85%',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#F8FAFC',
    color: '#111827',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancel: { backgroundColor: '#6C757D' },
  modalConfirm: { backgroundColor: '#10b981' },
  modalBtnText: { color: '#FFFFFF', fontWeight: '600' },
  // New back button styles
  backButton: {
    backgroundColor: '#6C757D',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Menu modal styles
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  menuOptions: {
    marginBottom: 20,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
  },
  menuOptionDanger: {
    backgroundColor: '#FEF2F2',
  },
  menuOptionText: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
    fontWeight: '500',
  },
  menuOptionTextDanger: {
    color: '#DC2626',
  },
});
