export type LevelKey = 'timer' | 'halve' | 'kvarter' | 'minutter';
export interface Time { h: number; m: number; }
export interface LevelDef { label: string; minutes: number[]; stars: number; desc: string; }

const HOUR_NAMES = ['tolv', 'et', 'to', 'tre', 'fire', 'fem', 'seks', 'syv', 'otte', 'ni', 'ti', 'elleve'];
export const hourName = (h: number): string => HOUR_NAMES[h % 12];
export const nextHourName = (h: number): string => HOUR_NAMES[(h + 1) % 12];

export const LEVELS: Record<LevelKey, LevelDef> = {
  timer: { label: 'Hele timer', minutes: [0], stars: 1, desc: 'fx „klokken tre“' },
  halve: { label: 'Halve timer', minutes: [0, 30], stars: 2, desc: 'hel og „halv“' },
  kvarter: { label: 'Kvarter', minutes: [0, 15, 30, 45], stars: 3, desc: '„kvart over / i“' },
  minutter: { label: 'Fem minutter', minutes: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55], stars: 4, desc: 'alle fem minutter' },
};

export function danishTime(h: number, m: number): string {
  switch (m) {
    case 0: return `klokken ${hourName(h)}`;
    case 5: return `fem minutter over ${hourName(h)}`;
    case 10: return `ti minutter over ${hourName(h)}`;
    case 15: return `kvart over ${hourName(h)}`;
    case 20: return `tyve minutter over ${hourName(h)}`;
    case 25: return `fem minutter i halv ${nextHourName(h)}`;
    case 30: return `halv ${nextHourName(h)}`;
    case 35: return `fem minutter over halv ${nextHourName(h)}`;
    case 40: return `tyve minutter i ${nextHourName(h)}`;
    case 45: return `kvart i ${nextHourName(h)}`;
    case 50: return `ti minutter i ${nextHourName(h)}`;
    case 55: return `fem minutter i ${nextHourName(h)}`;
    default: return `${hourName(h)} ${m}`;
  }
}

export const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
export const digital = (h: number, m: number): string => `${h}.${String(m).padStart(2, '0')}`;
export const tKey = (t: Time): string => `${t.h}:${t.m}`;
export const rand = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
export const randInt = (n: number): number => Math.floor(Math.random() * n);

export function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export function randomTime(level: LevelKey): Time {
  const mins = LEVELS[level].minutes;
  return { h: 1 + randInt(12), m: mins[randInt(mins.length)] };
}

export function makeOptions(answer: Time, level: LevelKey): Time[] {
  const map = new Map<string, Time>();
  map.set(tKey(answer), answer);
  // Nabo-fælden: samme minutter, nabotime (fanger halv/kvart-forvekslingen).
  const neighbour: Time = { h: (answer.h % 12) + 1, m: answer.m };
  map.set(tKey(neighbour), neighbour);
  let guard = 0;
  while (map.size < 4 && guard < 300) {
    guard++;
    const c = randomTime(level);
    map.set(tKey(c), c);
  }
  return shuffle([...map.values()]);
}

export function snapMinute(m: number, level: LevelKey): number {
  const opts = LEVELS[level].minutes;
  let best = opts[0];
  let bd = 999;
  for (const o of opts) {
    const raw = Math.abs(m - o);
    const d = Math.min(raw, 60 - raw);
    if (d < bd) { bd = d; best = o; }
  }
  return best;
}

export const polar = (r: number, deg: number): { x: number; y: number } => {
  const rad = (deg * Math.PI) / 180;
  return { x: 100 + r * Math.sin(rad), y: 100 - r * Math.cos(rad) };
};

export const CORRECT = ['Flot, Alfred! 🌟', 'Sådan! 🎉', 'Du er en klokke-mester! ⭐', 'Helt rigtigt! 👏', 'Super, Alfred! 💫', 'Wow — du kan det! 🚀'];
export const WRONG = ['Ikke helt — prøv igen! 💪', 'Tæt på! Kig en gang til 👀', 'Hov, prøv igen, Alfred 🙂', 'Prøv lige igen — du kan godt! ✨'];
