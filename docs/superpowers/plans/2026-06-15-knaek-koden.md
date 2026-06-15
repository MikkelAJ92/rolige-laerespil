# Alfred knækker koden — Implementeringsplan (v0.11.0)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tilføj et fjerde spil — „Alfred knækker koden" (Mastermind med hængelås, scener og krydse-af-noter) — til Alfred-appen, med delt stjerne-/pokal-konto.

**Architecture:** Brugerens medbragte React-kode (gemt verbatim i `docs/reference/alfred-kode-original.jsx`) adopteres: spil-logikken bliver ren+testet TS (`domain/code.ts`), et nyt scene-modul (`domain/scenes.ts`) rammer hver kode ind, og `components/CodeGame.tsx` tegner brættet. `App.tsx` ejer den fælles ramme (header, stjernerække, Ugo-stribe, næste-knap) + scene-state + sidebaggrund, og kobler `onSolved`/`onWrong` til den eksisterende delte økonomi — præcis som `WordGame` er koblet i dag.

**Tech Stack:** Vite + React 18 + TypeScript (strict) + Tailwind v4 + Vitest/jsdom. Ren logik testes med TDD og en seeded `rng`; UI verificeres live i Claude Preview.

**Spil-kontrakt (kortform):**
- `CodeGame` får props `{ scene, level, round, audio, onSolved, onWrong }` og ejer kun sin egen spil-tilstand. Den tegner scene + hængelås + tal-felter + ledetråde + taltastatur + „Hjælp mig". Den har **ingen** header/stjernerække/Ugo-stribe/næste-knap (dem leverer `App`).
- En løst kode → `onSolved()` (App kører `handleCorrect` = stjerne/pokal/konfetti/lyd). Forkert gæt → `onWrong()` (App nulstiller streak + viser opmuntring). Ingen straf.
- Krydse-af-mærker sættes ved at trykke på et **tal i en ledetråd** (cyklus rent → ✕ → ◯ → rent); mærket vises på alle forekomster af det tal (alle ledetråde + tastatur). Tastaturet er til **input** (afspejler mærker, men markeres ikke der). Tryk på ledetråds-**teksten** = Ugo læser højt.
- „Vis facit" droppes (erstattes af den altid-tilgængelige „Ny kode ➜"-knap i App-rammen — blidere end at afsløre svaret). „Hjælp mig" beholdes.

---

## Filstruktur

| Fil | Ansvar |
|-----|--------|
| `docs/reference/alfred-kode-original.jsx` | Verbatim kilde (allerede oprettet under planlægning). |
| `src/domain/code.ts` | NY — ren kode-motor: `clue`, `genPuzzle(diff, rng)`, `ALL`, `FALLBACK`, `clueText`, `excludedDigits`, `cycleMark`, level-meta, beskeder. |
| `src/domain/scenes.ts` | NY — `Scene`-type, `SCENES`, `pickScene(rng, avoid)`. |
| `src/components/Padlock.tsx` | NY — hængelåsen (verbatim, delt `shade`). |
| `src/components/CodeGame.tsx` | NY — spillebrættet (scene + mærker + taltastatur). |
| `src/lib/persistence.ts` | ÆNDRES — `mode` får `'kode'`, nyt `codeLevel`. |
| `src/App.tsx` | ÆNDRES — 4. menukort, kode-chips, render i `kode`-mode, scene-baggrund, delt økonomi. |
| `tests/code.test.ts`, `tests/scenes.test.ts` | NY. |
| `tests/persistence.test.ts` | UDVIDES. |
| `package.json`, `CHANGELOG.md`, `README.md` | ÆNDRES — v0.11.0. |

---

### Task 1: Verificér reference-filen

**Files:**
- Verify: `docs/reference/alfred-kode-original.jsx`

- [ ] **Step 1: Bekræft at filen findes og er den medbragte kode**

Read `docs/reference/alfred-kode-original.jsx`. Den indeholder hele `App`-komponenten „Alfred knækker koden" med funktionerne `clue`, `buildAll`, `sample4`, `genPuzzle`, `clueText`, `FALLBACK`, `TARGETS`, `DIFF_FILL`, `LEVELS`, `LEVEL_COLOR`, `CORRECT`, `WRONG` samt komponenterne `Padlock`, `ClueRow`, `Keypad`, `Dot`. Denne fil er **kilden** for verbatim-port i de følgende tasks. Ingen ændring.

---

### Task 2: `src/domain/code.ts` + tests (TDD)

**Files:**
- Create: `src/domain/code.ts`
- Test: `tests/code.test.ts`

- [ ] **Step 1: Skriv de fejlende tests**

Create `tests/code.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  clue, ALL, genPuzzle, excludedDigits, cycleMark, clueText, FALLBACK,
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
```

- [ ] **Step 2: Kør testen — den skal fejle**

Run: `npm test -- code`
Expected: FAIL (modulet `../src/domain/code` findes ikke endnu).

- [ ] **Step 3: Skriv `src/domain/code.ts`**

Port fra `docs/reference/alfred-kode-original.jsx`. Logikken er **uændret**; den eneste ændring er en injiceret `rng: () => number = Math.random` i `sample4` og `genPuzzle` (alle `Math.random()` → `rng()`). `shade`, `Owl`, UI mv. hører IKKE til her.

