import { describe, it, expect } from 'vitest';
import {
  clue, ALL, genPuzzle, excludedDigits, cycleMark, clueText, FALLBACK,
  emptyEntry, placeDigit, clearSlot, firstEmpty, entryComplete, entryToCode,
  type Clue, type CodeLevelKey,
} from '../src/domain/code';

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function candidatesFor(rows: Clue[]): number[][] {
  return ALL.filter((code) =>
    rows.every((r) => {
      const [b, c] = clue(r.g, code);
      return b === r.b && c === r.c;
    }),
  );
}

const DIFFS: CodeLevelKey[] = ['nem', 'mellem', 'svaer', 'ekspert'];

describe('clue', () => {
  it('tæller rette pladser (bulls)', () => {
    expect(clue([1, 2, 3, 4], [1, 2, 3, 4])).toEqual([4, 0]);
    expect(clue([1, 2, 3, 4], [1, 2, 5, 6])).toEqual([2, 0]);
    expect(clue([1, 2, 3, 4], [1, 5, 6, 7])).toEqual([1, 0]);
  });
  it('tæller rigtige men forkert placerede (cows)', () => {
    expect(clue([1, 2, 3, 4], [4, 3, 2, 1])).toEqual([0, 4]);
    expect(clue([1, 2, 3, 4], [2, 1, 5, 6])).toEqual([0, 2]);
  });
  it('ingen overlap', () => {
    expect(clue([5, 6, 7, 8], [1, 2, 3, 4])).toEqual([0, 0]);
  });
});

describe('genPuzzle', () => {
  it('giver en entydigt løselig kode for alle sværhedsgrader og seeds', () => {
    for (const diff of DIFFS) {
      for (let seed = 1; seed <= 30; seed++) {
        const p = genPuzzle(diff, mulberry32(seed));
        const cands = candidatesFor(p.rows);
        expect(cands.length, `${diff} seed ${seed}`).toBe(1);
        expect(cands[0].join('')).toBe(p.secret);
      }
    }
  });
  it('hver ledetråd er konsistent med koden', () => {
    for (const diff of DIFFS) {
      const p = genPuzzle(diff, mulberry32(7));
      const code = p.secret.split('').map(Number);
      for (const r of p.rows) expect(clue(r.g, code)).toEqual([r.b, r.c]);
    }
  });
  it('koden har 4 forskellige cifre, ≤7 rækker og ≥3 ledetråds-typer', () => {
    for (const diff of DIFFS) {
      const p = genPuzzle(diff, mulberry32(3));
      expect(new Set(p.secret.split('')).size).toBe(4);
      expect(p.rows.length).toBeLessThanOrEqual(7);
      expect(new Set(p.rows.map((r) => `${r.b},${r.c}`)).size).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('FALLBACK', () => {
  it('hver fast kode er selv gyldig + entydig', () => {
    for (const diff of DIFFS) {
      const p = FALLBACK[diff];
      const cands = candidatesFor(p.rows);
      expect(cands.length, diff).toBe(1);
      expect(cands[0].join('')).toBe(p.secret);
    }
  });
});

describe('excludedDigits', () => {
  it('returnerer cifrene fra en „intet rigtigt"-række', () => {
    const p = { secret: '1234', rows: [{ g: [5, 6, 7, 8], b: 0, c: 0 }] };
    expect(excludedDigits(p)).toEqual(new Set([5, 6, 7, 8]));
  });
  it('tom mængde uden en sådan række', () => {
    const p = { secret: '1234', rows: [{ g: [1, 5, 6, 7], b: 1, c: 0 }] };
    expect(excludedDigits(p)).toEqual(new Set());
  });
});

describe('cycleMark', () => {
  it('går none → ude → med → none', () => {
    expect(cycleMark('none')).toBe('ude');
    expect(cycleMark('ude')).toBe('med');
    expect(cycleMark('med')).toBe('none');
  });
});

describe('clueText', () => {
  it('rammer de eksakte danske strenge', () => {
    expect(clueText(0, 0)).toBe('Intet tal er rigtigt');
    expect(clueText(1, 0)).toBe('Ét tal er rigtigt og på rette plads');
    expect(clueText(2, 0)).toBe('To tal er rigtige og på rette pladser');
    expect(clueText(0, 1)).toBe('Ét tal er rigtigt, men på forkert plads');
    expect(clueText(0, 2)).toBe('To tal er rigtige, men på forkerte pladser');
    expect(clueText(0, 3)).toBe('Tre tal er rigtige, men på forkerte pladser');
  });
});

describe('entry slots', () => {
  it('emptyEntry er fire tomme felter', () => {
    expect(emptyEntry()).toEqual([null, null, null, null]);
  });
  it('placeDigit sætter et felt immutabelt', () => {
    const a = emptyEntry();
    const b = placeDigit(a, 2, 7);
    expect(b).toEqual([null, null, 7, null]);
    expect(a).toEqual([null, null, null, null]);
  });
  it('placeDigit erstatter et eksisterende tal', () => {
    expect(placeDigit([1, 2, 3, 4], 1, 9)).toEqual([1, 9, 3, 4]);
  });
  it('clearSlot rydder ét felt', () => {
    expect(clearSlot([1, 2, 3, 4], 0)).toEqual([null, 2, 3, 4]);
  });
  it('firstEmpty finder første tomme felt eller -1', () => {
    expect(firstEmpty([null, null, null, null])).toBe(0);
    expect(firstEmpty([1, null, 3, null])).toBe(1);
    expect(firstEmpty([1, 2, 3, 4])).toBe(-1);
  });
  it('entryComplete kun når alle fire er fyldt', () => {
    expect(entryComplete([1, 2, 3, 4])).toBe(true);
    expect(entryComplete([1, null, 3, 4])).toBe(false);
  });
  it('entryToCode samler i felt-rækkefølge uanset udfyldnings-rækkefølge', () => {
    let s = emptyEntry();
    s = placeDigit(s, 2, 4);
    s = placeDigit(s, 0, 7);
    s = placeDigit(s, 3, 6);
    s = placeDigit(s, 1, 2);
    expect(entryToCode(s)).toBe('7246');
  });
});
