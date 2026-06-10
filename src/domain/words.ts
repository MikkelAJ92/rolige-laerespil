export type WordLevel = 1 | 2 | 3;
export type Rng = () => number;

export interface WordEntry {
  word: string;
  emoji: string;
  level: WordLevel;
}

export interface WordLevelDef {
  label: string;
  desc: string;
  hidden: number;
  distractors: number;
}

export const WORD_LEVELS: Record<WordLevel, WordLevelDef> = {
  1: { label: 'Korte ord', desc: 'ét gemt bogstav', hidden: 1, distractors: 3 },
  2: { label: 'Længere ord', desc: 'to gemte bogstaver', hidden: 2, distractors: 3 },
  3: { label: 'Lange ord', desc: 'tre gemte bogstaver', hidden: 3, distractors: 3 },
};

/** 1.-klasses ord (Læs-Let-niveau) med emoji som billedstøtte. */
export const WORD_BANK: WordEntry[] = [
  { word: 'kat', emoji: '🐱', level: 1 },
  { word: 'sol', emoji: '☀️', level: 1 },
  { word: 'hus', emoji: '🏠', level: 1 },
  { word: 'bil', emoji: '🚗', level: 1 },
  { word: 'fisk', emoji: '🐟', level: 1 },
  { word: 'bold', emoji: '⚽', level: 1 },
  { word: 'mus', emoji: '🐭', level: 1 },
  { word: 'tog', emoji: '🚂', level: 1 },
  { word: 'dino', emoji: '🦕', level: 2 },
  { word: 'ugle', emoji: '🦉', level: 2 },
  { word: 'æble', emoji: '🍎', level: 2 },
  { word: 'hest', emoji: '🐴', level: 2 },
  { word: 'løve', emoji: '🦁', level: 2 },
  { word: 'kage', emoji: '🍰', level: 2 },
  { word: 'banan', emoji: '🍌', level: 2 },
  { word: 'robot', emoji: '🤖', level: 2 },
  { word: 'cykel', emoji: '🚲', level: 3 },
  { word: 'delfin', emoji: '🐬', level: 3 },
  { word: 'raket', emoji: '🚀', level: 3 },
  { word: 'elefant', emoji: '🐘', level: 3 },
  { word: 'pingvin', emoji: '🐧', level: 3 },
  { word: 'regnbue', emoji: '🌈', level: 3 },
  { word: 'traktor', emoji: '🚜', level: 3 },
  { word: 'edderkop', emoji: '🕷️', level: 3 },
];

const ALPHABET = 'abdefghiklmnoprstuvæøå';

export function wordsForLevel(level: WordLevel): WordEntry[] {
  return WORD_BANK.filter((w) => w.level === level);
}

export function pickWord(level: WordLevel, rng: Rng, avoid?: string): WordEntry {
  const pool = wordsForLevel(level);
  const filtered = avoid && pool.length > 1 ? pool.filter((w) => w.word !== avoid) : pool;
  return filtered[Math.floor(rng() * filtered.length)];
}

export interface WordPuzzle {
  entry: WordEntry;
  hiddenIdx: number[];
  tray: string[];
}

/** Dino gemmer bogstaver: vælg positioner (niveau 1 aldrig det første) og byg brik-bakken. */
export function makePuzzle(entry: WordEntry, level: WordLevel, rng: Rng): WordPuzzle {
  const def = WORD_LEVELS[level];
  const n = Math.min(def.hidden, entry.word.length - 1);
  const candidates = entry.word
    .split('')
    .map((_, i) => i)
    .filter((i) => (level === 1 ? i > 0 : true));
  const hiddenIdx: number[] = [];
  const pool = [...candidates];
  while (hiddenIdx.length < n && pool.length > 0) {
    const i = Math.floor(rng() * pool.length);
    hiddenIdx.push(pool.splice(i, 1)[0]);
  }
  hiddenIdx.sort((a, b) => a - b);

  const hiddenLetters = hiddenIdx.map((i) => entry.word[i]);
  const exclude = new Set(hiddenLetters);
  const distractors: string[] = [];
  let guard = 0;
  while (distractors.length < def.distractors && guard < 200) {
    guard++;
    const c = ALPHABET[Math.floor(rng() * ALPHABET.length)];
    if (!exclude.has(c) && !distractors.includes(c)) distractors.push(c);
  }

  const tray = [...hiddenLetters, ...distractors];
  for (let i = tray.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [tray[i], tray[j]] = [tray[j], tray[i]];
  }
  return { entry, hiddenIdx, tray };
}

/** Det venstreste ufyldte gemte felt, som bogstavet passer i — eller -1. */
export function gapForLetter(puzzle: WordPuzzle, filledIdx: number[], letter: string): number {
  for (const idx of puzzle.hiddenIdx) {
    if (!filledIdx.includes(idx) && puzzle.entry.word[idx] === letter) return idx;
  }
  return -1;
}
