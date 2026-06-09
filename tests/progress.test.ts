import { describe, it, expect } from 'vitest';
import { defaultState, recordCorrect, owlRank } from '../src/services/progress';

describe('recordCorrect', () => {
  it('tæller rigtige svar op uden belønning før tærsklen', () => {
    const r = recordCorrect(defaultState(), 1);
    expect(r.state.correctByLevel[1]).toBe(1);
    expect(r.newTrophies).toEqual([]);
    expect(r.leveledUp).toBe(false);
  });

  it('giver trofæ, dino og level-up ved 5 rigtige', () => {
    let res = recordCorrect(defaultState(), 1);
    for (let i = 0; i < 4; i++) res = recordCorrect(res.state, 1);
    expect(res.state.correctByLevel[1]).toBe(5);
    expect(res.newTrophies).toContain('lvl1-5');
    expect(res.unlockedDino).toBe('dino-1');
    expect(res.leveledUp).toBe(true);
    expect(res.state.level).toBe(2);
  });

  it('går ikke op over niveau 4', () => {
    const state = { level: 4 as const, correctByLevel: { 1: 0, 2: 0, 3: 0, 4: 4 }, trophies: [], collection: [] };
    const res = recordCorrect(state, 4);
    expect(res.state.level).toBe(4);
    expect(res.leveledUp).toBe(false);
  });
});

describe('owlRank', () => {
  it('svarer til niveauet', () => {
    expect(owlRank({ ...defaultState(), level: 3 })).toBe(3);
  });
});
