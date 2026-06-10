import { describe, it, expect } from 'vitest';
import { skyTheme } from '../src/lib/sky';

describe('skyTheme', () => {
  it('nat sent og tidligt', () => {
    expect(skyTheme(23).night).toBe(true);
    expect(skyTheme(3).night).toBe(true);
    expect(skyTheme(5).night).toBe(true);
  });
  it('morgen 6-8', () => {
    const t = skyTheme(7);
    expect(t.night).toBe(false);
    expect(t.gradient).toContain('FFD9B8');
  });
  it('dag 9-16', () => {
    expect(skyTheme(12).night).toBe(false);
    expect(skyTheme(12).gradient).toContain('BFE6F7');
  });
  it('aften 17-20', () => {
    const t = skyTheme(19);
    expect(t.night).toBe(false);
    expect(t.gradient).toContain('F5C28C');
  });
});
