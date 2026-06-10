import { describe, it, expect } from 'vitest';
import { hintForTime } from '../src/domain/hints';

describe('hintForTime trin 1 (den lille viser)', () => {
  it('hel time: peger lige på', () => {
    expect(hintForTime({ h: 3, m: 0 }, 1)).toBe('Den lille viser peger lige på tre.');
  });
  it('ellers: mellem to timer (inkl. 12 -> et)', () => {
    expect(hintForTime({ h: 3, m: 30 }, 1)).toBe('Den lille viser er mellem tre og fire.');
    expect(hintForTime({ h: 12, m: 30 }, 1)).toBe('Den lille viser er mellem tolv og et.');
  });
});

describe('hintForTime trin 2 (den store viser)', () => {
  it('hel, halv, kvart over, kvart i', () => {
    expect(hintForTime({ h: 3, m: 0 }, 2)).toBe('Den store viser peger lige op på tolv.');
    expect(hintForTime({ h: 4, m: 30 }, 2)).toBe('Den store viser peger ned på seks. Det betyder halv.');
    expect(hintForTime({ h: 5, m: 15 }, 2)).toBe('Den store viser peger på tre. Det er kvart over.');
    expect(hintForTime({ h: 7, m: 45 }, 2)).toBe('Den store viser peger på ni. Det er kvart i.');
  });
  it('øvrige fem-minutter: peger på tallet', () => {
    expect(hintForTime({ h: 3, m: 20 }, 2)).toBe('Den store viser peger på fire.');
    expect(hintForTime({ h: 3, m: 55 }, 2)).toBe('Den store viser peger på elleve.');
    expect(hintForTime({ h: 3, m: 5 }, 2)).toBe('Den store viser peger på et.');
  });
});