```ts
export type CodeLevelKey = 'nem' | 'mellem' | 'svaer' | 'ekspert';
export interface Clue { g: number[]; b: number; c: number; }
export interface Puzzle { secret: string; rows: Clue[]; }
export type Mark = 'none' | 'ude' | 'med';

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
      const pool = types.filter((k) => (count[k] || 0) < 2 && !(isBull(k) && bulls >= cfg.bullCap));
      pool.sort((a, b) => {
        if (cfg.prefer === 'place') { const d = (isBull(a) ? 0 : 1) - (isBull(b) ? 0 : 1); if (d) return d; }
        if (cfg.prefer === 'wrong') { const d = (isBull(a) ? 1 : 0) - (isBull(b) ? 1 : 0); if (d) return d; }
        return (count[a] || 0) - (count[b] || 0);
      });
      let added = false;
      for (const k of pool) if (addType(k)) { added = true; break; }
      if (!added) for (const k of types.filter((k) => (count[k] || 0) < 2)) if (addType(k)) { added = true; break; }
      if (!added) for (const k of types) if (addType(k)) { added = true; break; }
      if (!added) break;
    }

    const distinct = Object.keys(count).length;
    if (cands.length === 1 && rows.length <= 7 && distinct >= 3) {
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
```

- [ ] **Step 4: Kør testen — den skal bestå**

Run: `npm test -- code`
Expected: PASS (alle code-tests). Kør også `npm run typecheck` → ingen fejl.

- [ ] **Step 5: Commit**

```bash
git add src/domain/code.ts tests/code.test.ts
git commit -m "feat(kode): add tested code-breaking engine with injectable rng"
```

---

### Task 3: `src/domain/scenes.ts` + tests (TDD)

**Files:**
- Create: `src/domain/scenes.ts`
- Test: `tests/scenes.test.ts`

- [ ] **Step 1: Skriv de fejlende tests**

Create `tests/scenes.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { SCENES, pickScene } from '../src/domain/scenes';

describe('SCENES', () => {
  it('har mindst én scene, alle felter udfyldt', () => {
    expect(SCENES.length).toBeGreaterThan(0);
    for (const s of SCENES) {
      expect(s.id).toBeTruthy();
      expect(s.locked).toBeTruthy();
      expect(s.opened).toBeTruthy();
      expect(s.title).toBeTruthy();
      expect(s.bg).toHaveLength(2);
      expect(s.accent).toBeTruthy();
    }
  });
  it('har unikke id-er', () => {
    expect(new Set(SCENES.map((s) => s.id)).size).toBe(SCENES.length);
  });
});

describe('pickScene', () => {
  it('er deterministisk for en given rng', () => {
    expect(pickScene(() => 0)).toBe(SCENES[0]);
  });
  it('returnerer aldrig den undgåede scene', () => {
    for (const s of SCENES) {
      for (const r of [0, 0.25, 0.5, 0.75, 0.99]) {
        expect(pickScene(() => r, s.id).id).not.toBe(s.id);
      }
    }
  });
});
```

- [ ] **Step 2: Kør testen — den skal fejle**

Run: `npm test -- scenes`
Expected: FAIL (modulet findes ikke endnu).

- [ ] **Step 3: Skriv `src/domain/scenes.ts`**

```ts
export interface Scene {
  id: string;
  locked: string;
  opened: string;
  title: string;
  bg: readonly [string, string];
  accent: string;
}

export const SCENES: readonly Scene[] = [
  { id: 'dino', locked: '🥚', opened: '🦕', title: 'Knæk koden, så klækker ægget!', bg: ['#E6F3DA', '#C7E6AE'], accent: '#6E9E4F' },
  { id: 'kiste', locked: '🧰', opened: '💎', title: 'Hjælp Ugo med at åbne kisten!', bg: ['#F4E8CE', '#E6CFA1'], accent: '#B98A4B' },
  { id: 'cykel', locked: '🚲', opened: '🚲', title: 'Lås cyklen op — så kan I køre en tur!', bg: ['#DDF0F8', '#BFE3F1'], accent: '#4FA3C4' },
  { id: 'raket', locked: '🚀', opened: '🌙', title: 'Tast startkoden til raketten!', bg: ['#DBDEF2', '#BCC2E7'], accent: '#5B63B0' },
  { id: 'traedoer', locked: '🦉', opened: '🪟', title: 'Den hemmelige dør i Ugos træ.', bg: ['#E2EADB', '#C6D5BA'], accent: '#6E8A5A' },
  { id: 'doer', locked: '🚪', opened: '✨', title: 'En dør med en hemmelig kode…', bg: ['#F0E6EE', '#E0CADC'], accent: '#9B6F92' },
];

export function pickScene(rng: () => number = Math.random, avoid?: string): Scene {
  const pool = avoid ? SCENES.filter((s) => s.id !== avoid) : SCENES;
  const list = pool.length ? pool : SCENES;
  return list[Math.floor(rng() * list.length)];
}
```

- [ ] **Step 4: Kør testen — den skal bestå**

Run: `npm test -- scenes`
Expected: PASS. Kør `npm run typecheck` → ingen fejl.

- [ ] **Step 5: Commit**

```bash
git add src/domain/scenes.ts tests/scenes.test.ts
git commit -m "feat(kode): add calm scene system (scenes.ts)"
```

---

### Task 4: Persistens — `mode: 'kode'` + `codeLevel`

**Files:**
- Modify: `src/lib/persistence.ts`
- Test: `tests/persistence.test.ts`

- [ ] **Step 1: Skriv de fejlende tests (tilføj til `tests/persistence.test.ts`)**

