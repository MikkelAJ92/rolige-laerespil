// src/services/words-progress.ts
import type { WordLevel } from '../domain/words';
import { getJSON, setJSON } from '../core/storage';

const KEY = 'rl.words.v1';
const THRESHOLD = 5;

export interface WordsState {
  level: WordLevel;
  correctByLevel: Record<WordLevel, number>;
  trophies: string[];
  collection: string[];
}

export interface WordsRecordResult {
  state: WordsState;
  newTrophies: string[];
  unlockedDino: string | null;
  leveledUp: boolean;
}

export function wordsDefaultState(): WordsState {
  return { level: 1, correctByLevel: { 1: 0, 2: 0, 3: 0 }, trophies: [], collection: [] };
}

export function wordsLoad(store: Storage = localStorage): WordsState {
  const s = getJSON<WordsState>(KEY, wordsDefaultState(), store);
  const base = wordsDefaultState();
  return {
    ...base,
    ...s,
    correctByLevel: { ...base.correctByLevel, ...(s.correctByLevel ?? {}) },
  };
}

export function wordsSave(state: WordsState, store: Storage = localStorage): void {
  setJSON(KEY, state, store);
}

export function wordsRecordCorrect(state: WordsState, level: WordLevel): WordsRecordResult {
  const next: WordsState = {
    ...state,
    correctByLevel: { ...state.correctByLevel },
    trophies: [...state.trophies],
    collection: [...state.collection],
  };
  next.correctByLevel[level] = (next.correctByLevel[level] ?? 0) + 1;
  const count = next.correctByLevel[level];

  const newTrophies: string[] = [];
  let unlockedDino: string | null = null;
  let leveledUp = false;

  if (count % THRESHOLD === 0) {
    const trophyId = `wlvl${level}-${count}`;
    newTrophies.push(trophyId);
    next.trophies.push(trophyId);
    unlockedDino = `wdino-${next.collection.length + 1}`;
    next.collection.push(unlockedDino);
    if (count === THRESHOLD && level < 3) {
      next.level = (level + 1) as WordLevel;
      leveledUp = true;
    }
  }
  return { state: next, newTrophies, unlockedDino, leveledUp };
}
