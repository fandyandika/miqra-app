import AsyncStorage from '@react-native-async-storage/async-storage';

// Static imports for surah 1-114 - Kemenagitconvert data
import surah001Arabic from '../../../assets/quran/kemenagitconvert/surah_001.json';
import surah001Indonesian from '../../../assets/quran/id/surah_001.id.json';
import surah002Arabic from '../../../assets/quran/kemenagitconvert/surah_002.json';
import surah002Indonesian from '../../../assets/quran/id/surah_002.id.json';
import surah003Arabic from '../../../assets/quran/kemenagitconvert/surah_003.json';
import surah003Indonesian from '../../../assets/quran/id/surah_003.id.json';
import surah004Arabic from '../../../assets/quran/kemenagitconvert/surah_004.json';
import surah004Indonesian from '../../../assets/quran/id/surah_004.id.json';
import surah005Arabic from '../../../assets/quran/kemenagitconvert/surah_005.json';
import surah005Indonesian from '../../../assets/quran/id/surah_005.id.json';
import surah006Arabic from '../../../assets/quran/kemenagitconvert/surah_006.json';
import surah006Indonesian from '../../../assets/quran/id/surah_006.id.json';
import surah007Arabic from '../../../assets/quran/kemenagitconvert/surah_007.json';
import surah007Indonesian from '../../../assets/quran/id/surah_007.id.json';
import surah008Arabic from '../../../assets/quran/kemenagitconvert/surah_008.json';
import surah008Indonesian from '../../../assets/quran/id/surah_008.id.json';
import surah009Arabic from '../../../assets/quran/kemenagitconvert/surah_009.json';
import surah009Indonesian from '../../../assets/quran/id/surah_009.id.json';
import surah010Arabic from '../../../assets/quran/kemenagitconvert/surah_010.json';
import surah010Indonesian from '../../../assets/quran/id/surah_010.id.json';
import surah011Arabic from '../../../assets/quran/kemenagitconvert/surah_011.json';
import surah011Indonesian from '../../../assets/quran/id/surah_011.id.json';
import surah012Arabic from '../../../assets/quran/kemenagitconvert/surah_012.json';
import surah012Indonesian from '../../../assets/quran/id/surah_012.id.json';
import surah013Arabic from '../../../assets/quran/kemenagitconvert/surah_013.json';
import surah013Indonesian from '../../../assets/quran/id/surah_013.id.json';
import surah014Arabic from '../../../assets/quran/kemenagitconvert/surah_014.json';
import surah014Indonesian from '../../../assets/quran/id/surah_014.id.json';
import surah015Arabic from '../../../assets/quran/kemenagitconvert/surah_015.json';
import surah015Indonesian from '../../../assets/quran/id/surah_015.id.json';
import surah016Arabic from '../../../assets/quran/kemenagitconvert/surah_016.json';
import surah016Indonesian from '../../../assets/quran/id/surah_016.id.json';
import surah017Arabic from '../../../assets/quran/kemenagitconvert/surah_017.json';
import surah017Indonesian from '../../../assets/quran/id/surah_017.id.json';
import surah018Arabic from '../../../assets/quran/kemenagitconvert/surah_018.json';
import surah018Indonesian from '../../../assets/quran/id/surah_018.id.json';
import surah019Arabic from '../../../assets/quran/kemenagitconvert/surah_019.json';
import surah019Indonesian from '../../../assets/quran/id/surah_019.id.json';
import surah020Arabic from '../../../assets/quran/kemenagitconvert/surah_020.json';
import surah020Indonesian from '../../../assets/quran/id/surah_020.id.json';
import surah021Arabic from '../../../assets/quran/kemenagitconvert/surah_021.json';
import surah021Indonesian from '../../../assets/quran/id/surah_021.id.json';
import surah022Arabic from '../../../assets/quran/kemenagitconvert/surah_022.json';
import surah022Indonesian from '../../../assets/quran/id/surah_022.id.json';
import surah023Arabic from '../../../assets/quran/kemenagitconvert/surah_023.json';
import surah023Indonesian from '../../../assets/quran/id/surah_023.id.json';
import surah024Arabic from '../../../assets/quran/kemenagitconvert/surah_024.json';
import surah024Indonesian from '../../../assets/quran/id/surah_024.id.json';
import surah025Arabic from '../../../assets/quran/kemenagitconvert/surah_025.json';
import surah025Indonesian from '../../../assets/quran/id/surah_025.id.json';
import surah026Arabic from '../../../assets/quran/kemenagitconvert/surah_026.json';
import surah026Indonesian from '../../../assets/quran/id/surah_026.id.json';
import surah027Arabic from '../../../assets/quran/kemenagitconvert/surah_027.json';
import surah027Indonesian from '../../../assets/quran/id/surah_027.id.json';
import surah028Arabic from '../../../assets/quran/kemenagitconvert/surah_028.json';
import surah028Indonesian from '../../../assets/quran/id/surah_028.id.json';
import surah029Arabic from '../../../assets/quran/kemenagitconvert/surah_029.json';
import surah029Indonesian from '../../../assets/quran/id/surah_029.id.json';
import surah030Arabic from '../../../assets/quran/kemenagitconvert/surah_030.json';
import surah030Indonesian from '../../../assets/quran/id/surah_030.id.json';
import surah031Arabic from '../../../assets/quran/kemenagitconvert/surah_031.json';
import surah031Indonesian from '../../../assets/quran/id/surah_031.id.json';
import surah032Arabic from '../../../assets/quran/kemenagitconvert/surah_032.json';
import surah032Indonesian from '../../../assets/quran/id/surah_032.id.json';
import surah033Arabic from '../../../assets/quran/kemenagitconvert/surah_033.json';
import surah033Indonesian from '../../../assets/quran/id/surah_033.id.json';
import surah034Arabic from '../../../assets/quran/kemenagitconvert/surah_034.json';
import surah034Indonesian from '../../../assets/quran/id/surah_034.id.json';
import surah035Arabic from '../../../assets/quran/kemenagitconvert/surah_035.json';
import surah035Indonesian from '../../../assets/quran/id/surah_035.id.json';
import surah036Arabic from '../../../assets/quran/kemenagitconvert/surah_036.json';
import surah036Indonesian from '../../../assets/quran/id/surah_036.id.json';
import surah037Arabic from '../../../assets/quran/kemenagitconvert/surah_037.json';
import surah037Indonesian from '../../../assets/quran/id/surah_037.id.json';
import surah038Arabic from '../../../assets/quran/kemenagitconvert/surah_038.json';
import surah038Indonesian from '../../../assets/quran/id/surah_038.id.json';
import surah039Arabic from '../../../assets/quran/kemenagitconvert/surah_039.json';
import surah039Indonesian from '../../../assets/quran/id/surah_039.id.json';
import surah040Arabic from '../../../assets/quran/kemenagitconvert/surah_040.json';
import surah040Indonesian from '../../../assets/quran/id/surah_040.id.json';
import surah041Arabic from '../../../assets/quran/kemenagitconvert/surah_041.json';
import surah041Indonesian from '../../../assets/quran/id/surah_041.id.json';
import surah042Arabic from '../../../assets/quran/kemenagitconvert/surah_042.json';
import surah042Indonesian from '../../../assets/quran/id/surah_042.id.json';
import surah043Arabic from '../../../assets/quran/kemenagitconvert/surah_043.json';
import surah043Indonesian from '../../../assets/quran/id/surah_043.id.json';
import surah044Arabic from '../../../assets/quran/kemenagitconvert/surah_044.json';
import surah044Indonesian from '../../../assets/quran/id/surah_044.id.json';
import surah045Arabic from '../../../assets/quran/kemenagitconvert/surah_045.json';
import surah045Indonesian from '../../../assets/quran/id/surah_045.id.json';
import surah046Arabic from '../../../assets/quran/kemenagitconvert/surah_046.json';
import surah046Indonesian from '../../../assets/quran/id/surah_046.id.json';
import surah047Arabic from '../../../assets/quran/kemenagitconvert/surah_047.json';
import surah047Indonesian from '../../../assets/quran/id/surah_047.id.json';
import surah048Arabic from '../../../assets/quran/kemenagitconvert/surah_048.json';
import surah048Indonesian from '../../../assets/quran/id/surah_048.id.json';
import surah049Arabic from '../../../assets/quran/kemenagitconvert/surah_049.json';
import surah049Indonesian from '../../../assets/quran/id/surah_049.id.json';
import surah050Arabic from '../../../assets/quran/kemenagitconvert/surah_050.json';
import surah050Indonesian from '../../../assets/quran/id/surah_050.id.json';
import surah051Arabic from '../../../assets/quran/kemenagitconvert/surah_051.json';
import surah051Indonesian from '../../../assets/quran/id/surah_051.id.json';
import surah052Arabic from '../../../assets/quran/kemenagitconvert/surah_052.json';
import surah052Indonesian from '../../../assets/quran/id/surah_052.id.json';
import surah053Arabic from '../../../assets/quran/kemenagitconvert/surah_053.json';
import surah053Indonesian from '../../../assets/quran/id/surah_053.id.json';
import surah054Arabic from '../../../assets/quran/kemenagitconvert/surah_054.json';
import surah054Indonesian from '../../../assets/quran/id/surah_054.id.json';
import surah055Arabic from '../../../assets/quran/kemenagitconvert/surah_055.json';
import surah055Indonesian from '../../../assets/quran/id/surah_055.id.json';
import surah056Arabic from '../../../assets/quran/kemenagitconvert/surah_056.json';
import surah056Indonesian from '../../../assets/quran/id/surah_056.id.json';
import surah057Arabic from '../../../assets/quran/kemenagitconvert/surah_057.json';
import surah057Indonesian from '../../../assets/quran/id/surah_057.id.json';
import surah058Arabic from '../../../assets/quran/kemenagitconvert/surah_058.json';
import surah058Indonesian from '../../../assets/quran/id/surah_058.id.json';
import surah059Arabic from '../../../assets/quran/kemenagitconvert/surah_059.json';
import surah059Indonesian from '../../../assets/quran/id/surah_059.id.json';
import surah060Arabic from '../../../assets/quran/kemenagitconvert/surah_060.json';
import surah060Indonesian from '../../../assets/quran/id/surah_060.id.json';
import surah061Arabic from '../../../assets/quran/kemenagitconvert/surah_061.json';
import surah061Indonesian from '../../../assets/quran/id/surah_061.id.json';
import surah062Arabic from '../../../assets/quran/kemenagitconvert/surah_062.json';
import surah062Indonesian from '../../../assets/quran/id/surah_062.id.json';
import surah063Arabic from '../../../assets/quran/kemenagitconvert/surah_063.json';
import surah063Indonesian from '../../../assets/quran/id/surah_063.id.json';
import surah064Arabic from '../../../assets/quran/kemenagitconvert/surah_064.json';
import surah064Indonesian from '../../../assets/quran/id/surah_064.id.json';
import surah065Arabic from '../../../assets/quran/kemenagitconvert/surah_065.json';
import surah065Indonesian from '../../../assets/quran/id/surah_065.id.json';
import surah066Arabic from '../../../assets/quran/kemenagitconvert/surah_066.json';
import surah066Indonesian from '../../../assets/quran/id/surah_066.id.json';
import surah067Arabic from '../../../assets/quran/kemenagitconvert/surah_067.json';
import surah067Indonesian from '../../../assets/quran/id/surah_067.id.json';
import surah068Arabic from '../../../assets/quran/kemenagitconvert/surah_068.json';
import surah068Indonesian from '../../../assets/quran/id/surah_068.id.json';
import surah069Arabic from '../../../assets/quran/kemenagitconvert/surah_069.json';
import surah069Indonesian from '../../../assets/quran/id/surah_069.id.json';
import surah070Arabic from '../../../assets/quran/kemenagitconvert/surah_070.json';
import surah070Indonesian from '../../../assets/quran/id/surah_070.id.json';
import surah071Arabic from '../../../assets/quran/kemenagitconvert/surah_071.json';
import surah071Indonesian from '../../../assets/quran/id/surah_071.id.json';
import surah072Arabic from '../../../assets/quran/kemenagitconvert/surah_072.json';
import surah072Indonesian from '../../../assets/quran/id/surah_072.id.json';
import surah073Arabic from '../../../assets/quran/kemenagitconvert/surah_073.json';
import surah073Indonesian from '../../../assets/quran/id/surah_073.id.json';
import surah074Arabic from '../../../assets/quran/kemenagitconvert/surah_074.json';
import surah074Indonesian from '../../../assets/quran/id/surah_074.id.json';
import surah075Arabic from '../../../assets/quran/kemenagitconvert/surah_075.json';
import surah075Indonesian from '../../../assets/quran/id/surah_075.id.json';
import surah076Arabic from '../../../assets/quran/kemenagitconvert/surah_076.json';
import surah076Indonesian from '../../../assets/quran/id/surah_076.id.json';
import surah077Arabic from '../../../assets/quran/kemenagitconvert/surah_077.json';
import surah077Indonesian from '../../../assets/quran/id/surah_077.id.json';
import surah078Arabic from '../../../assets/quran/kemenagitconvert/surah_078.json';
import surah078Indonesian from '../../../assets/quran/id/surah_078.id.json';
import surah079Arabic from '../../../assets/quran/kemenagitconvert/surah_079.json';
import surah079Indonesian from '../../../assets/quran/id/surah_079.id.json';
import surah080Arabic from '../../../assets/quran/kemenagitconvert/surah_080.json';
import surah080Indonesian from '../../../assets/quran/id/surah_080.id.json';
import surah081Arabic from '../../../assets/quran/kemenagitconvert/surah_081.json';
import surah081Indonesian from '../../../assets/quran/id/surah_081.id.json';
import surah082Arabic from '../../../assets/quran/kemenagitconvert/surah_082.json';
import surah082Indonesian from '../../../assets/quran/id/surah_082.id.json';
import surah083Arabic from '../../../assets/quran/kemenagitconvert/surah_083.json';
import surah083Indonesian from '../../../assets/quran/id/surah_083.id.json';
import surah084Arabic from '../../../assets/quran/kemenagitconvert/surah_084.json';
import surah084Indonesian from '../../../assets/quran/id/surah_084.id.json';
import surah085Arabic from '../../../assets/quran/kemenagitconvert/surah_085.json';
import surah085Indonesian from '../../../assets/quran/id/surah_085.id.json';
import surah086Arabic from '../../../assets/quran/kemenagitconvert/surah_086.json';
import surah086Indonesian from '../../../assets/quran/id/surah_086.id.json';
import surah087Arabic from '../../../assets/quran/kemenagitconvert/surah_087.json';
import surah087Indonesian from '../../../assets/quran/id/surah_087.id.json';
import surah088Arabic from '../../../assets/quran/kemenagitconvert/surah_088.json';
import surah088Indonesian from '../../../assets/quran/id/surah_088.id.json';
import surah089Arabic from '../../../assets/quran/kemenagitconvert/surah_089.json';
import surah089Indonesian from '../../../assets/quran/id/surah_089.id.json';
import surah090Arabic from '../../../assets/quran/kemenagitconvert/surah_090.json';
import surah090Indonesian from '../../../assets/quran/id/surah_090.id.json';
import surah091Arabic from '../../../assets/quran/kemenagitconvert/surah_091.json';
import surah091Indonesian from '../../../assets/quran/id/surah_091.id.json';
import surah092Arabic from '../../../assets/quran/kemenagitconvert/surah_092.json';
import surah092Indonesian from '../../../assets/quran/id/surah_092.id.json';
import surah093Arabic from '../../../assets/quran/kemenagitconvert/surah_093.json';
import surah093Indonesian from '../../../assets/quran/id/surah_093.id.json';
import surah094Arabic from '../../../assets/quran/kemenagitconvert/surah_094.json';
import surah094Indonesian from '../../../assets/quran/id/surah_094.id.json';
import surah095Arabic from '../../../assets/quran/kemenagitconvert/surah_095.json';
import surah095Indonesian from '../../../assets/quran/id/surah_095.id.json';
import surah096Arabic from '../../../assets/quran/kemenagitconvert/surah_096.json';
import surah096Indonesian from '../../../assets/quran/id/surah_096.id.json';
import surah097Arabic from '../../../assets/quran/kemenagitconvert/surah_097.json';
import surah097Indonesian from '../../../assets/quran/id/surah_097.id.json';
import surah098Arabic from '../../../assets/quran/kemenagitconvert/surah_098.json';
import surah098Indonesian from '../../../assets/quran/id/surah_098.id.json';
import surah099Arabic from '../../../assets/quran/kemenagitconvert/surah_099.json';
import surah099Indonesian from '../../../assets/quran/id/surah_099.id.json';
import surah100Arabic from '../../../assets/quran/kemenagitconvert/surah_100.json';
import surah100Indonesian from '../../../assets/quran/id/surah_100.id.json';
import surah101Arabic from '../../../assets/quran/kemenagitconvert/surah_101.json';
import surah101Indonesian from '../../../assets/quran/id/surah_101.id.json';
import surah102Arabic from '../../../assets/quran/kemenagitconvert/surah_102.json';
import surah102Indonesian from '../../../assets/quran/id/surah_102.id.json';
import surah103Arabic from '../../../assets/quran/kemenagitconvert/surah_103.json';
import surah103Indonesian from '../../../assets/quran/id/surah_103.id.json';
import surah104Arabic from '../../../assets/quran/kemenagitconvert/surah_104.json';
import surah104Indonesian from '../../../assets/quran/id/surah_104.id.json';
import surah105Arabic from '../../../assets/quran/kemenagitconvert/surah_105.json';
import surah105Indonesian from '../../../assets/quran/id/surah_105.id.json';
import surah106Arabic from '../../../assets/quran/kemenagitconvert/surah_106.json';
import surah106Indonesian from '../../../assets/quran/id/surah_106.id.json';
import surah107Arabic from '../../../assets/quran/kemenagitconvert/surah_107.json';
import surah107Indonesian from '../../../assets/quran/id/surah_107.id.json';
import surah108Arabic from '../../../assets/quran/kemenagitconvert/surah_108.json';
import surah108Indonesian from '../../../assets/quran/id/surah_108.id.json';
import surah109Arabic from '../../../assets/quran/kemenagitconvert/surah_109.json';
import surah109Indonesian from '../../../assets/quran/id/surah_109.id.json';
import surah110Arabic from '../../../assets/quran/kemenagitconvert/surah_110.json';
import surah110Indonesian from '../../../assets/quran/id/surah_110.id.json';
import surah111Arabic from '../../../assets/quran/kemenagitconvert/surah_111.json';
import surah111Indonesian from '../../../assets/quran/id/surah_111.id.json';
import surah112Arabic from '../../../assets/quran/kemenagitconvert/surah_112.json';
import surah112Indonesian from '../../../assets/quran/id/surah_112.id.json';
import surah113Arabic from '../../../assets/quran/kemenagitconvert/surah_113.json';
import surah113Indonesian from '../../../assets/quran/id/surah_113.id.json';
import surah114Arabic from '../../../assets/quran/kemenagitconvert/surah_114.json';
import surah114Indonesian from '../../../assets/quran/id/surah_114.id.json';