Tilføj disse tests i `tests/persistence.test.ts` (behold de eksisterende):

```ts
import { describe, it, expect } from 'vitest';
import { defaultProgress, loadProgress, saveProgress } from '../src/lib/persistence';

class MemStore implements Storage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.get(k) ?? null; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  removeItem(k: string) { this.m.delete(k); }
  setItem(k: string, v: string) { this.m.set(k, v); }
}

describe('persistence — codeLevel + kode-mode', () => {
  it('default har codeLevel "nem"', () => {
    expect(defaultProgress().codeLevel).toBe('nem');
  });
  it('gemmer og indlæser codeLevel + mode "kode"', () => {
    const s = new MemStore();
    saveProgress({ ...defaultProgress(), mode: 'kode', codeLevel: 'svaer' }, s);
    const p = loadProgress(s);
    expect(p.mode).toBe('kode');
    expect(p.codeLevel).toBe('svaer');
  });
  it('falder tilbage til "nem" ved ugyldig codeLevel', () => {
    const s = new MemStore();
    s.setItem('alfred.progress.v1', JSON.stringify({ codeLevel: 'umulig' }));
    expect(loadProgress(s).codeLevel).toBe('nem');
  });
  it('falder tilbage til "read" ved ugyldig mode', () => {
    const s = new MemStore();
    s.setItem('alfred.progress.v1', JSON.stringify({ mode: 'xyz' }));
    expect(loadProgress(s).mode).toBe('read');
  });
});
```

(Hvis `tests/persistence.test.ts` allerede har en `MemStore`/import-blok, genbrug den i stedet for at duplikere — tilføj kun `describe`-blokken.)

- [ ] **Step 2: Kør testen — den skal fejle**

Run: `npm test -- persistence`
Expected: FAIL (`codeLevel` findes ikke på `Progress`).

- [ ] **Step 3: Ret `src/lib/persistence.ts`**

Tilføj importen øverst (efter `LevelKey`-importen):

```ts
import { type CodeLevelKey } from '../domain/code';
```

Udvid `Progress`-interface og default:

```ts
export interface Progress {
  stars: number;
  trophies: number;
  starRow: number;
  level: LevelKey;
  mode: 'read' | 'set' | 'ord' | 'kode';
  sound: boolean;
  wordLevel: 1 | 2 | 3;
  codeLevel: CodeLevelKey;
}

export function defaultProgress(): Progress {
  return { stars: 0, trophies: 0, starRow: 0, level: 'timer', mode: 'read', sound: true, wordLevel: 1, codeLevel: 'nem' };
}
```

I `loadProgress`, opdatér `mode`-linjen og tilføj `codeLevel`-validering + medtag i retur-objektet:

```ts
    const mode: 'read' | 'set' | 'ord' | 'kode' =
      o.mode === 'set' ? 'set' : o.mode === 'ord' ? 'ord' : o.mode === 'kode' ? 'kode' : 'read';
    const wordLevel: 1 | 2 | 3 = o.wordLevel === 2 ? 2 : o.wordLevel === 3 ? 3 : 1;
    const codeKeys: CodeLevelKey[] = ['nem', 'mellem', 'svaer', 'ekspert'];
    const codeLevel: CodeLevelKey =
      o.codeLevel && codeKeys.includes(o.codeLevel as CodeLevelKey) ? (o.codeLevel as CodeLevelKey) : 'nem';
    return {
      stars: num(o.stars, d.stars),
      trophies: num(o.trophies, d.trophies),
      starRow: num(o.starRow, d.starRow, 0, 4),
      level,
      mode,
      sound: o.sound === false ? false : true,
      wordLevel,
      codeLevel,
    };
```

- [ ] **Step 4: Kør testen — den skal bestå**

Run: `npm test -- persistence`
Expected: PASS.

- [ ] **Step 5: Hold App grøn (midlertidig `codeLevel` i saveProgress)**

`App.tsx` kalder `saveProgress({ ... })` uden `codeLevel` → TS-fejl efter skema-ændringen. Ret midlertidigt linjen (færdiggøres i Task 7):

I `src/App.tsx`, find:

```ts
    saveProgress({ stars, trophies, starRow, level, mode, sound, wordLevel });
```

og ændr til:

```ts
    saveProgress({ stars, trophies, starRow, level, mode, sound, wordLevel, codeLevel: 'nem' });
```

- [ ] **Step 6: Kør typecheck + alle tests**

Run: `npm run typecheck` og `npm test`
Expected: Begge grønne.

- [ ] **Step 7: Commit**

```bash
git add src/lib/persistence.ts tests/persistence.test.ts src/App.tsx
git commit -m "feat(kode): persist mode 'kode' and codeLevel"
```

---

### Task 5: `src/components/Padlock.tsx`

**Files:**
- Create: `src/components/Padlock.tsx`

- [ ] **Step 1: Skriv komponenten (verbatim fra reference, delt `shade`)**

