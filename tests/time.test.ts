import { describe, it, expect } from 'vitest';
import { danishTime, snapMinute, makeOptions, randomTime, LEVELS, tKey } from '../src/domain/time';

describe('danishTime (eksakt som referencen)', () => {
  it('hele timer har klokken-præfiks', () => {
    expect(danishTime(3, 0)).toBe('klokken tre');
    expect(danishTime(12, 0)).toBe('klokken tolv');
  });
  it('kvarter og halve', () => {
    expect(danishTime(3, 15)).toBe('kvart over tre');
    expect(danishTime(3, 30)).toBe('halv fire');
    expect(danishTime(3, 45)).toBe('kvart i fire');
    expect(danishTime(12, 30)).toBe('halv et');
  });
  it('fem-minutter med time- og halv-anker', () => {
    expect(danishTime(3, 5)).toBe('fem minutter over tre');
    expect(danishTime(3, 20)).toBe('tyve minutter over tre');
    expect(danishTime(3, 25)).toBe('fem minutter i halv fire');
    expect(danishTime(3, 35)).toBe('fem minutter over halv fire');
    expect(danishTime(3, 40)).toBe('tyve minutter i fire');
    expect(danishTime(3, 55)).toBe('fem minutter i fire');
  });
});

describe('snapMinute', () => {
  it('runder til nærmeste tilladte minut for niveauet', () => {
    expect(snapMinute(13, 'kvarter')).toBe(15);
    expect(snapMinute(58, 'kvarter')).toBe(0); // wrap 60→0
    expect(snapMinute(20, 'halve')).toBe(30);
  });
});

describe('makeOptions', () => {
  it('giver 4 unikke muligheder inkl. svaret', () => {
    const ans = { h: 3, m: 30 };
    const opts = makeOptions(ans, 'kvarter');
    expect(opts).toHaveLength(4);
    expect(opts.some((o) => o.h === 3 && o.m === 30)).toBe(true);
    expect(new Set(opts.map(tKey)).size).toBe(4);
  });
});

describe('randomTime', () => {
  it('giver gyldig time og minut for niveauet', () => {
    for (let i = 0; i < 50; i++) {
      const t = randomTime('minutter');
      expect(t.h).toBeGreaterThanOrEqual(1);
      expect(t.h).toBeLessThanOrEqual(12);
      expect(LEVELS.minutter.minutes).toContain(t.m);
    }
  });
});
