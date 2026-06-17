export type CodeLevelKey = 'nem' | 'mellem' | 'svaer' | 'ekspert';
export interface Clue { g: number[]; b: number; c: number; }
export interface Puzzle { secret: string; rows: Clue[]; }
export type Mark = 'none' | 'ude' | 'med';

export type Slots = (number | null)[];

export function emptyEntry(): Slots {
  return [null, null, null, null];
}
export function placeDigit(slots: Slots, index: number, digit: number): Slots {
  const next = slots.slice();
  next[index] = digit;
  return next;
}
export function clearSlot(slots: Slots, index: number): Slots {
  const next = slots.slice();
  next[index] = null;
  return next;
}
export function firstEmpty(slots: Slots): number {
  return slots.findIndex((s) => s == null);
}
export function entryComplete(slots: Slots): boolean {
  return slots.length === 4 && slots.every((s) => s != null);
}
export function entryToCode(slots: Slots): string {
  return slots.map((s) => (s == null ? '' : String(s))).join('');
}

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

export function clue(g: number[], code: number[]): [number, number] {
  let bulls = 0;
  for (let i = 0; i < 4; i++) if (g[i] === code[i]) bulls++;
  const s = new Set(code);
  let total = 0;
  for (const x of g) if (s.has(x)) total++;
  return [bulls, total - bulls];
}

const CLEAN = new Set(['0,0', '1,0', '2,0', '3,0', '0,1', '0,2', '0,3']);
const isClean = (b: number, c: number): boolean => CLEAN.has(b + ',' + c);

const NUM: Record<number, string> = { 1: 'ét', 2: 'to', 3: 'tre' };
export function clueText(b: number, c: number): string {
  if (b === 0 && c === 0) return 'Intet tal er rigtigt';
  if (b > 0) return `${cap(NUM[b])} tal er rigtig${b > 1 ? 'e' : 't'} og på ${b > 1 ? 'rette pladser' : 'rette plads'}`;
  return `${cap(NUM[c])} tal er rigtig${c > 1 ? 'e' : 't'}, men på ${c > 1 ? 'forkerte pladser' : 'forkert plads'}`;
}

function buildAll(): number[][] {
  const out: number[][] = [];
  for (let a = 0; a < 10; a++)
    for (let b = 0; b < 10; b++) {
      if (b === a) continue;
      for (let c = 0; c < 10; c++) {
        if (c === a || c === b) continue;
        for (let d = 0; d < 10; d++) {
          if (d === a || d === b || d === c) continue;
          out.push([a, b, c, d]);
        }
      }
    }
  return out;
}
export const ALL: number[][] = buildAll();

function sample4(rng: () => number): number[] {
  const p = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = p.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  return p.slice(0, 4);
}
const same = (a: number[], b: number[]): boolean =>
  a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];

function fb(secret: string, guesses: string[]): Puzzle {
  const code = secret.split('').map(Number);
  return {
    secret,
    rows: guesses.map((s) => {
      const g = s.split('').map(Number);
      const [b, c] = clue(g, code);
      return { g, b, c };
    }),
  };
}
export const FALLBACK: Record<CodeLevelKey, Puzzle> = {
  nem: fb('5283', ['9714', '5643', '5217', '7984', '9432']),
  mellem: fb('7402', ['3815', '9308', '1624', '7805', '3182']),
  svaer: fb('3916', ['2578', '0518', '1873', '8301', '1692']),
  ekspert: fb('5183', ['6709', '2197', '3591', '7852', '4937']),
};

const TARGETS: Record<CodeLevelKey, [number, number][]> = {
  nem: [[0, 0], [2, 0], [1, 0], [0, 1], [0, 2]],
  mellem: [[0, 0], [2, 0], [0, 1], [0, 2], [0, 3]],
  svaer: [[0, 0], [1, 0], [0, 1], [0, 2], [0, 3]],
  ekspert: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 2]],
};
const DIFF_FILL: Record<CodeLevelKey, { bullCap: number; prefer: 'place' | 'none' | 'wrong' }> = {
  nem: { bullCap: 99, prefer: 'place' },
  mellem: { bullCap: 1, prefer: 'none' },
  svaer: { bullCap: 1, prefer: 'wrong' },
  ekspert: { bullCap: 1, prefer: 'wrong' },
};