```tsx
import { shade } from '../lib/colors';

interface PadlockProps {
  open: boolean;
  size?: number;
}

export default function Padlock({ open, size = 74 }: PadlockProps) {
  const body = open ? '#5DBB63' : '#FFC23C';
  return (
    <svg viewBox="0 0 80 100" width={size} height={(size * 100) / 80} aria-hidden="true">
      <g style={{ transformOrigin: '40px 34px', transition: 'transform .55s cubic-bezier(.34,1.5,.5,1)', transform: open ? 'translateX(-12px) translateY(-7px) rotate(-26deg)' : 'none' }}>
        <path d="M24 48 V32 a16 16 0 0 1 32 0 V48" fill="none" stroke="#A98552" strokeWidth="9" strokeLinecap="round" />
      </g>
      <rect x="13" y="44" width="54" height="46" rx="11" fill={body} stroke={shade(body, -18)} strokeWidth="4" />
      <circle cx="40" cy="63" r="6.5" fill="#5A4225" />
      <rect x="37" y="65" width="6" height="15" rx="3" fill="#5A4225" />
    </svg>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/Padlock.tsx
git commit -m "feat(kode): add Padlock component"
```

---

### Task 6: `src/components/CodeGame.tsx`

**Files:**
- Create: `src/components/CodeGame.tsx`

Bygger på `ClueRow`/`Keypad`/`Dot` fra reference, med disse tilpasninger: ingen header/stjernerække/Ugo-stribe/næste-knap (App leverer dem); scene-ting + ramme-tekst øverst; **krydse-af-mærker** pr. tal (sættes ved tryk på ledetråds-ruder, vises overalt); tryk på ledetråds-**teksten** = `audio.speak(clueText(...))`; „Hjælp mig" beholdes; „Vis facit" droppes; på løst kode: lokal `solved` + `onSolved()`.

- [ ] **Step 1: Skriv komponenten**

```tsx
import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import { genPuzzle, clueText, excludedDigits, cycleMark, type CodeLevelKey, type Mark } from '../domain/code';
import type { Scene } from '../domain/scenes';
import type { Audio } from '../lib/audio';
import { shade } from '../lib/colors';
import Padlock from './Padlock';

interface CodeGameProps {
  scene: Scene;
  level: CodeLevelKey;
  round: number;
  audio: Audio;
  onSolved: () => void;
  onWrong: () => void;
}

const MARK_RING = '#3FA0DE';

function markStyle(mark: Mark): CSSProperties {
  if (mark === 'ude') return { opacity: 0.4, textDecoration: 'line-through' };
  if (mark === 'med') return { boxShadow: `0 0 0 3px ${MARK_RING}` };
  return {};
}

function Dot({ kind }: { kind: 'place' | 'wrong' }) {
  const c = kind === 'place' ? '#5DBB63' : '#F2A03D';
  return <span style={{ display: 'inline-block', width: 13, height: 13, borderRadius: 999, background: c, border: `2px solid ${shade(c, -20)}` }} />;
}

export default function CodeGame({ scene, level, round, audio, onSolved, onWrong }: CodeGameProps) {
  const puzzle = useMemo(() => genPuzzle(level, Math.random), [level, round]);
  const [entry, setEntry] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const [shake, setShake] = useState(false);
  const [hintOn, setHintOn] = useState(false);
  const [marks, setMarks] = useState<Record<number, Mark>>({});

  useEffect(() => {
    setEntry([]);
    setSolved(false);
    setShake(false);
    setHintOn(false);
    setMarks({});
    audio.speak(scene.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle]);

  const excluded = excludedDigits(puzzle);
  const canSubmit = entry.length === 4;

  function toggleMark(d: number) {
    setMarks((m) => ({ ...m, [d]: cycleMark(m[d] ?? 'none') }));
  }
  function pushDigit(d: number) {
    if (solved || entry.length >= 4) return;
    setEntry((e) => [...e, d]);
  }
  function backspace() {
    if (solved) return;
    setEntry((e) => e.slice(0, -1));
  }
  function submit() {
    if (solved || !canSubmit) return;
    if (entry.join('') === puzzle.secret) {
      setSolved(true);
      onSolved();
    } else {
      setShake(true);
      window.setTimeout(() => setShake(false), 450);
      onWrong();
    }
  }

  const digitKeyStyle: CSSProperties = { height: 54, fontSize: 26, fontWeight: 700, background: '#FFF3D6', color: '#8A551F', border: '3px solid #E9C77E', boxShadow: '0 4px 0 #E9C77E' };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-1">
        <span style={{ fontSize: 56, animation: solved ? 'pop .4s ease' : 'floaty 3.2s ease-in-out infinite' }}>{solved ? scene.opened : scene.locked}</span>
        <p className="fredoka text-base font-semibold text-center" style={{ color: '#5A4225' }}>{scene.title}</p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <Padlock open={solved} />
        <div className="flex gap-2" style={{ animation: shake ? 'shakey .4s ease' : 'none' }}>
          {[0, 1, 2, 3].map((i) => {
            const d = entry[i];
            const filled = d != null;
            return (
              <div key={i} className="fredoka" style={{ width: 46, height: 58, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 700, color: solved ? '#fff' : '#4A3826', background: solved ? '#5DBB63' : filled ? '#FFF3D6' : '#FBF6EA', border: `3px solid ${solved ? shade('#5DBB63', -16) : filled ? '#F0CE7E' : '#E9DCBF'}`, borderRadius: 12, transition: 'all .2s', animation: solved ? 'pop .4s ease' : 'none' }}>{filled ? d : ''}</div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl p-3 flex flex-col gap-2.5" style={{ background: '#FFFFFF', border: '2.5px solid #F0E2C8' }}>
        {puzzle.rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="flex gap-1.5" style={{ flexShrink: 0 }}>
              {r.g.map((d, j) => (
                <button key={j} onClick={() => toggleMark(d)} aria-label={`Markér tallet ${d}`} className="fredoka" style={{ width: 34, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#5A4225', background: '#FFF7E6', border: '2.5px solid #E9D3A4', borderRadius: 9, cursor: 'pointer', ...markStyle(marks[d] ?? 'none') }}>{d}</button>
              ))}
            </div>
            <button onClick={() => audio.speak(clueText(r.b, r.c))} aria-label="Hør ledetråden" className="nunito text-left" style={{ fontSize: 13.5, fontWeight: 700, color: '#6E5A43', lineHeight: 1.25, flex: 1, background: 'none', border: 'none', cursor: 'pointer' }}>{clueText(r.b, r.c)}</button>
            <div className="flex gap-1" style={{ flexShrink: 0 }}>
              {r.b === 0 && r.c === 0 ? (
                <span style={{ fontSize: 16, color: '#C2B49A' }}>✕</span>
              ) : (
                <>
                  {Array.from({ length: r.b }).map((_, k) => <Dot key={`p${k}`} kind="place" />)}
                  {Array.from({ length: r.c }).map((_, k) => <Dot key={`w${k}`} kind="wrong" />)}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {!solved && (
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
            <button key={d} onClick={() => pushDigit(d)} disabled={hintOn && excluded.has(d)} className="fredoka select-none rounded-2xl transition active:translate-y-0.5 disabled:opacity-35" style={{ ...digitKeyStyle, ...markStyle(marks[d] ?? 'none') }}>{d}</button>
          ))}
          <button onClick={backspace} className="fredoka select-none rounded-2xl transition active:translate-y-0.5" style={{ height: 54, fontSize: 24, fontWeight: 700, background: '#FBE6DF', color: '#B5562F', border: '3px solid #EBC3B1', boxShadow: '0 4px 0 #EBC3B1' }}>⌫</button>
          <button onClick={() => pushDigit(0)} disabled={hintOn && excluded.has(0)} className="fredoka select-none rounded-2xl transition active:translate-y-0.5 disabled:opacity-35" style={{ ...digitKeyStyle, ...markStyle(marks[0] ?? 'none') }}>0</button>
          <button onClick={submit} disabled={!canSubmit} className="fredoka select-none rounded-2xl transition active:translate-y-0.5 disabled:opacity-50" style={{ height: 54, fontSize: 24, fontWeight: 700, background: canSubmit ? '#5DBB63' : '#E7E2D6', color: canSubmit ? '#fff' : '#A89E8A', border: `3px solid ${canSubmit ? shade('#5DBB63', -16) : '#D8D1C0'}`, boxShadow: `0 4px 0 ${canSubmit ? shade('#5DBB63', -16) : '#D8D1C0'}` }}>🔓</button>
        </div>
      )}

      {!solved && (
        <div className="flex items-center justify-center">
          <button onClick={() => setHintOn((h) => !h)} className="fredoka rounded-full px-4 py-2 text-sm font-semibold transition active:translate-y-0.5" style={{ background: hintOn ? '#FFE39B' : '#FFFDF7', color: '#8A551F', border: `3px solid ${hintOn ? '#E9B23A' : '#EBDCBF'}`, boxShadow: `0 3px 0 ${hintOn ? '#E9B23A' : '#EBDCBF'}` }}>💡 {hintOn ? 'Skjuler tal der ikke er med' : 'Hjælp mig'}</button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/CodeGame.tsx
git commit -m "feat(kode): add CodeGame board with scenes and cross-off marks"
```

