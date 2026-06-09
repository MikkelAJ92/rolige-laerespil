import { describe, it, expect } from 'vitest';
import { LEVELS, timesForLevel, pickQuestion, type ClockLevel } from '../src/domain/clock-levels';

describe('LEVELS', () => {
  it('niveau 1 er kun hele timer', () => {
    expect(LEVELS[1].minutes).toEqual([0]);
  });
  it('niveau 4 har alle 5-minutters-trin', () => {
    expect(LEVELS[4].minutes).toHaveLength(12);
  });
});

describe('timesForLevel', () => {
  it('niveau 1 giver 12 tider (en pr. time)', () => {
    expect(timesForLevel(1)).toHaveLength(12);
  });
  it('niveau 2 giver 24 tider', () => {
    expect(timesForLevel(2)).toHaveLength(24);
  });
});

describe('pickQuestion', () => {
  const rng = () => 0; // deterministisk
  it('giver præcis 4 svarmuligheder', () => {
    const q = pickQuestion(1 as ClockLevel, rng);
    expect(q.options).toHaveLength(4);
  });
  it('inkluderer det korrekte svar', () => {
    const q = pickQuestion(3 as ClockLevel, rng);
    expect(q.options).toContainEqual(q.answer);
  });
  it('har ingen dubletter blandt svarene', () => {
    const q = pickQuestion(4 as ClockLevel, rng);
    const keys = q.options.map((t) => `${t.hours}:${t.minutes}`);
    expect(new Set(keys).size).toBe(4);
  });
});
