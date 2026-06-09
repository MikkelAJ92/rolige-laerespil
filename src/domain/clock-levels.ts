export type ClockLevel = 1 | 2 | 3 | 4;

export interface ClockTime {
  hours: number;   // 1..12
  minutes: number; // multiplum af 5
}

export interface LevelConfig {
  level: ClockLevel;
  label: string;
  minutes: number[];
}

export const LEVELS: Record<ClockLevel, LevelConfig> = {
  1: { level: 1, label: 'Hele timer', minutes: [0] },
  2: { level: 2, label: 'Halve timer', minutes: [0, 30] },
  3: { level: 3, label: 'Kvarter', minutes: [0, 15, 30, 45] },
  4: { level: 4, label: 'Fem-minutter', minutes: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] },
};

export type Rng = () => number; // [0, 1)

export function timesForLevel(level: ClockLevel): ClockTime[] {
  const out: ClockTime[] = [];
  for (let h = 1; h <= 12; h++) {
    for (const m of LEVELS[level].minutes) {
      out.push({ hours: h, minutes: m });
    }
  }
  return out;
}

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickQuestion(level: ClockLevel, rng: Rng): { answer: ClockTime; options: ClockTime[] } {
  const all = timesForLevel(level);
  const answer = all[Math.floor(rng() * all.length)];
  const pool = all.filter((t) => !(t.hours === answer.hours && t.minutes === answer.minutes));
  const distractors: ClockTime[] = [];
  while (distractors.length < 3 && pool.length) {
    const i = Math.floor(rng() * pool.length);
    distractors.push(pool.splice(i, 1)[0]);
  }
  return { answer, options: shuffle([answer, ...distractors], rng) };
}
