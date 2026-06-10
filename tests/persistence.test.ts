import { describe, it, expect, beforeEach } from 'vitest';
import { loadProgress, saveProgress, defaultProgress } from '../src/lib/persistence';

describe('persistence', () => {
  beforeEach(() => localStorage.clear());

  it('gemmer og indlæser fremgang', () => {
    saveProgress({ stars: 7, trophies: 1, starRow: 2, level: 'kvarter', mode: 'set' });
    expect(loadProgress()).toEqual({ stars: 7, trophies: 1, starRow: 2, level: 'kvarter', mode: 'set' });
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
  });
});
