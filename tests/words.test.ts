// tests/words.test.ts
import { describe, it, expect } from 'vitest';
import {
  WORDS, WORD_LEVELS, wordsForLevel, pickWord, shuffledLetters,
  isCorrectNext, isComplete,
} from '../src/domain/words';

describe('wordsForLevel', () => {
  it('niveau 1 er 3-bogstavsord', () => {
    const w = wordsForLevel(1);
    expect(w.length).toBeGreaterThan(0);
    expect(w.every((e) => e.word.length === 3)).toBe(true);
  });
  it('niveau 2 er 4-bogstavsord', () => {
    expect(wordsForLevel(2).every((e) => e.word.length === 4)).toBe(true);
  });
  it('niveau 3 er 5+ bogstavsord', () => {
    expect(wordsForLevel(3).every((e) => e.word.length >= 5)).toBe(true);
  });
});

describe('WORD_LEVELS', () => {
  it('viser ordet på niveau 1, skjuler det fra niveau 2', () => {
    expect(WORD_LEVELS[1].showWord).toBe(true);
    expect(WORD_LEVELS[2].showWord).toBe(false);
    expect(WORD_LEVELS[3].showWord).toBe(false);
  });
});

describe('pickWord', () => {
  it('vælger deterministisk med fast rng', () => {
    expect(pickWord(1, () => 0)).toEqual(wordsForLevel(1)[0]);
  });
});

describe('shuffledLetters', () => {
  it('beholder de samme bogstaver', () => {
    const letters = shuffledLetters('sol', () => 0);
    expect(letters.length).toBe(3);
    expect([...letters].sort()).toEqual(['l', 'o', 's']);
  });
});

describe('isCorrectNext / isComplete', () => {
  it('accepterer kun næste rigtige bogstav', () => {
    expect(isCorrectNext('sol', '', 's')).toBe(true);
    expect(isCorrectNext('sol', '', 'o')).toBe(false);
    expect(isCorrectNext('sol', 's', 'o')).toBe(true);
  });
  it('er færdig når hele ordet er stavet', () => {
    expect(isComplete('sol', 'sol')).toBe(true);
    expect(isComplete('sol', 'so')).toBe(false);
  });
});

it('alle ord har en picture-id', () => {
  expect(WORDS.every((w) => typeof w.picture === 'string' && w.picture.length > 0)).toBe(true);
});