---

### Task 7: App-wiring (`src/App.tsx`)

**Files:**
- Modify: `src/App.tsx`

> ⚠️ **Curly-quote-vagt:** App.tsx indeholder `„Sæt viserne“` (codepoints `201E … 201C`). Brug **kun** målrettede Edits — aldrig hel-fil-erstatninger af citationstegn. Efter alle edits: bekræft at `„Sæt viserne“` og det nye „Knæk koden"-kort står med korrekte tegn.

- [ ] **Step 1: Tilføj imports**

Efter linjen `import WordGame from "./components/WordGame";` tilføj:

```ts
import CodeGame from "./components/CodeGame";
import { CODE_LEVELS, CODE_LEVEL_COLOR, type CodeLevelKey } from "./domain/code";
import { pickScene, type Scene } from "./domain/scenes";
```

- [ ] **Step 2: Udvid `mode`-state-typen**

Find:
```ts
  const [mode, setMode] = useState<'read' | 'set' | 'ord'>(initial.mode);
```
Erstat med:
```ts
  const [mode, setMode] = useState<'read' | 'set' | 'ord' | 'kode'>(initial.mode);
```

- [ ] **Step 3: Tilføj kode-state**

Efter linjen `const [wordRound, setWordRound] = useState(0);` tilføj:

```ts
  const [codeLevel, setCodeLevel] = useState<CodeLevelKey>(initial.codeLevel);
  const [codeRound, setCodeRound] = useState(0);
  const [scene, setScene] = useState<Scene>(() => pickScene(Math.random));
```

- [ ] **Step 4: Færdiggør saveProgress + deps**

Find:
```ts
    saveProgress({ stars, trophies, starRow, level, mode, sound, wordLevel, codeLevel: 'nem' });
  }, [stars, trophies, starRow, level, mode, sound, wordLevel]);
```
Erstat med:
```ts
    saveProgress({ stars, trophies, starRow, level, mode, sound, wordLevel, codeLevel });
  }, [stars, trophies, starRow, level, mode, sound, wordLevel, codeLevel]);
```

- [ ] **Step 5: Tilføj kode-gren i play-effekten**

