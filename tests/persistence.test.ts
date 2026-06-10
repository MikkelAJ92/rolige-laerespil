import { describe, it, expect, beforeEach } from 'vitest';
import { loadProgress, saveProgress, defaultProgress, loadStats, saveStats } from '../src/lib/persistence';

describe('persistence', () => {
  beforeEach(() => localStorage.clear());

  it('gemmer og indlæser fremgang', () => {
    saveProgress({ stars: 7, trophies: 1, starRow: 2, level: 'kvarter', mode: 'ord', sound: false, wordLevel: 3 });
    expect(loadProgress()).toEqual({ stars: 7, trophies: 1, starRow: 2, level: 'kvarter', mode: 'ord', sound: false, wordLevel: 3 });
  });
  it('giver standard uden gemt data', () => {
    expect(loadProgress()).toEqual(defaultProgress());
  });
  it('giver standard ved ugyldig JSON', () => {
    localStorage.setItem('alfred.progress.v1', '{ikke json');
    expect(loadProgress()).toEqual(defaultProgress());
  });
  it('validerer ukendt level og mode', () => {
    localStorage.setItem('alfred.progress.v1', JSON.stringify({ stars: -5, trophies: 2, starRow: 9, level: 'xxx', mode: 'yyy' }));
    const p = loadProgress();
    expect(p.level).toBe('timer');
    expect(p.mode).toBe('read');
    expect(p.stars).toBe(0);   // negativt → 0
    expect(p.starRow).toBe(4); // klampet til 0-4
    expect(p.trophies).toBe(2);
    expect(p.sound).toBe(true);
    expect(p.wordLevel).toBe(1);
  });
});

describe('stats-persistens', () => {
  beforeEach(() => localStorage.clear());

  it('gemmer og indlæser stats', () => {
    saveStats({ 30: { correct: 2, wrong: 1, streak: 0 } });
    expect(loadStats()).toEqual({ 30: { correct: 2, wrong: 1, streak: 0 } });
  });
  it('giver tomt kort uden data og ved korrupt JSON', () => {
    expect(loadStats()).toEqual({});
    localStorage.setItem('alfred.stats.v1', '{ikke json');
    expect(loadStats()).toEqual({});
  });
  it('filtrerer ugyldige nøgler og klamper negative tal', () => {
    localStorage.setItem('alfred.stats.v1', JSON.stringify({
      30: { correct: -2, wrong: 1, streak: 2 },
      7: { correct: 1, wrong: 0, streak: 1 },
      abc: { correct: 1, wrong: 0, streak: 1 },
    }));
    expect(loadStats()).toEqual({ 30: { correct: 0, wrong: 1, streak: 2 } });
  });
});
