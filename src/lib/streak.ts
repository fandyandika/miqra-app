// import { fromZonedTime, toZonedTime } from 'date-fns-tz';
// import { differenceInCalendarDays } from 'date-fns';

export type TreeStage = 'sprout'|'sapling'|'young'|'mature'|'ancient';
export type TreeVariant = 'healthy'|'wilting'; // Week-1 only

/** Stage thresholds by current streak days:
 *  sprout: 1–2
 *  sapling: 3–9
 *  young: 10–29
 *  mature: 30–99
 *  ancient: >=100
 */
export function getTreeStage(currentStreakDays: number): TreeStage {
  if (currentStreakDays >= 100) return 'ancient';
  if (currentStreakDays >= 30)  return 'mature';
  if (currentStreakDays >= 10)  return 'young';
  if (currentStreakDays >= 3)   return 'sapling';
  return 'sprout';
}

/**
 * didBreakYesterday:
 * - lastCompletedDate: ISO date string "YYYY-MM-DD" (from DB, user's last successful check-in date)
 * - timezone: IANA tz string (default 'Asia/Jakarta')
 * Logic: compare "today" vs "lastCompletedDate" using local day boundary in given timezone.
 * Return true if user missed yesterday (i.e., daysSinceLastRead >= 2).
 */
export function didBreakYesterday(
  lastCompletedDate: string | null,
  timezone: string = 'Asia/Jakarta'
): boolean {
  if (!lastCompletedDate) return false;
  
  // Simplified version for debugging
  const now = new Date();
  const [y, m, d] = lastCompletedDate.split('-').map(Number);
  const lastDate = new Date(y, (m-1), d);
  const diffTime = now.getTime() - lastDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 2;
}

/** getVariant (Week-1):
 * - if brokeYesterday = true → 'wilting'
 * - else 'healthy'
 * (Recovery variant deferred to Week-2)
 */
export function getTreeVariant(brokeYesterday: boolean): TreeVariant {
  return brokeYesterday ? 'wilting' : 'healthy';
}

export type TreeVisual = {
  stage: TreeStage;
  variant: TreeVariant; // 'healthy' | 'wilting'
};

export function getTreeVisual(params: {
  currentStreakDays: number;
  brokeYesterday: boolean;
}): TreeVisual {
  return {
    stage: getTreeStage(params.currentStreakDays),
    variant: getTreeVariant(params.brokeYesterday),
  };
}

/** Indonesian accessibility label for screen readers */
export function getTreeA11yLabel(
  stage: TreeStage,
  variant: TreeVariant,
  days: number
): string {
  const stageLabel =
    stage === 'sprout'  ? 'Tunas kecil' :
    stage === 'sapling' ? 'Pohon muda' :
    stage === 'young'   ? 'Pohon remaja' :
    stage === 'mature'  ? 'Pohon dewasa' :
                          'Pohon kuno yang legendaris dengan mahkota emas';

  const variantLabel =
    variant === 'healthy'
      ? `Sehat. Streak ${days} hari.`
      : 'Memerlukan perhatian. Bacalah hari ini.';

  return `Pohon Qur'an kamu: ${stageLabel}. ${variantLabel}`;
}
