// tests/mastery.test.ts
import { describe, it, expect } from 'vitest';
import {
  defaultStats, bucketState, recordAnswer, pickMinute, pickTime,
  levelMastered, levelBadge, nextLevel, deriveLevel, roundTimeTo5,
  MASTERY_STREAK, type Stats,
} from '../src/domain/mastery';
import { LEVELS } from '../src/domain/time';

function mastered() { return { correct: 3, wrong: 0, streak: 3 }; }

describe('recordAnswer', () => {
  it('bygger stime ved rigtigt første forsøg og er immutabel', () => {
    const s0 = defaultStats();
    const s1 = recordAnswer(s0, 30, true);
    const s2 = recordAnswer(s1, 30, true);
    expect(s2[30]).toEqual({ correct: 2, wrong: 0, streak: 2 });
    expect(s0[30]).toBeUndefined();
  });
  it('nulstiller stimen ved fejl', () => {
    let s = recordAnswer(defaultStats(), 0, true);
    s = recordAnswer(s, 0, true);
    s = recordAnswer(s, 0, false);
    expect(s[0]).toEqual({ correct: 2, wrong: 1, streak: 0 });
  });
});

describe('bucketState', () => {
  it('ny når aldrig set', () => expect(bucketState(undefined)).toBe('ny'));
  it('øver under stime-grænsen', () => expect(bucketState({ correct: 2, wrong: 1, streak: 2 })).toBe('øver'));
  it('mestret ved 3 i træk', () => {
    expect(MASTERY_STREAK).toBe(3);
    expect(bucketState(mastered())).toBe('mestret');
  });
});

describe('pickMinute', () => {
  it('vægter: mestret=1, ny=3 (deterministisk med fast rng)', () => {
    const stats: Stats = { 0: mastered() }; // 'halve': [0, 30] -> vægte [1, 3]
    expect(pickMinute(stats, 'halve', () => 0)).toBe(0);     // roll 0 -> første
    expect(pickMinute(stats, 'halve', () => 0.5)).toBe(30);  // roll 2 -> anden
  });
  it('vælger altid inden for niveauets minutsæt', () => {
    const rngs = [0, 0.1, 0.3, 0.5, 0.7, 0.9, 0.99];
    for (const r of rngs) {
      expect(LEVELS.kvarter.minutes).toContain(pickMinute(defaultStats(), 'kvarter', () => r));
    }
  });
});

describe('pickTime', () => {
  it('giver time 1-12 og gyldigt minut', () => {
    const t = pickTime(defaultStats(), 'minutter', () => 0.999);
    expect(t.h).toBeGreaterThanOrEqual(1);
    expect(t.h).toBeLessThanOrEqual(12);
    expect(LEVELS.minutter.minutes).toContain(t.m);
  });
});

describe('levelMastered + levelBadge', () => {
  it('kræver alle positioner mestret', () => {
    const halv: Stats = { 0: mastered(), 30: mastered() };
    expect(levelMastered(halv, 'halve')).toBe(true);
    expect(levelMastered({ 0: mastered() }, 'halve')).toBe(false);
  });
  it('badge: tom, ◐ ved delvis, ✓ ved fuld', () => {
    expect(levelBadge(defaultStats(), 'halve')).toBe('');
    expect(levelBadge({ 0: mastered() }, 'halve')).toBe('◐');
    expect(levelBadge({ 0: mastered(), 30: mastered() }, 'halve')).toBe('✓');
  });
});

describe('nextLevel + deriveLevel', () => {
  it('niveau-kæden', () => {
    expect(nextLevel('timer')).toBe('halve');
    expect(nextLevel('halve')).toBe('kvarter');
    expect(nextLevel('kvarter')).toBe('minutter');
    expect(nextLevel('minutter')).toBeNull();
  });
  it('mindste niveau for et minut', () => {
    expect(deriveLevel(0)).toBe('timer');
    expect(deriveLevel(30)).toBe('halve');
    expect(deriveLevel(15)).toBe('kvarter');
    expect(deriveLevel(45)).toBe('kvarter');
    expect(deriveLevel(5)).toBe('minutter');
    expect(deriveLevel(50)).toBe('minutter');
  });
});

describe('roundTimeTo5', () => {
  it('runder minut og håndterer time-skift og 12-format', () => {
    expect(roundTimeTo5(14, 2)).toEqual({ h: 2, m: 0 });
    expect(roundTimeTo5(14, 3)).toEqual({ h: 2, m: 5 });
    expect(roundTimeTo5(14, 58)).toEqual({ h: 3, m: 0 });
    expect(roundTimeTo5(11, 58)).toEqual({ h: 12, m: 0 });
    expect(roundTimeTo5(23, 59)).toEqual({ h: 12, m: 0 });
    expect(roundTimeTo5(0, 12)).toEqual({ h: 12, m: 10 });
  });
});