export function genPuzzle(diff: CodeLevelKey, rng: () => number = Math.random): Puzzle {
  const target = TARGETS[diff] || TARGETS.nem;
  const cfg = DIFF_FILL[diff] || DIFF_FILL.nem;
  const isBull = (k: string): boolean => k.charCodeAt(0) !== 48;
  for (let attempt = 0; attempt < 200; attempt++) {
    const secret = sample4(rng);

    const buckets = new Map<string, number[][]>();
    for (const g of ALL) {
      if (same(g, secret)) continue;
      const [b, c] = clue(g, secret);
      if (!isClean(b, c)) continue;
      const k = b + ',' + c;
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k)!.push(g);
    }

    const rows: Clue[] = [];
    let cands: number[][] = ALL;
    let bulls = 0;
    const used = new Set<string>();
    const count: Record<string, number> = {};
    const addType = (k: string): boolean => {
      const arr = buckets.get(k);
      if (!arr || !arr.length) return false;
      for (let t = 0; t < 10; t++) {
        const g = arr[Math.floor(rng() * arr.length)];
        const key = g.join('');
        if (used.has(key)) continue;
        used.add(key);
        const [b, c] = k.split(',').map(Number);
        rows.push({ g, b, c });
        count[k] = (count[k] || 0) + 1;
        if (b > 0) bulls++;
        cands = cands.filter((code) => {
          const [bb, cc] = clue(g, code);
          return bb === b && cc === c;
        });
        return true;
      }
      return false;
    };

    for (const [b, c] of target) addType(b + ',' + c);

    const types = [...buckets.keys()].filter((k) => k !== '0,0');
    let guard = 0;
    while (cands.length > 1 && guard++ < 40) {
      const pool = types.filter((k) => (count[k] || 0) < 2 && !(isBull(k) && bulls >= cfg.bullCap) && !(k === '0,3' && (count['0,3'] || 0) >= 1));
      pool.sort((a, b) => {
        const dc = (count[a] || 0) - (count[b] || 0);
        if (dc) return dc;
        if (cfg.prefer === 'place') { const d = (isBull(a) ? 0 : 1) - (isBull(b) ? 0 : 1); if (d) return d; }
        if (cfg.prefer === 'wrong') { const d = (isBull(a) ? 1 : 0) - (isBull(b) ? 1 : 0); if (d) return d; }
        return 0;
      });
      let added = false;
      for (const k of pool) if (addType(k)) { added = true; break; }
      if (!added) for (const k of types.filter((k) => (count[k] || 0) < 2)) if (addType(k)) { added = true; break; }
      if (!added) for (const k of types) if (addType(k)) { added = true; break; }
      if (!added) break;
    }

    const distinct = Object.keys(count).length;
    if (cands.length === 1 && rows.length <= 7 && distinct >= 4) {
      for (let i = rows.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [rows[i], rows[j]] = [rows[j], rows[i]];
      }
      return { secret: secret.join(''), rows };
    }
  }
  return FALLBACK[diff];
}

export function excludedDigits(puzzle: Puzzle): Set<number> {
  const ex = new Set<number>();
  puzzle.rows.forEach((r) => {
    if (r.b === 0 && r.c === 0) r.g.forEach((d) => ex.add(d));
  });
  return ex;
}

export function cycleMark(m: Mark): Mark {
  return m === 'none' ? 'ude' : m === 'ude' ? 'med' : 'none';
}

export interface CodeLevelDef { label: string; stars: number; desc: string; }
export const CODE_LEVELS: Record<CodeLevelKey, CodeLevelDef> = {
  nem: { label: 'Nem', stars: 1, desc: 'Mange tal sidder på rette plads' },
  mellem: { label: 'Mellem', stars: 2, desc: 'Lidt mere at regne ud' },
  svaer: { label: 'Svær', stars: 3, desc: 'Tallene er ofte flyttet' },
  ekspert: { label: 'Ekspert', stars: 4, desc: 'Kun for kode-mestre' },
};
export const CODE_LEVEL_COLOR: Record<CodeLevelKey, string> = {
  nem: '#5DBB63', mellem: '#3FA0DE', svaer: '#F2A03D', ekspert: '#F2715B',
};