Find:
```ts
      if (mode === "ord") startWordRound();
      else newQuestion();
```
Erstat med:
```ts
      if (mode === "ord") startWordRound();
      else if (mode === "kode") startCodeRound();
      else newQuestion();
```
Og find effektens deps-array:
```ts
  }, [screen, mode, level, wordLevel]);
```
Erstat med:
```ts
  }, [screen, mode, level, wordLevel, codeLevel]);
```

- [ ] **Step 6: Tilføj `startCodeRound` + kode-handlers**

Efter funktionen `handleWordWrong` (lige efter dens afsluttende `}`) tilføj:

```ts
  function startCodeRound() {
    setScene((s) => pickScene(Math.random, s.id));
    setCodeRound((r) => r + 1);
    setFeedback("idle");
    setRevealed(false);
    setMsg("");
    setMood("idle");
    setSuggestion(null);
    setHintStep(0);
  }

  function handleCodeSolved() {
    handleCorrect("Du knækkede koden");
  }

  function handleCodeWrong() {
    setStreak(0);
    setMood("think");
    setMsg(rand(WRONG));
  }
```

- [ ] **Step 7: Udvid `modeLabel`**

Find:
```ts
  const modeLabel = mode === "read" ? "Hvad er klokken?" : mode === "set" ? "Sæt viserne" : "Stav med Dino";
```
Erstat med:
```ts
  const modeLabel = mode === "read" ? "Hvad er klokken?" : mode === "set" ? "Sæt viserne" : mode === "ord" ? "Stav med Dino" : "Knæk koden";
```

- [ ] **Step 8: Tilføj 4. spil-kort i menuen**

Find „Stav med Dino"-knappen (slutter med `</button>` lige før `</div>` der lukker `grid grid-cols-2`). Indsæt umiddelbart efter den knaps `</button>`:

```tsx
            <button onClick={() => setMode("kode")} className="fredoka rounded-2xl p-4 text-left transition active:translate-y-0.5 col-span-2" style={{ background: mode === "kode" ? "#FDE7D9" : "#FFFDF7", border: `3px solid ${mode === "kode" ? "#E8956A" : "#EBDCBF"}`, boxShadow: `0 4px 0 ${mode === "kode" ? "#CC7A50" : "#EBDCBF"}` }}>
              <div className="text-3xl">🔓</div>
              <div className="text-lg font-bold" style={{ color: "#4A3826" }}>Knæk koden</div>
              <div className="nunito text-sm font-semibold" style={{ color: "#7A6650" }}>Læs ledetrådene og find koden</div>
            </button>
```

- [ ] **Step 9: Tilføj kode-sværhedschips**

Find hele „Hvor svært?"-blokkens ternary `{mode !== "ord" ? ( … klokke-chips … ) : ( … ord-chips … )}` og erstat den med tre-vejs-versionen. Den fulde erstatning:

```tsx
          {mode === "ord" ? (
            <>
              <div className="flex flex-wrap gap-2">
                {([1, 2, 3] as WordLevel[]).map((wl) => (
                  <button key={wl} onClick={() => setWordLevel(wl)} className="fredoka rounded-full px-4 py-2 text-sm font-semibold transition active:translate-y-0.5" style={{ background: wordLevel === wl ? "#7FA663" : "#FFFDF7", color: wordLevel === wl ? "#fff" : "#4A3826", border: `3px solid ${wordLevel === wl ? "#5E8A57" : "#EBDCBF"}`, boxShadow: `0 4px 0 ${wordLevel === wl ? "#5E8A57" : "#EBDCBF"}` }}>
                    {WORD_LEVELS[wl].label} <span style={{ color: wordLevel === wl ? "#E4F0D8" : "#E9B23A" }}>{"★".repeat(wl)}</span>
                  </button>
                ))}
              </div>
              <p className="nunito text-sm mt-2" style={{ color: "#9A856C" }}>{WORD_LEVELS[wordLevel].desc}</p>
            </>
          ) : mode === "kode" ? (
            <>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(CODE_LEVELS) as CodeLevelKey[]).map((k) => (
                  <button key={k} onClick={() => setCodeLevel(k)} className="fredoka rounded-full px-4 py-2 text-sm font-semibold transition active:translate-y-0.5" style={{ background: codeLevel === k ? CODE_LEVEL_COLOR[k] : "#FFFDF7", color: codeLevel === k ? "#fff" : "#4A3826", border: `3px solid ${codeLevel === k ? shade(CODE_LEVEL_COLOR[k], -16) : "#EBDCBF"}`, boxShadow: `0 4px 0 ${codeLevel === k ? shade(CODE_LEVEL_COLOR[k], -16) : "#EBDCBF"}` }}>
                    {CODE_LEVELS[k].label} <span style={{ color: codeLevel === k ? "#FFF4D6" : "#E9B23A" }}>{"★".repeat(CODE_LEVELS[k].stars)}</span>
                  </button>
                ))}
              </div>
              <p className="nunito text-sm mt-2" style={{ color: "#9A856C" }}>{CODE_LEVELS[codeLevel].desc}</p>
            </>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {Object.entries(LEVELS).map(([k, v]) => (
                  <button key={k} onClick={() => setLevel(k as LevelKey)} className="fredoka rounded-full px-4 py-2 text-sm font-semibold transition active:translate-y-0.5" style={{ background: level === k ? "#2BB6A3" : "#FFFDF7", color: level === k ? "#fff" : "#4A3826", border: `3px solid ${level === k ? shade("#2BB6A3", -14) : "#EBDCBF"}`, boxShadow: `0 4px 0 ${level === k ? shade("#2BB6A3", -14) : "#EBDCBF"}` }}>
                    {v.label} <span style={{ color: level === k ? "#FFE39B" : "#E9B23A" }}>{"★".repeat(v.stars)}</span>
                    {levelBadge(stats, k as LevelKey) && (
                      <span style={{ marginLeft: 6, color: level === k ? "#FFE39B" : "#5DBB63" }}>{levelBadge(stats, k as LevelKey)}</span>
                    )}
                  </button>
                ))}
              </div>
              <p className="nunito text-sm mt-2" style={{ color: "#9A856C" }}>{LEVELS[level].desc}</p>
            </>
          )}
```