// Static imports for transliteration 1-114
import surah001Transliteration from '../../../assets/quran/transliterasi/surah_001.trans.json';
import surah002Transliteration from '../../../assets/quran/transliterasi/surah_002.trans.json';
import surah003Transliteration from '../../../assets/quran/transliterasi/surah_003.trans.json';
import surah004Transliteration from '../../../assets/quran/transliterasi/surah_004.trans.json';
import surah005Transliteration from '../../../assets/quran/transliterasi/surah_005.trans.json';
import surah006Transliteration from '../../../assets/quran/transliterasi/surah_006.trans.json';
import surah007Transliteration from '../../../assets/quran/transliterasi/surah_007.trans.json';
import surah008Transliteration from '../../../assets/quran/transliterasi/surah_008.trans.json';
import surah009Transliteration from '../../../assets/quran/transliterasi/surah_009.trans.json';
import surah010Transliteration from '../../../assets/quran/transliterasi/surah_010.trans.json';
import surah011Transliteration from '../../../assets/quran/transliterasi/surah_011.trans.json';
import surah012Transliteration from '../../../assets/quran/transliterasi/surah_012.trans.json';
import surah013Transliteration from '../../../assets/quran/transliterasi/surah_013.trans.json';
import surah014Transliteration from '../../../assets/quran/transliterasi/surah_014.trans.json';
import surah015Transliteration from '../../../assets/quran/transliterasi/surah_015.trans.json';
import surah016Transliteration from '../../../assets/quran/transliterasi/surah_016.trans.json';
import surah017Transliteration from '../../../assets/quran/transliterasi/surah_017.trans.json';
import surah018Transliteration from '../../../assets/quran/transliterasi/surah_018.trans.json';
import surah019Transliteration from '../../../assets/quran/transliterasi/surah_019.trans.json';
import surah020Transliteration from '../../../assets/quran/transliterasi/surah_020.trans.json';
import surah021Transliteration from '../../../assets/quran/transliterasi/surah_021.trans.json';
import surah022Transliteration from '../../../assets/quran/transliterasi/surah_022.trans.json';
import surah023Transliteration from '../../../assets/quran/transliterasi/surah_023.trans.json';
import surah024Transliteration from '../../../assets/quran/transliterasi/surah_024.trans.json';
import surah025Transliteration from '../../../assets/quran/transliterasi/surah_025.trans.json';
import surah026Transliteration from '../../../assets/quran/transliterasi/surah_026.trans.json';
import surah027Transliteration from '../../../assets/quran/transliterasi/surah_027.trans.json';
import surah028Transliteration from '../../../assets/quran/transliterasi/surah_028.trans.json';
import surah029Transliteration from '../../../assets/quran/transliterasi/surah_029.trans.json';
import surah030Transliteration from '../../../assets/quran/transliterasi/surah_030.trans.json';
import surah031Transliteration from '../../../assets/quran/transliterasi/surah_031.trans.json';
import surah032Transliteration from '../../../assets/quran/transliterasi/surah_032.trans.json';
import surah033Transliteration from '../../../assets/quran/transliterasi/surah_033.trans.json';
import surah034Transliteration from '../../../assets/quran/transliterasi/surah_034.trans.json';
import surah035Transliteration from '../../../assets/quran/transliterasi/surah_035.trans.json';
import surah036Transliteration from '../../../assets/quran/transliterasi/surah_036.trans.json';
import surah037Transliteration from '../../../assets/quran/transliterasi/surah_037.trans.json';
import surah038Transliteration from '../../../assets/quran/transliterasi/surah_038.trans.json';
import surah039Transliteration from '../../../assets/quran/transliterasi/surah_039.trans.json';
import surah040Transliteration from '../../../assets/quran/transliterasi/surah_040.trans.json';
import surah041Transliteration from '../../../assets/quran/transliterasi/surah_041.trans.json';
import surah042Transliteration from '../../../assets/quran/transliterasi/surah_042.trans.json';
import surah043Transliteration from '../../../assets/quran/transliterasi/surah_043.trans.json';
import surah044Transliteration from '../../../assets/quran/transliterasi/surah_044.trans.json';
import surah045Transliteration from '../../../assets/quran/transliterasi/surah_045.trans.json';
import surah046Transliteration from '../../../assets/quran/transliterasi/surah_046.trans.json';
import surah047Transliteration from '../../../assets/quran/transliterasi/surah_047.trans.json';
import surah048Transliteration from '../../../assets/quran/transliterasi/surah_048.trans.json';
import surah049Transliteration from '../../../assets/quran/transliterasi/surah_049.trans.json';
import surah050Transliteration from '../../../assets/quran/transliterasi/surah_050.trans.json';
import surah051Transliteration from '../../../assets/quran/transliterasi/surah_051.trans.json';
import surah052Transliteration from '../../../assets/quran/transliterasi/surah_052.trans.json';
import surah053Transliteration from '../../../assets/quran/transliterasi/surah_053.trans.json';
import surah054Transliteration from '../../../assets/quran/transliterasi/surah_054.trans.json';
import surah055Transliteration from '../../../assets/quran/transliterasi/surah_055.trans.json';
import surah056Transliteration from '../../../assets/quran/transliterasi/surah_056.trans.json';
import surah057Transliteration from '../../../assets/quran/transliterasi/surah_057.trans.json';
import surah058Transliteration from '../../../assets/quran/transliterasi/surah_058.trans.json';
import surah059Transliteration from '../../../assets/quran/transliterasi/surah_059.trans.json';
import surah060Transliteration from '../../../assets/quran/transliterasi/surah_060.trans.json';
import surah061Transliteration from '../../../assets/quran/transliterasi/surah_061.trans.json';
import surah062Transliteration from '../../../assets/quran/transliterasi/surah_062.trans.json';
import surah063Transliteration from '../../../assets/quran/transliterasi/surah_063.trans.json';
import surah064Transliteration from '../../../assets/quran/transliterasi/surah_064.trans.json';
import surah065Transliteration from '../../../assets/quran/transliterasi/surah_065.trans.json';
import surah066Transliteration from '../../../assets/quran/transliterasi/surah_066.trans.json';
import surah067Transliteration from '../../../assets/quran/transliterasi/surah_067.trans.json';
import surah068Transliteration from '../../../assets/quran/transliterasi/surah_068.trans.json';
import surah069Transliteration from '../../../assets/quran/transliterasi/surah_069.trans.json';
import surah070Transliteration from '../../../assets/quran/transliterasi/surah_070.trans.json';
import surah071Transliteration from '../../../assets/quran/transliterasi/surah_071.trans.json';
import surah072Transliteration from '../../../assets/quran/transliterasi/surah_072.trans.json';
import surah073Transliteration from '../../../assets/quran/transliterasi/surah_073.trans.json';
import surah074Transliteration from '../../../assets/quran/transliterasi/surah_074.trans.json';
import surah075Transliteration from '../../../assets/quran/transliterasi/surah_075.trans.json';
import surah076Transliteration from '../../../assets/quran/transliterasi/surah_076.trans.json';
import surah077Transliteration from '../../../assets/quran/transliterasi/surah_077.trans.json';
import surah078Transliteration from '../../../assets/quran/transliterasi/surah_078.trans.json';
import surah079Transliteration from '../../../assets/quran/transliterasi/surah_079.trans.json';
import surah080Transliteration from '../../../assets/quran/transliterasi/surah_080.trans.json';
import surah081Transliteration from '../../../assets/quran/transliterasi/surah_081.trans.json';
import surah082Transliteration from '../../../assets/quran/transliterasi/surah_082.trans.json';
import surah083Transliteration from '../../../assets/quran/transliterasi/surah_083.trans.json';
import surah084Transliteration from '../../../assets/quran/transliterasi/surah_084.trans.json';
import surah085Transliteration from '../../../assets/quran/transliterasi/surah_085.trans.json';
import surah086Transliteration from '../../../assets/quran/transliterasi/surah_086.trans.json';
import surah087Transliteration from '../../../assets/quran/transliterasi/surah_087.trans.json';
import surah088Transliteration from '../../../assets/quran/transliterasi/surah_088.trans.json';
import surah089Transliteration from '../../../assets/quran/transliterasi/surah_089.trans.json';
import surah090Transliteration from '../../../assets/quran/transliterasi/surah_090.trans.json';
import surah091Transliteration from '../../../assets/quran/transliterasi/surah_091.trans.json';
import surah092Transliteration from '../../../assets/quran/transliterasi/surah_092.trans.json';
import surah093Transliteration from '../../../assets/quran/transliterasi/surah_093.trans.json';
import surah094Transliteration from '../../../assets/quran/transliterasi/surah_094.trans.json';
import surah095Transliteration from '../../../assets/quran/transliterasi/surah_095.trans.json';
import surah096Transliteration from '../../../assets/quran/transliterasi/surah_096.trans.json';
import surah097Transliteration from '../../../assets/quran/transliterasi/surah_097.trans.json';
import surah098Transliteration from '../../../assets/quran/transliterasi/surah_098.trans.json';
import surah099Transliteration from '../../../assets/quran/transliterasi/surah_099.trans.json';
import surah100Transliteration from '../../../assets/quran/transliterasi/surah_100.trans.json';
import surah101Transliteration from '../../../assets/quran/transliterasi/surah_101.trans.json';
import surah102Transliteration from '../../../assets/quran/transliterasi/surah_102.trans.json';
import surah103Transliteration from '../../../assets/quran/transliterasi/surah_103.trans.json';
import surah104Transliteration from '../../../assets/quran/transliterasi/surah_104.trans.json';
import surah105Transliteration from '../../../assets/quran/transliterasi/surah_105.trans.json';
import surah106Transliteration from '../../../assets/quran/transliterasi/surah_106.trans.json';
import surah107Transliteration from '../../../assets/quran/transliterasi/surah_107.trans.json';
import surah108Transliteration from '../../../assets/quran/transliterasi/surah_108.trans.json';
import surah109Transliteration from '../../../assets/quran/transliterasi/surah_109.trans.json';
import surah110Transliteration from '../../../assets/quran/transliterasi/surah_110.trans.json';
import surah111Transliteration from '../../../assets/quran/transliterasi/surah_111.trans.json';
import surah112Transliteration from '../../../assets/quran/transliterasi/surah_112.trans.json';
import surah113Transliteration from '../../../assets/quran/transliterasi/surah_113.trans.json';
import surah114Transliteration from '../../../assets/quran/transliterasi/surah_114.trans.json';

