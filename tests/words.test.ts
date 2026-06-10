import { describe, it, expect } from 'vitest';
import { WORD_BANK, WORD_LEVELS, wordsForLevel, pickWord, makePuzzle, gapForLetter, type WordLevel } from '../src/domain/words';

function seqRng(seq: number[]) {
  let i = 0;
  return () => seq[i++ % seq.length];
}

describe('WORD_BANK', () => {
  it('har 8 ord pr. niveau, små bogstaver og emoji', () => {
    for (const lvl of [1, 2, 3] as WordLevel[]) {
      const words = wordsForLevel(lvl);
      expect(words).toHaveLength(8);
      for (const w of words) {
        expect(w.word).toBe(w.word.toLowerCase());
        expect(w.emoji.length).toBeGreaterThan(0);
      }
    }
    expect(WORD_BANK).toHaveLength(24);
  });
  it('niveau 1 er korte ord, niveau 3 er lange', () => {
    expect(wordsForLevel(1).every((w) => w.word.length <= 4)).toBe(true);
    expect(wordsForLevel(3).every((w) => w.word.length >= 5)).toBe(true);
  });
});

describe('pickWord', () => {
  it('vælger inden for niveauet og undgår forrige ord', () => {
    for (const r of [0, 0.3, 0.6, 0.99]) {
      const w = pickWord(2, () => r, 'dino');
      expect(w.level).toBe(2);
      expect(w.word).not.toBe('dino');
    }
  });
});

describe('makePuzzle', () => {
  const kat = { word: 'kat', emoji: '🐱', level: 1 as WordLevel };
  it('niveau 1: ét gemt bogstav, aldrig det første', () => {
    for (const r of [0, 0.2, 0.5, 0.8, 0.99]) {
      const p = makePuzzle(kat, 1, () => r);
      expect(p.hiddenIdx).toHaveLength(1);
      expect(p.hiddenIdx[0]).toBeGreaterThan(0);
    }
  });
  it('bakken indeholder de gemte bogstaver + distraktorer (ingen overlap)', () => {
    const p = makePuzzle(kat, 1, seqRng([0.5, 0.1, 0.4, 0.7, 0.2, 0.9, 0.3]));
    expect(p.tray).toHaveLength(1 + WORD_LEVELS[1].distractors);
    const hiddenLetter = kat.word[p.hiddenIdx[0]];
    expect(p.tray).toContain(hiddenLetter);
    const distractors = p.tray.filter((l) => l !== hiddenLetter);
    expect(distractors).not.toContain(hiddenLetter);
  });
  it('dubletter: banan med to gemte a-er giver to a-brikker', () => {
    const banan = { word: 'banan', emoji: '🍌', level: 2 as WordLevel };
    // tving hiddenIdx til at ramme to a-positioner via rng-sekvens: kandidater [0..4]
    let p = null;
    for (let seed = 0; seed < 50 && !p; seed++) {
      const cand = makePuzzle(banan, 2, seqRng([seed / 50, (seed * 7 % 50) / 50, 0.3, 0.6, 0.9, 0.2, 0.5]));
      const letters = cand.hiddenIdx.map((i) => banan.word[i]);
      if (letters.filter((l) => l === 'a').length === 2) p = cand;
    }
    expect(p).not.toBeNull();
    expect(p!.tray.filter((l) => l === 'a')).toHaveLength(2);
  });
});

describe('gapForLetter', () => {
  it('fylder venstreste passende hul først og afviser forkerte bogstaver', () => {
    const banan = { word: 'banan', emoji: '🍌', level: 2 as WordLevel };
    const puzzle = { entry: banan, hiddenIdx: [1, 3], tray: ['a', 'a', 'x'] }; // b_n_n
    expect(gapForLetter(puzzle, [], 'a')).toBe(1);
    expect(gapForLetter(puzzle, [1], 'a')).toBe(3);
    expect(gapForLetter(puzzle, [1, 3], 'a')).toBe(-1);
    expect(gapForLetter(puzzle, [], 'x')).toBe(-1);
  });
});