- [ ] **Step 10: Skjul klokke-prompt for kode**

Find prompt-blokken i `Play` (starter med `{mode === "ord" ? (` og en `<p>`-overskrift, slutter ved den lukkende `)}` før `{mode !== "ord" && (`). Pak hele blokken ind i `{mode !== "kode" && ( … )}`. Konkret: erstat det ydre `{mode === "ord" ? (` med `{mode !== "kode" && (mode === "ord" ? (` og den tilhørende afsluttende `)}` med `))}`.

- [ ] **Step 11: Skjul ur-området for kode**

Find:
```tsx
      {mode !== "ord" && (
        <div className="w-full mx-auto" style={{ maxWidth: 300 }}>
```
Erstat første linje med:
```tsx
      {(mode === "read" || mode === "set") && (
        <div className="w-full mx-auto" style={{ maxWidth: 300 }}>
```

- [ ] **Step 12: Tilføj CodeGame i svar-området**

Find:
```tsx
      {mode === "ord" ? (
        <WordGame level={wordLevel} round={wordRound} feedback={feedback} audio={audio} onComplete={handleWordComplete} onWrong={handleWordWrong} />
      ) : mode === "read" ? (
```
Erstat de to første linjer med (tilføjer kode-grenen FØR ord):
```tsx
      {mode === "kode" ? (
        <CodeGame scene={scene} level={codeLevel} round={codeRound} audio={audio} onSolved={handleCodeSolved} onWrong={handleCodeWrong} />
      ) : mode === "ord" ? (
        <WordGame level={wordLevel} round={wordRound} feedback={feedback} audio={audio} onComplete={handleWordComplete} onWrong={handleWordWrong} />
      ) : mode === "read" ? (
```

- [ ] **Step 13: Tilføj kode-fallback i Ugo-striben**

Find:
```tsx
            {msg || (mode === "read" ? "Kig godt på uret 👀 (rør ved uret for hjælp)" : mode === "set" ? "Flyt viserne på plads! ✋" : "Find de gemte bogstaver! 🔍")}
```
Erstat med:
```tsx
            {msg || (mode === "read" ? "Kig godt på uret 👀 (rør ved uret for hjælp)" : mode === "set" ? "Flyt viserne på plads! ✋" : mode === "ord" ? "Find de gemte bogstaver! 🔍" : "Tast koden og tryk på 🔓")}
```

- [ ] **Step 14: Næste-knap — altid synlig i kode-mode, label „Ny kode"**

Find:
```tsx
      {(feedback === "correct" || revealed) && (
        <Btn color="#2BB6A3" textColor="#fff" className="text-xl" onClick={mode === "ord" ? startWordRound : newQuestion}>Næste opgave ➜</Btn>
      )}
```
Erstat med:
```tsx
      {(feedback === "correct" || revealed || mode === "kode") && (
        <Btn color="#2BB6A3" textColor="#fff" className="text-xl" onClick={mode === "ord" ? startWordRound : mode === "kode" ? startCodeRound : newQuestion}>{mode === "kode" ? "Ny kode ➜" : "Næste opgave ➜"}</Btn>
      )}
```

- [ ] **Step 15: Scene-baggrund for hele skærmen i kode-play**

Find:
```tsx
  const sky = skyTheme(nowHour);
  const stripMood = pet && mood === "idle" ? "happy" : mood;
```
Tilføj under den:
```tsx
  const kodePlay = screen === "play" && mode === "kode";
```

Find den ydre return-div:
```tsx
    <div className="nunito min-h-screen relative w-full overflow-hidden" style={{ background: sky.gradient }}>
```
Erstat med:
```tsx
    <div className="nunito min-h-screen relative w-full overflow-hidden" style={{ background: kodePlay ? `linear-gradient(180deg, ${scene.bg[0]}, ${scene.bg[1]})` : sky.gradient }}>
```

Pak dernæst al himmel-pynt (sol/nat/skyer/bakker) ind, så den skjules i kode-play. Find første pynt-linje:
```tsx
      {!sky.night && (
```
Sæt en åbnende guard FØR den:
```tsx
      {!kodePlay && (<>
      {!sky.night && (
```
Og find afslutningen af bakke-`<svg>`:
```tsx
      </svg>
      <div className="relative mx-auto px-4 py-6 sm:py-8 flex flex-col gap-5" style={{ maxWidth: 560, zIndex: 5 }}>
```
Sæt den lukkende guard EFTER `</svg>`:
```tsx
      </svg>
      </>)}
      <div className="relative mx-auto px-4 py-6 sm:py-8 flex flex-col gap-5" style={{ maxWidth: 560, zIndex: 5 }}>
```

