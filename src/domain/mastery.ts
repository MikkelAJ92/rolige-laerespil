import { LEVELS, type LevelKey, type Time } from './time';

export interface BucketStat { correct: number; wrong: number; streak: number; }
/** Mestringskort: minut-position (0,5,...,55) -> stat. Fravær = aldrig set. */
export type Stats = Record<number, BucketStat>;
export type BucketState = 'ny' | 'øver' | 'mestret';
export type Rng = () => number;

export const MASTERY_STREAK = 3;

export function defaultStats(): Stats {
  return {};
}

export function bucketState(stat: BucketStat | undefined): BucketState {
  if (!stat || stat.correct + stat.wrong === 0) return 'ny';
  return stat.streak >= MASTERY_STREAK ? 'mestret' : 'øver';
}

/** Registrér ét svar (kun første forsøg tæller). Immutabel. */
export function recordAnswer(stats: Stats, minute: number, firstTryCorrect: boolean): Stats {
  const prev = stats[minute] ?? { correct: 0, wrong: 0, streak: 0 };
  const next: BucketStat = firstTryCorrect
    ? { correct: prev.correct + 1, wrong: prev.wrong, streak: prev.streak + 1 }
    : { correct: prev.correct, wrong: prev.wrong + 1, streak: 0 };
  return { ...stats, [minute]: next };
}

function bucketWeight(stat: BucketStat | undefined): number {
  const state = bucketState(stat);
  if (state === 'ny') return 3;
  if (state === 'mestret') return 1;
  return stat && stat.streak === 0 ? 4 : 2; // kæmper : på vej
}

/** Vægtet minut-valg inden for niveauets minutsæt. */
export function pickMinute(stats: Stats, level: LevelKey, rng: Rng): number {
  const minutes = LEVELS[level].minutes;
  const weights = minutes.map((m) => bucketWeight(stats[m]));
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (let i = 0; i < minutes.length; i++) {
    roll -= weights[i];
    if (roll < 0) return minutes[i];
  }
  return minutes[minutes.length - 1];
}

/** Adaptiv opgave: time uniform 1-12, minut vægtet. */
export function pickTime(stats: Stats, level: LevelKey, rng: Rng): Time {
  return { h: 1 + Math.floor(rng() * 12), m: pickMinute(stats, level, rng) };
}

export function levelMastered(stats: Stats, level: LevelKey): boolean {
  return LEVELS[level].minutes.every((m) => bucketState(stats[m]) === 'mestret');
}

/** '' = intet mestret, '◐' = delvist, '✓' = hele niveauet. */
export function levelBadge(stats: Stats, level: LevelKey): '' | '◐' | '✓' {
  const minutes = LEVELS[level].minutes;
  const done = minutes.filter((m) => bucketState(stats[m]) === 'mestret').length;
  if (done === 0) return '';
  return done === minutes.length ? '✓' : '◐';
}

export const LEVEL_ORDER: LevelKey[] = ['timer', 'halve', 'kvarter', 'minutter'];

export function nextLevel(level: LevelKey): LevelKey | null {
  const i = LEVEL_ORDER.indexOf(level);
  return i >= 0 && i < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[i + 1] : null;
}

/** Mindste niveau hvis minutsæt indeholder minuttet. */
export function deriveLevel(minute: number): LevelKey {
  for (const lvl of LEVEL_ORDER) {
    if (LEVELS[lvl].minutes.includes(minute)) return lvl;
  }
  return 'minutter';
}

/** Rund klokketid (24t) til nærmeste 5 minutter, som 12-timers Time. */
export function roundTimeTo5(h24: number, minute: number): Time {
  let m = Math.round(minute / 5) * 5;
  let h = h24;
  if (m === 60) { m = 0; h = h24 + 1; }
  const h12 = ((h % 12) + 12) % 12 || 12;
  return { h: h12, m };
}
