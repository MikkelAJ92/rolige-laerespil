import type { ClockLevel } from '../domain/clock-levels';
import { getJSON, setJSON } from '../core/storage';

const KEY = 'rl.progress.v1';
const THRESHOLD = 5; // rigtige svar pr. niveau før trofæ + level-up

export interface ProgressState {
  level: ClockLevel;
  correctByLevel: Record<ClockLevel, number>;
  trophies: string[];
  collection: string[];
}

export interface RecordResult {
  state: ProgressState;
  newTrophies: string[];
  unlockedDino: string | null;
  leveledUp: boolean;
}

export function defaultState(): ProgressState {
  return { level: 1, correctByLevel: { 1: 0, 2: 0, 3: 0, 4: 0 }, trophies: [], collection: [] };
}

export function load(store: Storage = localStorage): ProgressState {
  const s = getJSON<ProgressState>(KEY, defaultState(), store);
  const base = defaultState();
  return {
    ...base,
    ...s,
    correctByLevel: { ...base.correctByLevel, ...(s.correctByLevel ?? {}) },
  };
}

export function save(state: ProgressState, store: Storage = localStorage): void {
  setJSON(KEY, state, store);
}

export function recordCorrect(state: ProgressState, level: ClockLevel): RecordResult {
  const next: ProgressState = {
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
    const trophyId = `lvl${level}-${count}`;
    newTrophies.push(trophyId);
    next.trophies.push(trophyId);
    unlockedDino = `dino-${next.collection.length + 1}`;
    next.collection.push(unlockedDino);
    if (count === THRESHOLD && level < 4) {
      next.level = (level + 1) as ClockLevel;
      leveledUp = true;
    }
  }
  return { state: next, newTrophies, unlockedDino, leveledUp };
}

export function owlRank(state: ProgressState): number {
  return state.level; // 1..4
}