- [ ] **Step 16: Curly-quote-integritet + typecheck + tests**

Bekræft i `src/App.tsx` at `„Sæt viserne“` står intakt (codepoints `201E 0053 … 201C`) og at menu-tippet „Sæt viserne" ikke er blevet til straight quotes. Kør derefter:

Run: `npm run typecheck` og `npm test`
Expected: Begge grønne.

- [ ] **Step 17: Commit**

```bash
git add src/App.tsx
git commit -m "feat(kode): wire Knæk koden as 4th game with scene backdrop"
```

---

### Task 8: Version, CHANGELOG, README

**Files:**
- Modify: `package.json`, `CHANGELOG.md`, `README.md`

- [ ] **Step 1: Bump version**

I `package.json`: `"version": "0.10.0"` → `"version": "0.11.0"`.

- [ ] **Step 2: CHANGELOG-indgang**

Tilføj øverst under `## [Unreleased]` (eller opret en ny `## [0.11.0] - 2026-06-15`-sektion i Keep a Changelog-format):

```markdown
## [0.11.0] - 2026-06-15

### Added
- Nyt fjerde spil: „Alfred knækker koden" — kodeknækker (Mastermind) med hængelås, garanteret-løselige koder og fire sværhedsgrader.
- Rolige scener (dino-æg, skattekiste, cykel, raket, Ugos trædør, magisk dør) der rammer hver kode ind; hele skærmen klæder sig efter scenen.
- Krydse-af-noter: Alfred kan markere tal i ledetrådene som „ikke i koden" (✕) eller „med, men forkert plads" (◯) — vises på alle forekomster.
- Ugo læser ledetråden højt ved tryk på teksten.
- Delt stjerne-/pokal-konto på tværs af alle fire spil.

### Changed
- „Vis facit" i kodespillet er erstattet af en altid-tilgængelig „Ny kode"-knap (blidere, low-arousal).
```

- [ ] **Step 3: README-note**

Opdatér README's spil-/feature-liste så det fjerde spil („Alfred knækker koden") nævnes, og sæt versionen til v0.11.0.

- [ ] **Step 4: Fuld build + tests**

Run: `npm run build` og `npm test`
Expected: Build OK (tsc + vite), alle tests grønne.

- [ ] **Step 5: Commit**

```bash
git add package.json CHANGELOG.md README.md
git commit -m "chore: release v0.11.0 (Alfred knækker koden)"
```

---

### Task 9: Endelig verifikation (live preview)

**Files:** ingen (manuel verifikation)

- [ ] **Step 1: Start preview**

Byg/serve appen og åbn i Claude Preview (`preview_start` + `preview_eval`/`preview_inspect`; screenshot-værktøjet er ustabilt i dette miljø — brug DOM-inspektion + console logs).

- [ ] **Step 2: Gennemspil kode-spillet**

Verificér: menuen viser 4 spil → vælg „Knæk koden" + sværhedsgrad → „Spil!" → scene-baggrund + ting + ramme-tekst vises; tast en kode + 🔓 → forkert gæt giver shake + blid Ugo-besked (ingen straf); tryk på et tal i en ledetråd → cyklus ✕ → ◯ → rent, og mærket ses på alle forekomster + på tastaturet; tryk på ledetråds-tekst → Ugo læser højt (hvis lyd til); løs koden (brug evt. „Hjælp mig") → hængelås åbner, ting skifter til „opened", stjerne lægges i den delte række, konfetti + Ugo-jubel; „Ny kode ➜" → ny scene + ny kode. Skift til klokke-/dino-spillene → uændrede, samme stjernekonto.

- [ ] **Step 3: Bekræft ingen regressioner**

Run: `npm test` og `npm run typecheck` en sidste gang. Tjek browser-console for fejl via `preview_console_logs`.

---

## Self-Review (udført af planlæggeren)

**Spec-dækning:** §3 kode-motor → Task 2 ✓. §4 scener → Task 3 ✓. §5 krydse-af-noter → Task 6 (toggleMark + markStyle, sat via ledetråds-ruder) ✓. §6 Ugo læser højt → Task 6 (clue-tekst onClick) ✓. §7 komponenter → Tasks 5+6 ✓. §8 delt belønning → Task 7 (handleCodeSolved → handleCorrect) ✓. §9 persistens → Task 4 ✓. §10 App-wiring → Task 7 ✓. §11 test → Tasks 2+3+4 ✓. §12 filer → alle dækket ✓. §13 version → Task 8 ✓.

**Afvigelser fra spec (bevidste, forbedrer konsistens):**
- Mærker sættes kun via ledetråds-ruder (ikke på tastaturet); tastaturet afspejler mærker men er til input. Matcher brugerens ord „strege ud i ledetråden" og undgår konflikt med taste-input.
- `CodeGame` tegner ikke sin egen stjernerække — App-rammen viser den delt (som for `WordGame`). Mere konsistent end spec §7's „StarRow over hængelåsen".
- „Vis facit" droppet til fordel for altid-synlig „Ny kode" (blidere). Dokumenteret i CHANGELOG.

**Placeholder-scan:** ingen TBD/TODO; al kode er fuldt udskrevet. ✓
**Type-konsistens:** `CodeLevelKey`, `Mark`, `Scene`, `Puzzle`, `Clue` defineres i Task 2/3 og bruges konsistent i Task 4/6/7. `genPuzzle(level, Math.random)`, `pickScene(Math.random, id)`, `cycleMark`, `excludedDigits` matcher på tværs. ✓
