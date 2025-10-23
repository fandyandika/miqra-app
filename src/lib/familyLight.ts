export type HouseLight = 'dark' | 'dim' | 'bright' | 'radiant';

/**
 * Determine the house light state based on today's family reading progress.
 */
export function calcHouseLight({
  membersReadToday,
  totalMembers,
  familyStreakDays,
}: {
  membersReadToday: number;
  totalMembers: number;
  familyStreakDays: number;
}): HouseLight {
  if (totalMembers <= 0) return 'dark';
  if (membersReadToday <= 0) return 'dark';

  const ratio = membersReadToday / totalMembers;
  if (ratio < 0.5) return 'dim';
  if (ratio < 1) return 'bright';
  return familyStreakDays >= 5 ? 'radiant' : 'bright';
}

/** Indonesian accessibility label */
export function getHouseA11yLabel(
  state: HouseLight,
  membersReadToday: number,
  totalMembers: number
): string {
  const percent =
    totalMembers > 0 ? Math.round((membersReadToday / totalMembers) * 100) : 0;

  const base =
    state === 'dark'
      ? 'Rumah keluarga masih gelap.'
      : state === 'dim'
        ? 'Rumah mulai bercahaya.'
        : state === 'bright'
          ? 'Rumah sudah terang.'
          : "Rumah bercahaya penuh dengan semangat Qur'an.";

  return `${base} ${membersReadToday} dari ${totalMembers} anggota sudah membaca hari ini (${percent}%).`;
}
