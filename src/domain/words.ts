// src/domain/words.ts
export type WordLevel = 1 | 2 | 3;
export type Rng = () => number; // [0, 1)

export interface WordEntry {
  word: string;    // små bogstaver
  picture: string; // id i ui/pictures.ts
}

export interface WordLevelConfig {
  level: WordLevel;
  label: string;
  showWord: boolean;
}

export const WORD_LEVELS: Record<WordLevel, WordLevelConfig> = {
  1: { level: 1, label: '3 bogstaver', showWord: true },
  2: { level: 2, label: '4 bogstaver', showWord: false },
  3: { level: 3, label: '5+ bogstaver', showWord: false },
};

export const WORDS: WordEntry[] = [
  // Niveau 1 — 3 bogstaver (inkl. æ/ø/å)
  { word: 'sol', picture: 'sol' },
  { word: 'kat', picture: 'kat' },
  { word: 'hus', picture: 'hus' },
  { word: 'træ', picture: 'trae' },
  { word: 'bål', picture: 'baal' },
  { word: 'øje', picture: 'oeje' },
  // Niveau 2 — 4 bogstaver
  { word: 'ugle', picture: 'ugle' },
  { word: 'dino', picture: 'dino' },
  { word: 'bold', picture: 'bold' },
  { word: 'fisk', picture: 'fisk' },
  // Niveau 3 — 5+ bogstaver
  { word: 'cykel', picture: 'cykel' },
  { word: 'banan', picture: 'banan' },
];

export function wordsForLevel(level: WordLevel): WordEntry[] {
  if (level === 1) return WORDS.filter((w) => w.word.length === 3);
  if (level === 2) return WORDS.filter((w) => w.word.length === 4);
  return WORDS.filter((w) => w.word.length >= 5);
}

export function pickWord(level: WordLevel, rng: Rng): WordEntry {
  const pool = wordsForLevel(level);
  return pool[Math.floor(rng() * pool.length)];
}

export function shuffledLetters(word: string, rng: Rng): string[] {
  const a = [...word];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Er det tappede bogstav det næste rigtige i ordet? */
export function isCorrectNext(word: string, typed: string, letter: string): boolean {
  return typed.length < word.length && word[typed.length] === letter;
}

export function isComplete(word: string, typed: string): boolean {
  return typed === word;
}
