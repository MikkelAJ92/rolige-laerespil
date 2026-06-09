import { describe, it, expect } from 'vitest';
import { hourHandAngle, minuteHandAngle } from '../src/domain/clock-math';

describe('minuteHandAngle', () => {
  it('6 grader pr. minut', () => {
    expect(minuteHandAngle(0)).toBe(0);
    expect(minuteHandAngle(15)).toBe(90);
    expect(minuteHandAngle(30)).toBe(180);
  });
});

describe('hourHandAngle', () => {
  it('30 grader pr. time', () => {
    expect(hourHandAngle(3, 0)).toBe(90);
    expect(hourHandAngle(12, 0)).toBe(0);
  });
  it('flytter sig gradvist med minutterne', () => {
    expect(hourHandAngle(6, 30)).toBe(195);
  });
});
