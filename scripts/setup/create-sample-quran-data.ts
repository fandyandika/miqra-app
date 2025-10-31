// Script to create sample Quran data for testing
// Run with: npx tsx scripts/create-sample-quran-data.ts

import * as fs from 'fs';
import * as path from 'path';

const assetsDir = path.join(__dirname, '../assets');
const quranDir = path.join(assetsDir, 'quran');
const arDir = path.join(quranDir, 'ar');
const idDir = path.join(quranDir, 'id');

// Create directories
[assetsDir, quranDir, arDir, idDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Sample Al-Fatihah data
const alFatihahArabic = {
  number: 1,
  name: 'Al-Fatihah',
  ayat_count: 7,
  ayat: [
    { number: 1, text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' },
    { number: 2, text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ' },
    { number: 3, text: 'الرَّحْمَٰنِ الرَّحِيمِ' },
    { number: 4, text: 'مَالِكِ يَوْمِ الدِّينِ' },
    { number: 5, text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ' },
    { number: 6, text: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ' },
    {
      number: 7,
      text: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
    },
  ],
  source: {
    dataset: 'quran-arabic',
    version: '1.0',
  },
};

const alFatihahTranslation = {
  number: 1,
  name: 'Al-Fatihah',
  ayat_count: 7,
  ayat: [
    { number: 1, translation: 'Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.' },
    { number: 2, translation: 'Segala puji bagi Allah, Tuhan seluruh alam.' },
    { number: 3, translation: 'Yang Maha Pengasih, Maha Penyayang.' },
    { number: 4, translation: 'Pemilik hari pembalasan.' },
    {
      number: 5,
      translation:
        'Hanya kepada Engkaulah kami menyembah dan hanya kepada Engkaulah kami mohon pertolongan.',
    },
    { number: 6, translation: 'Tunjukilah kami jalan yang lurus.' },
    {
      number: 7,
      translation:
        '(yaitu) jalan orang-orang yang telah Engkau beri nikmat kepadanya; bukan (jalan) mereka yang dimurkai dan bukan (pula jalan) mereka yang sesat.',
    },
  ],
  source: {
    dataset: 'quran-translation-id',
    version: '1.0',
  },
};

// Write sample files
fs.writeFileSync(path.join(arDir, 'surah_001.json'), JSON.stringify(alFatihahArabic, null, 2));

fs.writeFileSync(
  path.join(idDir, 'surah_001.id.json'),
  JSON.stringify(alFatihahTranslation, null, 2)
);

console.log('✅ Sample Quran data created:');
console.log(`📖 Arabic: ${path.join(arDir, 'surah_001.json')}`);
console.log(`📝 Translation: ${path.join(idDir, 'surah_001.id.json')}`);
console.log('\n🧪 You can now test the service with: npx tsx scripts/test-quran-service.ts');
