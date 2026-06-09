import { describe, it, expect } from 'vitest';
import { timeToDanish, hourWord } from '../src/domain/time-to-danish';

describe('hourWord', () => {
  it('mapper 1-12 til danske ord', () => {
    expect(hourWord(1)).toBe('et');
    expect(hourWord(3)).toBe('tre');
    expect(hourWord(12)).toBe('tolv');
  });
  it('behandler 0 som tolv', () => {
    expect(hourWord(0)).toBe('tolv');
  });
});

describe('timeToDanish', () => {
  it('hele timer', () => {
    expect(timeToDanish(3, 0)).toBe('tre');
    expect(timeToDanish(12, 0)).toBe('tolv');
  });
  it('halve timer peger på næste time', () => {
    expect(timeToDanish(3, 30)).toBe('halv fire');
    expect(timeToDanish(12, 30)).toBe('halv et');
  });
  it('kvarter', () => {
    expect(timeToDanish(3, 15)).toBe('kvart over tre');
    expect(timeToDanish(3, 45)).toBe('kvart i fire');
  });
  it('fem-minutters-trin med time-anker', () => {
    expect(timeToDanish(3, 5)).toBe('fem minutter over tre');
    expect(timeToDanish(3, 20)).toBe('tyve minutter over tre');
    expect(timeToDanish(3, 40)).toBe('tyve minutter i fire');
    expect(timeToDanish(3, 55)).toBe('fem minutter i fire');
  });
  it('fem-minutters-trin med halv-anker', () => {
    expect(timeToDanish(3, 25)).toBe('fem minutter i halv fire');
    expect(timeToDanish(3, 35)).toBe('fem minutter over halv fire');
  });
  it('kaster ved ikke-understøttede minutter', () => {
    expect(() => timeToDanish(3, 7)).toThrow();
  });
});
