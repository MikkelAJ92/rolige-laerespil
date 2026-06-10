// tests/ranks.test.ts
import { describe, it, expect } from 'vitest';
import { rankName } from '../src/domain/ranks';

describe('rankName', () => {
  it('mapper niveau til navn', () => {
    expect(rankName(1)).toBe('Ugle-ven');
    expect(rankName(2)).toBe('Klog ugle');
    expect(rankName(3)).toBe('Vis ugle');
    expect(rankName(4)).toBe('Mester-ugle');
  });
  it('niveau over 4 er stadig Mester-ugle, under 1 er Ugle-ven', () => {
    expect(rankName(7)).toBe('Mester-ugle');
    expect(rankName(0)).toBe('Ugle-ven');
  });
});
