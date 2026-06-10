// tests/progress.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { recordCorrect, totalTrophies, overallRank, allDinos, load, type ProgressState } from '../src/services/progress';

function emptyState(): ProgressState {
  return { activities: {} };
}

describe('recordCorrect', () => {
  it('giver trofæ, dino og level-op ved 5 i en aktivitet', () => {
    let res = recordCorrect(emptyState(), 'clock', 1, 4);
    for (let i = 0; i < 4; i++) res = recordCorrect(res.state, 'clock', 1, 4);
    const a = res.state.activities.clock;
    expect(a.correctByLevel[1]).toBe(5);
    expect(res.newTrophies).toContain('clock-lvl1-5');
    expect(res.unlockedDino).toBe('clock-dino-1');
    expect(res.leveledUp).toBe(true);
    expect(a.level).toBe(2);
  });
  it('level-op kun under maxLevel', () => {
    const s: ProgressState = { activities: { words: { level: 3, correctByLevel: { 3: 4 }, trophies: [], collection: [] } } };
    const res = recordCorrect(s, 'words', 3, 3);
    expect(res.state.activities.words.level).toBe(3);
    expect(res.leveledUp).toBe(false);
  });
  it('holder aktiviteter adskilt', () => {
    let res = recordCorrect(emptyState(), 'clock', 1, 4);
    res = recordCorrect(res.state, 'words', 1, 3);
    expect(res.state.activities.clock.correctByLevel[1]).toBe(1);
    expect(res.state.activities.words.correctByLevel[1]).toBe(1);
  });
});

describe('aggregater', () => {
  const s: ProgressState = {
    activities: {
      clock: { level: 2, correctByLevel: {}, trophies: ['a', 'b'], collection: ['d1'] },
      words: { level: 1, correctByLevel: {}, trophies: ['c'], collection: ['d2'] },
    },
  };
  it('totalTrophies summerer', () => expect(totalTrophies(s)).toBe(3));
  it('overallRank er højeste niveau', () => expect(overallRank(s)).toBe(2));
  it('allDinos samler alle', () => expect(allDinos(s).sort()).toEqual(['d1', 'd2']));
});

describe('load + migration', () => {
  beforeEach(() => localStorage.clear());

  it('migrerer gamle v1-nøgler', () => {
    localStorage.setItem('rl.progress.v1', JSON.stringify({ level: 2, correctByLevel: { 1: 5, 2: 1 }, trophies: ['lvl1-5'], collection: ['dino-1'] }));
    localStorage.setItem('rl.words.v1', JSON.stringify({ level: 1, correctByLevel: { 1: 2 }, trophies: [], collection: [] }));
    const s = load();
    expect(s.activities.clock.level).toBe(2);
    expect(s.activities.clock.trophies).toContain('lvl1-5');
    expect(s.activities.words.correctByLevel[1]).toBe(2);
    expect(totalTrophies(s)).toBe(1);
  });

  it('foretrækker v2 hvis den findes', () => {
    localStorage.setItem('rl.progress.v2', JSON.stringify({ activities: { clock: { level: 3, correctByLevel: {}, trophies: [], collection: [] } } }));
    localStorage.setItem('rl.progress.v1', JSON.stringify({ level: 1, correctByLevel: {}, trophies: [], collection: [] }));
    expect(load().activities.clock.level).toBe(3);
  });

  it('giver tom state uden gemte data', () => {
    expect(load().activities).toEqual({});
  });
});
