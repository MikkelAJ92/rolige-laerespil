import { describe, it, expect } from 'vitest';
import { stepHour, stepMinute } from '../src/activities/clock/set-mode';

describe('stepHour', () => {
  it('går fremad og wrapper 12 -> 1', () => {
    expect(stepHour(3, 1)).toBe(4);
    expect(stepHour(12, 1)).toBe(1);
  });
  it('går baglæns og wrapper 1 -> 12', () => {
    expect(stepHour(1, -1)).toBe(12);
  });
});

describe('stepMinute', () => {
  const minutes = [0, 15, 30, 45];
  it('cykler gennem niveauets minutter', () => {
    expect(stepMinute(0, minutes, 1)).toBe(15);
    expect(stepMinute(45, minutes, 1)).toBe(0);
    expect(stepMinute(0, minutes, -1)).toBe(45);
  });
});
