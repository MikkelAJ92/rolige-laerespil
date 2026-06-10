// tests/words-progress.test.ts
import { describe, it, expect } from 'vitest';
import { wordsDefaultState, wordsRecordCorrect } from '../src/services/words-progress';

describe('wordsRecordCorrect', () => {
  it('tæller op uden belønning før tærsklen', () => {
    const r = wordsRecordCorrect(wordsDefaultState(), 1);
    expect(r.state.correctByLevel[1]).toBe(1);
    expect(r.newTrophies).toEqual([]);
    expect(r.leveledUp).toBe(false);
  });

  it('giver trofæ, dino og level-op ved 5 rigtige', () => {
    let res = wordsRecordCorrect(wordsDefaultState(), 1);
    for (let i = 0; i < 4; i++) res = wordsRecordCorrect(res.state, 1);
    expect(res.state.correctByLevel[1]).toBe(5);
    expect(res.newTrophies).toContain('wlvl1-5');
    expect(res.unlockedDino).toBe('wdino-1');
    expect(res.leveledUp).toBe(true);
    expect(res.state.level).toBe(2);
  });

  it('går ikke op over niveau 3', () => {
    const state = { level: 3 as const, correctByLevel: { 1: 0, 2: 0, 3: 4 }, trophies: [], collection: [] };
    const res = wordsRecordCorrect(state, 3);
    expect(res.state.level).toBe(3);
    expect(res.leveledUp).toBe(false);
  });
});
