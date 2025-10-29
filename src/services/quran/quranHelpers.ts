// Get Juz number from surah + ayat
export function getJuzNumber(surahNumber: number, ayatNumber: number): number {
  // Juz boundaries (simplified mapping)
  const juzMapping: Record<string, number> = {
    '1:1': 1,
    '2:142': 2,
    '2:253': 3,
    '3:93': 4,
    '4:24': 5,
    '4:148': 6,
    '5:82': 7,
    '6:111': 8,
    '7:88': 9,
    '8:41': 10,
    '9:93': 11,
    '11:6': 12,
    '12:53': 13,
    '15:1': 14,
    '17:1': 15,
    '18:75': 16,
    '21:1': 17,
    '23:1': 18,
    '25:21': 19,
    '27:56': 20,
    '29:46': 21,
    '33:31': 22,
    '36:28': 23,
    '39:32': 24,
    '41:47': 25,
    '46:1': 26,
    '51:31': 27,
    '58:1': 28,
    '67:1': 29,
    '78:1': 30,
  };

  // Find closest juz
  const key = `${surahNumber}:${ayatNumber}`;
  if (juzMapping[key]) return juzMapping[key];

  // Approximate by finding previous boundary
  let juz = 1;
  for (const [boundary, juzNum] of Object.entries(juzMapping)) {
    const [s, a] = boundary.split(':').map(Number);
    if (surahNumber > s || (surahNumber === s && ayatNumber >= a)) {
      juz = juzNum;
    } else {
      break;
    }
  }

  return juz;
}

// Get approximate page number (Mushaf Madinah standard)
export function getPageNumber(surahNumber: number, ayatNumber: number): number {
  // Simplified calculation (average 15 ayat/page)
  // For accurate mapping, use page_mapping.json (Phase 2)

  // Rough estimate based on surah starts
  const surahPageStarts: Record<number, number> = {
    1: 1,
    2: 2,
    3: 50,
    4: 77,
    5: 106,
    6: 128,
    7: 151,
    8: 177,
    9: 187,
    10: 208,
    11: 221,
    12: 235,
    13: 249,
    14: 255,
    15: 262,
    16: 267,
    17: 282,
    18: 293,
    19: 305,
    20: 312,
    21: 322,
    22: 332,
    23: 342,
    24: 350,
    25: 359,
    26: 367,
    27: 377,
    28: 385,
    29: 396,
    30: 404,
    31: 411,
    32: 415,
    33: 418,
    34: 428,
    35: 434,
    36: 440,
    37: 446,
    38: 453,
    39: 458,
    40: 467,
    41: 477,
    42: 483,
    43: 489,
    44: 496,
    45: 499,
    46: 502,
    47: 507,
    48: 511,
    49: 515,
    50: 518,
    51: 520,
    52: 523,
    53: 526,
    54: 528,
    55: 531,
    56: 534,
    57: 537,
    58: 542,
    59: 545,
    60: 549,
    61: 551,
    62: 553,
    63: 554,
    64: 556,
    65: 558,
    66: 560,
    67: 562,
    68: 564,
    69: 566,
    70: 568,
    71: 570,
    72: 571,
    73: 574,
    74: 575,
    75: 577,
    76: 578,
    77: 580,
    78: 582,
    79: 583,
    80: 585,
    81: 586,
    82: 587,
    83: 587,
    84: 589,
    85: 590,
    86: 591,
    87: 591,
    88: 592,
    89: 593,
    90: 594,
    91: 595,
    92: 595,
    93: 596,
    94: 596,
    95: 597,
    96: 597,
    97: 598,
    98: 598,
    99: 599,
    100: 599,
    101: 600,
    102: 600,
    103: 601,
    104: 601,
    105: 601,
    106: 602,
    107: 602,
    108: 602,
    109: 603,
    110: 603,
    111: 603,
    112: 604,
    113: 604,
    114: 604,
  };

  const startPage = surahPageStarts[surahNumber] || 1;
  const ayatOffset = Math.floor(ayatNumber / 15);

  return startPage + ayatOffset;
}