export type Ayah = {
  number: number;
  text: string;
  translation?: string;
  transliteration?: string;
};

export type Surah = {
  number: number;
  name: string;
  ayat_count: number;
  ayat: Ayah[];
  source?: { dataset: string; version: string };
};

const CACHE_PREFIX = 'quran_surah_kemenagitconvert_v2_'; // Updated to v2 to invalidate old cache (with transliteration)

// Remove basmalah from ayah 1 for surahs where it is not counted as an ayah
function stripBasmalahIfPresent(
  surahNumber: number,
  ayat: { number: number; text: string }[]
): { number: number; text: string }[] {
  if (!Array.isArray(ayat) || ayat.length === 0) return ayat;
  // Keep basmalah only for Al-Fatihah (1). At-Tawbah (9) has no basmalah.
  if (surahNumber === 1 || surahNumber === 9) return ayat;
  const first = ayat[0];
  if (!first || typeof first.text !== 'string') return ayat;
  // Normalize: remove BOM, tatweel, and collapse spaces
  const raw = first.text || '';
  const text = raw
    .replace(/^\uFEFF/, '')
    .replace(/ـ+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  // Find the end of basmalah by scanning common endings
  const endings = ['ٱلرَّحِيمِ', 'ٱلرَّحِيمِ', 'الرَّحِيمِ', 'الرَّحِيمِ', 'الرحيم'];
  let endIdx = -1;
  let endToken = '';
  for (const token of endings) {
    const idx = text.indexOf(token);
    if (idx !== -1 && (endIdx === -1 || idx < endIdx)) {
      endIdx = idx;
      endToken = token;
    }
  }
  if (endIdx !== -1 && endIdx < 80) {
    const cleaned = text.slice(endIdx + endToken.length).trim();
    const updated = { ...first, text: cleaned };
    return [updated, ...ayat.slice(1)];
  }
  return ayat;
}

// Arabic data mapping

const ARABIC_DATA = {
  1: surah001Arabic,
  2: surah002Arabic,
  3: surah003Arabic,
  4: surah004Arabic,
  5: surah005Arabic,
  6: surah006Arabic,
  7: surah007Arabic,
  8: surah008Arabic,
  9: surah009Arabic,
  10: surah010Arabic,
  11: surah011Arabic,
  12: surah012Arabic,
  13: surah013Arabic,
  14: surah014Arabic,
  15: surah015Arabic,
  16: surah016Arabic,
  17: surah017Arabic,
  18: surah018Arabic,
  19: surah019Arabic,
  20: surah020Arabic,
  21: surah021Arabic,
  22: surah022Arabic,
  23: surah023Arabic,
  24: surah024Arabic,
  25: surah025Arabic,
  26: surah026Arabic,
  27: surah027Arabic,
  28: surah028Arabic,
  29: surah029Arabic,
  30: surah030Arabic,
  31: surah031Arabic,
  32: surah032Arabic,
  33: surah033Arabic,
  34: surah034Arabic,
  35: surah035Arabic,
  36: surah036Arabic,
  37: surah037Arabic,
  38: surah038Arabic,
  39: surah039Arabic,
  40: surah040Arabic,
  41: surah041Arabic,
  42: surah042Arabic,
  43: surah043Arabic,
  44: surah044Arabic,
  45: surah045Arabic,
  46: surah046Arabic,
  47: surah047Arabic,
  48: surah048Arabic,
  49: surah049Arabic,
  50: surah050Arabic,
  51: surah051Arabic,
  52: surah052Arabic,
  53: surah053Arabic,
  54: surah054Arabic,
  55: surah055Arabic,
  56: surah056Arabic,
  57: surah057Arabic,
  58: surah058Arabic,
  59: surah059Arabic,
  60: surah060Arabic,
  61: surah061Arabic,
  62: surah062Arabic,
  63: surah063Arabic,
  64: surah064Arabic,
  65: surah065Arabic,
  66: surah066Arabic,
  67: surah067Arabic,
  68: surah068Arabic,
  69: surah069Arabic,
  70: surah070Arabic,
  71: surah071Arabic,
  72: surah072Arabic,
  73: surah073Arabic,
  74: surah074Arabic,
  75: surah075Arabic,
  76: surah076Arabic,
  77: surah077Arabic,
  78: surah078Arabic,
  79: surah079Arabic,
  80: surah080Arabic,
  81: surah081Arabic,
  82: surah082Arabic,
  83: surah083Arabic,
  84: surah084Arabic,
  85: surah085Arabic,
  86: surah086Arabic,
  87: surah087Arabic,
  88: surah088Arabic,
  89: surah089Arabic,
  90: surah090Arabic,
  91: surah091Arabic,
  92: surah092Arabic,
  93: surah093Arabic,
  94: surah094Arabic,
  95: surah095Arabic,
  96: surah096Arabic,
  97: surah097Arabic,
  98: surah098Arabic,
  99: surah099Arabic,
  100: surah100Arabic,
  101: surah101Arabic,
  102: surah102Arabic,
  103: surah103Arabic,
  104: surah104Arabic,
  105: surah105Arabic,
  106: surah106Arabic,
  107: surah107Arabic,
  108: surah108Arabic,
  109: surah109Arabic,
  110: surah110Arabic,
  111: surah111Arabic,
  112: surah112Arabic,
  113: surah113Arabic,
  114: surah114Arabic,
};

// Translation data mapping

const TRANSLATION_DATA = {
  1: surah001Indonesian,
  2: surah002Indonesian,
  3: surah003Indonesian,
  4: surah004Indonesian,
  5: surah005Indonesian,
  6: surah006Indonesian,
  7: surah007Indonesian,
  8: surah008Indonesian,
  9: surah009Indonesian,
  10: surah010Indonesian,
  11: surah011Indonesian,
  12: surah012Indonesian,
  13: surah013Indonesian,
  14: surah014Indonesian,
  15: surah015Indonesian,
  16: surah016Indonesian,
  17: surah017Indonesian,
  18: surah018Indonesian,
  19: surah019Indonesian,
  20: surah020Indonesian,
  21: surah021Indonesian,
  22: surah022Indonesian,
  23: surah023Indonesian,
  24: surah024Indonesian,
  25: surah025Indonesian,
  26: surah026Indonesian,
  27: surah027Indonesian,
  28: surah028Indonesian,
  29: surah029Indonesian,
  30: surah030Indonesian,
  31: surah031Indonesian,
  32: surah032Indonesian,
  33: surah033Indonesian,
  34: surah034Indonesian,
  35: surah035Indonesian,
  36: surah036Indonesian,
  37: surah037Indonesian,
  38: surah038Indonesian,
  39: surah039Indonesian,
  40: surah040Indonesian,
  41: surah041Indonesian,
  42: surah042Indonesian,
  43: surah043Indonesian,
  44: surah044Indonesian,
  45: surah045Indonesian,
  46: surah046Indonesian,
  47: surah047Indonesian,
  48: surah048Indonesian,
  49: surah049Indonesian,
  50: surah050Indonesian,
  51: surah051Indonesian,
  52: surah052Indonesian,
  53: surah053Indonesian,
  54: surah054Indonesian,
  55: surah055Indonesian,
  56: surah056Indonesian,
  57: surah057Indonesian,
  58: surah058Indonesian,
  59: surah059Indonesian,
  60: surah060Indonesian,
  61: surah061Indonesian,
  62: surah062Indonesian,
  63: surah063Indonesian,
  64: surah064Indonesian,
  65: surah065Indonesian,
  66: surah066Indonesian,
  67: surah067Indonesian,
  68: surah068Indonesian,
  69: surah069Indonesian,
  70: surah070Indonesian,
  71: surah071Indonesian,
  72: surah072Indonesian,
  73: surah073Indonesian,
  74: surah074Indonesian,
  75: surah075Indonesian,
  76: surah076Indonesian,
  77: surah077Indonesian,
  78: surah078Indonesian,
  79: surah079Indonesian,
  80: surah080Indonesian,
  81: surah081Indonesian,
  82: surah082Indonesian,
  83: surah083Indonesian,
  84: surah084Indonesian,
  85: surah085Indonesian,
  86: surah086Indonesian,
  87: surah087Indonesian,
  88: surah088Indonesian,
  89: surah089Indonesian,
  90: surah090Indonesian,
  91: surah091Indonesian,
  92: surah092Indonesian,
  93: surah093Indonesian,
  94: surah094Indonesian,
  95: surah095Indonesian,
  96: surah096Indonesian,
  97: surah097Indonesian,
  98: surah098Indonesian,
  99: surah099Indonesian,
  100: surah100Indonesian,
  101: surah101Indonesian,
  102: surah102Indonesian,
  103: surah103Indonesian,
  104: surah104Indonesian,
  105: surah105Indonesian,
  106: surah106Indonesian,
  107: surah107Indonesian,
  108: surah108Indonesian,
  109: surah109Indonesian,
  110: surah110Indonesian,
  111: surah111Indonesian,
  112: surah112Indonesian,
  113: surah113Indonesian,
  114: surah114Indonesian,
};

// Transliteration data mapping

const TRANSLITERATION_DATA = {
  1: surah001Transliteration,
  2: surah002Transliteration,
  3: surah003Transliteration,
  4: surah004Transliteration,
  5: surah005Transliteration,
  6: surah006Transliteration,
  7: surah007Transliteration,
  8: surah008Transliteration,
  9: surah009Transliteration,
  10: surah010Transliteration,
  11: surah011Transliteration,
  12: surah012Transliteration,
  13: surah013Transliteration,
  14: surah014Transliteration,
  15: surah015Transliteration,
  16: surah016Transliteration,
  17: surah017Transliteration,
  18: surah018Transliteration,
  19: surah019Transliteration,
  20: surah020Transliteration,
  21: surah021Transliteration,
  22: surah022Transliteration,
  23: surah023Transliteration,
  24: surah024Transliteration,
  25: surah025Transliteration,
  26: surah026Transliteration,
  27: surah027Transliteration,
  28: surah028Transliteration,
  29: surah029Transliteration,
  30: surah030Transliteration,
  31: surah031Transliteration,
  32: surah032Transliteration,
  33: surah033Transliteration,
  34: surah034Transliteration,
  35: surah035Transliteration,
  36: surah036Transliteration,
  37: surah037Transliteration,
  38: surah038Transliteration,
  39: surah039Transliteration,
  40: surah040Transliteration,
  41: surah041Transliteration,
  42: surah042Transliteration,
  43: surah043Transliteration,
  44: surah044Transliteration,
  45: surah045Transliteration,
  46: surah046Transliteration,
  47: surah047Transliteration,
  48: surah048Transliteration,
  49: surah049Transliteration,
  50: surah050Transliteration,
  51: surah051Transliteration,
  52: surah052Transliteration,
  53: surah053Transliteration,
  54: surah054Transliteration,
  55: surah055Transliteration,
  56: surah056Transliteration,
  57: surah057Transliteration,
  58: surah058Transliteration,
  59: surah059Transliteration,
  60: surah060Transliteration,
  61: surah061Transliteration,
  62: surah062Transliteration,
  63: surah063Transliteration,
  64: surah064Transliteration,
  65: surah065Transliteration,
  66: surah066Transliteration,
  67: surah067Transliteration,
  68: surah068Transliteration,
  69: surah069Transliteration,
  70: surah070Transliteration,
  71: surah071Transliteration,
  72: surah072Transliteration,
  73: surah073Transliteration,
  74: surah074Transliteration,
  75: surah075Transliteration,
  76: surah076Transliteration,
  77: surah077Transliteration,
  78: surah078Transliteration,
  79: surah079Transliteration,
  80: surah080Transliteration,
  81: surah081Transliteration,
  82: surah082Transliteration,
  83: surah083Transliteration,
  84: surah084Transliteration,
  85: surah085Transliteration,
  86: surah086Transliteration,
  87: surah087Transliteration,
  88: surah088Transliteration,
  89: surah089Transliteration,
  90: surah090Transliteration,
  91: surah091Transliteration,
  92: surah092Transliteration,
  93: surah093Transliteration,
  94: surah094Transliteration,
  95: surah095Transliteration,
  96: surah096Transliteration,
  97: surah097Transliteration,
  98: surah098Transliteration,
  99: surah099Transliteration,
  100: surah100Transliteration,
  101: surah101Transliteration,
  102: surah102Transliteration,
  103: surah103Transliteration,
  104: surah104Transliteration,
  105: surah105Transliteration,
  106: surah106Transliteration,
  107: surah107Transliteration,
  108: surah108Transliteration,
  109: surah109Transliteration,
  110: surah110Transliteration,
  111: surah111Transliteration,
  112: surah112Transliteration,
  113: surah113Transliteration,
  114: surah114Transliteration,
};

// Note: Metro bundler doesn't support dynamic require() with template literals
// We need to use static imports for all surah data
// This limitation is by design in Metro bundler

// Debug: Log static imports (commented out to avoid React rendering issues)
// console.log('🔍 Static imports loaded:');
// console.log('ARABIC_DATA keys:', Object.keys(ARABIC_DATA));
// console.log('TRANSLATION_DATA keys:', Object.keys(TRANSLATION_DATA));
// console.log('Surah 2 Arabic exists:', !!ARABIC_DATA[2]);
// console.log('Surah 6 Arabic exists:', !!ARABIC_DATA[6]);
// console.log('Surah 7 Arabic exists:', !!ARABIC_DATA[7]);
// console.log('Surah 9 Arabic exists:', !!ARABIC_DATA[9]);
// console.log('Surah 10 Arabic exists:', !!ARABIC_DATA[10]);
// if (ARABIC_DATA[2]) {
//   console.log('Surah 2 Arabic preview:', ARABIC_DATA[2].name, ARABIC_DATA[2].ayat_count, 'ayat');
// }
// if (ARABIC_DATA[6]) {
//   console.log('Surah 6 Arabic preview:', ARABIC_DATA[6].name, ARABIC_DATA[6].ayat_count, 'ayat');
// }
// if (TRANSLATION_DATA[6]) {
//   console.log('Surah 6 Translation preview:', TRANSLATION_DATA[6].ayat_count, 'ayat');
// }

export async function loadSurahArabic(number: number): Promise<Surah> {
  // Load from static imports (all surah 1-114 are now imported)
  if (ARABIC_DATA[number as keyof typeof ARABIC_DATA]) {
    const data = ARABIC_DATA[number as keyof typeof ARABIC_DATA];
    console.log(`📖 Loading surah ${number} from kemenagitconvert:`, data?.source?.dataset || 'N/A');
    return data;
  }

  // Fallback if surah not found in static data
  const meta = await loadSurahMetadata();
  const surahMeta = meta.find((m) => m.number === number);

  if (!surahMeta) {
    throw new Error(`Surah ${number} not found in metadata`);
  }

  const ayat = Array.from({ length: surahMeta.ayat_count }, (_, i) => ({
    number: i + 1,
    text: `[Surah ${number}, Ayat ${i + 1} - Loading...]`,
  }));

  return {
    number,
    name: surahMeta.name,
    ayat_count: surahMeta.ayat_count,
    ayat,
    source: { dataset: 'loading', version: '1.0' },
  };
}

export async function loadSurahTranslation(number: number, lang = 'id'): Promise<any> {
  // Load from static imports (all surah 1-114 are now imported)
  if (lang === 'id' && TRANSLATION_DATA[number as keyof typeof TRANSLATION_DATA]) {
    const data = TRANSLATION_DATA[number as keyof typeof TRANSLATION_DATA];
    return data;
  }

  // Fallback if translation not found
  const meta = await loadSurahMetadata();
  const surahMeta = meta.find((m) => m.number === number);

  if (!surahMeta) {
    return { ayat: [] };
  }

  const ayat = Array.from({ length: surahMeta.ayat_count }, (_, i) => ({
    number: i + 1,
    translation: `[Terjemahan Surah ${number}, Ayat ${i + 1} - Loading...]`,
  }));

  return {
    number,
    name: surahMeta.name,
    ayat_count: surahMeta.ayat_count,
    ayat,
    source: { dataset: 'loading', version: '1.0' },
  };
}

export async function loadSurahTransliteration(number: number): Promise<any> {
  // Load from static imports (all surah 1-114 are now imported)
  if (TRANSLITERATION_DATA[number as keyof typeof TRANSLITERATION_DATA]) {
    const data = TRANSLITERATION_DATA[number as keyof typeof TRANSLITERATION_DATA];
    return data;
  }

  // Fallback if transliteration not found
  const meta = await loadSurahMetadata();
  const surahMeta = meta.find((m) => m.number === number);

  if (!surahMeta) {
    return { ayat: [] };
  }

  const ayat = Array.from({ length: surahMeta.ayat_count }, (_, i) => ({
    number: i + 1,
    transliteration: '',
  }));

  return {
    number,
    name: surahMeta.name,
    ayat_count: surahMeta.ayat_count,
    ayat,
    source: { dataset: 'loading', version: '1.0' },
  };
}

export async function loadSurahCombined(number: number, lang = 'id'): Promise<Surah> {
  const cacheKey = `${CACHE_PREFIX}${number}_${lang}`;
  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const arabic = await loadSurahArabic(number);
  const translation = await loadSurahTranslation(number, lang);
  const transliteration = await loadSurahTransliteration(number);

  if (!arabic) throw new Error('Missing Arabic surah data');

  // Normalize basmalah handling: remove from ayah 1 for all surahs except 1; surah 9 has none
  const normalizedArabicAyat = stripBasmalahIfPresent(arabic.number, arabic.ayat);
  const normalizedTranslationAyat = (() => {
    if (arabic.number === 1) return translation.ayat; // keep Surah 1 as-is
    if (arabic.number === 9) return translation.ayat; // Surah 9 has no basmalah
    // If basmalah was stripped from Arabic ayah 1, align translation array length
    return translation.ayat;
  })();
  const normalizedTransliterationAyat = (() => {
    if (arabic.number === 1) return transliteration.ayat; // keep Surah 1 as-is
    if (arabic.number === 9) return transliteration.ayat; // Surah 9 has no basmalah
    return transliteration.ayat;
  })();

  const mergedAyat = normalizedArabicAyat.map((a: any, i: number) => ({
    number: a.number,
    text: a.text,
    translation: normalizedTranslationAyat[i]?.translation || '',
    transliteration: normalizedTransliterationAyat[i]?.transliteration || '',
  }));

  const merged = {
    number: arabic.number,
    name: arabic.name,
    ayat_count: arabic.ayat_count,
    ayat: mergedAyat,
    source: {
      dataset: arabic.source?.dataset || 'dynamic',
      version: arabic.source?.version || '1.0',
    },
  };

  await AsyncStorage.setItem(cacheKey, JSON.stringify(merged));
  return merged;
}

export async function clearQuranCache() {
  const keys = await AsyncStorage.getAllKeys();
  const filtered = keys.filter((k) => k.startsWith(CACHE_PREFIX));
  await AsyncStorage.multiRemove(filtered);
}

export async function loadSurah(number: number): Promise<Surah> {
  return loadSurahCombined(number, 'id');
}

export type SurahMetadata = {
  number: number;
  name: string;
  name_id: string;
  name_ar: string;
  name_en: string;
  name_translation: string; // Translation from Daftar Surat
  type: string;
  ayat_count: number;
  juz?: number;
  revelation_place?: 'makkah' | 'madinah';
};

export async function loadSurahMetadata(): Promise<SurahMetadata[]> {
  // Load from daftar-surat.json (has Arabic names with diacritics)
  try {
    const daftarSurat = require('../../../assets/quran/kemenagitconvert/daftar-surat.json');
    const daftarData = daftarSurat.data || [];

    // Also load metadata for type and other info
    const metadata = require('../../../assets/quran/metadata/surah_meta_final.json');

    return daftarData.map((d: any) => {
      const meta = metadata.find((m: any) => m.number === d.id);
      return {
        number: d.id,
        name: d.surat_name || '',
        name_id: d.surat_name || '',
        name_ar: d.surat_text?.trim() || '', // This has diacritics!
        name_en: meta?.name_en || '',
        name_translation: d.surat_terjemahan || '',
        type: meta?.type || '',
        ayat_count: d.count_ayat,
        juz: meta?.juz_start,
        revelation_place: meta?.type === 'Makkiyah' ? 'makkah' : 'madinah',
      };
    });
  } catch (error) {
    console.log('Failed to load Daftar Surat, using surah_meta_final.json:', error);

    // Fallback to surah_meta_final.json
    try {
      const metadata = require('../../../assets/quran/metadata/surah_meta_final.json');
      return metadata.map((s: any) => ({
        number: s.number,
        name: s.name_id || s.name_translit || '',
        name_id: s.name_id || '',
        name_ar: s.name_ar || '',
        name_en: s.name_en || '',
        name_translation: '',
        type: s.type || '',
        ayat_count: s.ayat_count,
        juz: s.juz_start,
        revelation_place: s.type === 'Makkiyah' ? 'makkah' : 'madinah',
      }));
    } catch (error2) {
      console.log('Failed to load any metadata, using fallback:', error2);
    }
  }

  // Fallback mock data
  const surahs: SurahMetadata[] = [
    {
      number: 1,
      name: 'Al-Fatihah',
      name_id: 'Al-Fatihah',
      name_ar: 'الفاتحة',
      name_en: 'The Opening',
      type: 'Makkiyah',
      ayat_count: 7,
      juz: 1,
      revelation_place: 'makkah',
    },
    {
      number: 2,
      name: 'Al-Baqarah',
      name_id: 'Al-Baqarah',
      name_ar: 'البقرة',
      name_en: 'The Cow',
      type: 'Madaniyah',
      ayat_count: 286,
      juz: 1,
      revelation_place: 'madinah',
    },
    {
      number: 3,
      name: "Ali 'Imran",
      name_id: "Ali 'Imran",
      name_ar: 'آل عمران',
      name_en: 'The Family of Imraan',
      type: 'Madaniyah',
      ayat_count: 200,
      juz: 2,
      revelation_place: 'madinah',
    },
    { number: 4, name: 'An-Nisa', ayat_count: 176, juz: 2, revelation_place: 'madinah' },
    { number: 5, name: "Al-Ma'idah", ayat_count: 120, juz: 3, revelation_place: 'madinah' },
    { number: 6, name: "Al-An'am", ayat_count: 165, juz: 3, revelation_place: 'makkah' },
    { number: 7, name: "Al-A'raf", ayat_count: 206, juz: 4, revelation_place: 'makkah' },
    { number: 8, name: 'Al-Anfal', ayat_count: 75, juz: 4, revelation_place: 'madinah' },
    { number: 9, name: 'At-Tawbah', ayat_count: 129, juz: 5, revelation_place: 'madinah' },
    { number: 10, name: 'Yunus', ayat_count: 109, juz: 5, revelation_place: 'makkah' },
    { number: 11, name: 'Hud', ayat_count: 123, juz: 6, revelation_place: 'makkah' },
    { number: 12, name: 'Yusuf', ayat_count: 111, juz: 6, revelation_place: 'makkah' },
    { number: 13, name: "Ar-Ra'd", ayat_count: 43, juz: 7, revelation_place: 'madinah' },
    { number: 14, name: 'Ibrahim', ayat_count: 52, juz: 7, revelation_place: 'makkah' },
    { number: 15, name: 'Al-Hijr', ayat_count: 99, juz: 7, revelation_place: 'makkah' },
    { number: 16, name: 'An-Nahl', ayat_count: 128, juz: 8, revelation_place: 'makkah' },
    { number: 17, name: 'Al-Isra', ayat_count: 111, juz: 8, revelation_place: 'makkah' },
    { number: 18, name: 'Al-Kahf', ayat_count: 110, juz: 8, revelation_place: 'makkah' },
    { number: 19, name: 'Maryam', ayat_count: 98, juz: 9, revelation_place: 'makkah' },
    { number: 20, name: 'Taha', ayat_count: 135, juz: 9, revelation_place: 'makkah' },
    { number: 21, name: 'Al-Anbiya', ayat_count: 112, juz: 9, revelation_place: 'makkah' },
    { number: 22, name: 'Al-Hajj', ayat_count: 78, juz: 10, revelation_place: 'madinah' },
    { number: 23, name: "Al-Mu'minun", ayat_count: 118, juz: 10, revelation_place: 'makkah' },
    { number: 24, name: 'An-Nur', ayat_count: 64, juz: 10, revelation_place: 'madinah' },
    { number: 25, name: 'Al-Furqan', ayat_count: 77, juz: 10, revelation_place: 'makkah' },
    { number: 26, name: "Ash-Shu'ara", ayat_count: 227, juz: 11, revelation_place: 'makkah' },
    { number: 27, name: 'An-Naml', ayat_count: 93, juz: 11, revelation_place: 'makkah' },
    { number: 28, name: 'Al-Qasas', ayat_count: 88, juz: 11, revelation_place: 'makkah' },
    { number: 29, name: "Al-'Ankabut", ayat_count: 69, juz: 11, revelation_place: 'makkah' },
    { number: 30, name: 'Ar-Rum', ayat_count: 60, juz: 12, revelation_place: 'makkah' },
    { number: 31, name: 'Luqman', ayat_count: 34, juz: 12, revelation_place: 'makkah' },
    { number: 32, name: 'As-Sajdah', ayat_count: 30, juz: 12, revelation_place: 'makkah' },
    { number: 33, name: 'Al-Ahzab', ayat_count: 73, juz: 12, revelation_place: 'madinah' },
    { number: 34, name: 'Saba', ayat_count: 54, juz: 12, revelation_place: 'makkah' },
    { number: 35, name: 'Fatir', ayat_count: 45, juz: 12, revelation_place: 'makkah' },
    { number: 36, name: 'Ya Sin', ayat_count: 83, juz: 13, revelation_place: 'makkah' },
    { number: 37, name: 'As-Saffat', ayat_count: 182, juz: 13, revelation_place: 'makkah' },
    { number: 38, name: 'Sad', ayat_count: 88, juz: 13, revelation_place: 'makkah' },
    { number: 39, name: 'Az-Zumar', ayat_count: 75, juz: 13, revelation_place: 'makkah' },
    { number: 40, name: 'Ghafir', ayat_count: 85, juz: 13, revelation_place: 'makkah' },
    { number: 41, name: 'Fussilat', ayat_count: 54, juz: 14, revelation_place: 'makkah' },
    { number: 42, name: 'Ash-Shura', ayat_count: 53, juz: 14, revelation_place: 'makkah' },
    { number: 43, name: 'Az-Zukhruf', ayat_count: 89, juz: 14, revelation_place: 'makkah' },
    { number: 44, name: 'Ad-Dukhan', ayat_count: 59, juz: 14, revelation_place: 'makkah' },
    { number: 45, name: 'Al-Jathiyah', ayat_count: 37, juz: 14, revelation_place: 'makkah' },
    { number: 46, name: 'Al-Ahqaf', ayat_count: 35, juz: 14, revelation_place: 'makkah' },
    { number: 47, name: 'Muhammad', ayat_count: 38, juz: 14, revelation_place: 'madinah' },
    { number: 48, name: 'Al-Fath', ayat_count: 29, juz: 14, revelation_place: 'madinah' },
    { number: 49, name: 'Al-Hujurat', ayat_count: 18, juz: 14, revelation_place: 'madinah' },
    { number: 50, name: 'Qaf', ayat_count: 45, juz: 15, revelation_place: 'makkah' },
    { number: 51, name: 'Adh-Dhariyat', ayat_count: 60, juz: 15, revelation_place: 'makkah' },
    { number: 52, name: 'At-Tur', ayat_count: 49, juz: 15, revelation_place: 'makkah' },
    { number: 53, name: 'An-Najm', ayat_count: 62, juz: 15, revelation_place: 'makkah' },
    { number: 54, name: 'Al-Qamar', ayat_count: 55, juz: 15, revelation_place: 'makkah' },
    { number: 55, name: 'Ar-Rahman', ayat_count: 78, juz: 15, revelation_place: 'madinah' },
    { number: 56, name: "Al-Waqi'ah", ayat_count: 96, juz: 15, revelation_place: 'makkah' },
    { number: 57, name: 'Al-Hadid', ayat_count: 29, juz: 15, revelation_place: 'madinah' },
    { number: 58, name: 'Al-Mujadilah', ayat_count: 22, juz: 15, revelation_place: 'madinah' },
    { number: 59, name: 'Al-Hashr', ayat_count: 24, juz: 15, revelation_place: 'madinah' },
    { number: 60, name: 'Al-Mumtahanah', ayat_count: 13, juz: 15, revelation_place: 'madinah' },
    { number: 61, name: 'As-Saff', ayat_count: 14, juz: 15, revelation_place: 'madinah' },
    { number: 62, name: "Al-Jumu'ah", ayat_count: 11, juz: 15, revelation_place: 'madinah' },
    { number: 63, name: 'Al-Munafiqun', ayat_count: 11, juz: 15, revelation_place: 'madinah' },
    { number: 64, name: 'At-Taghabun', ayat_count: 18, juz: 15, revelation_place: 'madinah' },
    { number: 65, name: 'At-Talaq', ayat_count: 12, juz: 15, revelation_place: 'madinah' },
    { number: 66, name: 'At-Tahrim', ayat_count: 12, juz: 15, revelation_place: 'madinah' },
    { number: 67, name: 'Al-Mulk', ayat_count: 30, juz: 16, revelation_place: 'makkah' },
    { number: 68, name: 'Al-Qalam', ayat_count: 52, juz: 16, revelation_place: 'makkah' },
    { number: 69, name: 'Al-Haqqah', ayat_count: 52, juz: 16, revelation_place: 'makkah' },
    { number: 70, name: "Al-Ma'arij", ayat_count: 44, juz: 16, revelation_place: 'makkah' },
    { number: 71, name: 'Nuh', ayat_count: 28, juz: 16, revelation_place: 'makkah' },
    { number: 72, name: 'Al-Jinn', ayat_count: 28, juz: 16, revelation_place: 'makkah' },
    { number: 73, name: 'Al-Muzzammil', ayat_count: 20, juz: 16, revelation_place: 'makkah' },
    { number: 74, name: 'Al-Muddaththir', ayat_count: 56, juz: 16, revelation_place: 'makkah' },
    { number: 75, name: 'Al-Qiyamah', ayat_count: 40, juz: 16, revelation_place: 'makkah' },
    { number: 76, name: 'Al-Insan', ayat_count: 31, juz: 16, revelation_place: 'madinah' },
    { number: 77, name: 'Al-Mursalat', ayat_count: 50, juz: 16, revelation_place: 'makkah' },
    { number: 78, name: 'An-Naba', ayat_count: 40, juz: 16, revelation_place: 'makkah' },
    { number: 79, name: "An-Nazi'at", ayat_count: 46, juz: 16, revelation_place: 'makkah' },
    { number: 80, name: "'Abasa", ayat_count: 42, juz: 16, revelation_place: 'makkah' },
    { number: 81, name: 'At-Takwir', ayat_count: 29, juz: 16, revelation_place: 'makkah' },
    { number: 82, name: 'Al-Infitar', ayat_count: 19, juz: 16, revelation_place: 'makkah' },
    { number: 83, name: 'Al-Mutaffifin', ayat_count: 36, juz: 16, revelation_place: 'makkah' },
    { number: 84, name: 'Al-Inshiqaq', ayat_count: 25, juz: 16, revelation_place: 'makkah' },
    { number: 85, name: 'Al-Buruj', ayat_count: 22, juz: 16, revelation_place: 'makkah' },
    { number: 86, name: 'At-Tariq', ayat_count: 17, juz: 16, revelation_place: 'makkah' },
    { number: 87, name: "Al-A'la", ayat_count: 19, juz: 16, revelation_place: 'makkah' },
    { number: 88, name: 'Al-Ghashiyah', ayat_count: 26, juz: 16, revelation_place: 'makkah' },
    { number: 89, name: 'Al-Fajr', ayat_count: 30, juz: 16, revelation_place: 'makkah' },
    { number: 90, name: 'Al-Balad', ayat_count: 20, juz: 16, revelation_place: 'makkah' },
    { number: 91, name: 'Ash-Shams', ayat_count: 15, juz: 16, revelation_place: 'makkah' },
    { number: 92, name: 'Al-Layl', ayat_count: 21, juz: 16, revelation_place: 'makkah' },
    { number: 93, name: 'Ad-Duha', ayat_count: 11, juz: 16, revelation_place: 'makkah' },
    { number: 94, name: 'Ash-Sharh', ayat_count: 8, juz: 16, revelation_place: 'makkah' },
    { number: 95, name: 'At-Tin', ayat_count: 8, juz: 16, revelation_place: 'makkah' },
    { number: 96, name: "Al-'Alaq", ayat_count: 19, juz: 16, revelation_place: 'makkah' },
    { number: 97, name: 'Al-Qadr', ayat_count: 5, juz: 16, revelation_place: 'makkah' },
    { number: 98, name: 'Al-Bayyinah', ayat_count: 8, juz: 16, revelation_place: 'madinah' },
    { number: 99, name: 'Az-Zalzalah', ayat_count: 8, juz: 16, revelation_place: 'madinah' },
    { number: 100, name: "Al-'Adiyat", ayat_count: 11, juz: 16, revelation_place: 'makkah' },
    { number: 101, name: "Al-Qari'ah", ayat_count: 11, juz: 16, revelation_place: 'makkah' },
    { number: 102, name: 'At-Takathur', ayat_count: 8, juz: 16, revelation_place: 'makkah' },
    { number: 103, name: "Al-'Asr", ayat_count: 3, juz: 16, revelation_place: 'makkah' },
    { number: 104, name: 'Al-Humazah', ayat_count: 9, juz: 16, revelation_place: 'makkah' },
    { number: 105, name: 'Al-Fil', ayat_count: 5, juz: 16, revelation_place: 'makkah' },
    { number: 106, name: 'Quraysh', ayat_count: 4, juz: 16, revelation_place: 'makkah' },
    { number: 107, name: "Al-Ma'un", ayat_count: 7, juz: 16, revelation_place: 'makkah' },
    { number: 108, name: 'Al-Kawthar', ayat_count: 3, juz: 16, revelation_place: 'makkah' },
    { number: 109, name: 'Al-Kafirun', ayat_count: 6, juz: 16, revelation_place: 'makkah' },
    { number: 110, name: 'An-Nasr', ayat_count: 3, juz: 16, revelation_place: 'madinah' },
    { number: 111, name: 'Al-Masad', ayat_count: 5, juz: 16, revelation_place: 'makkah' },
    { number: 112, name: 'Al-Ikhlas', ayat_count: 4, juz: 16, revelation_place: 'makkah' },
    { number: 113, name: 'Al-Falaq', ayat_count: 5, juz: 16, revelation_place: 'makkah' },
    { number: 114, name: 'An-Nas', ayat_count: 6, juz: 16, revelation_place: 'makkah' },
  ];

  return surahs;
}
