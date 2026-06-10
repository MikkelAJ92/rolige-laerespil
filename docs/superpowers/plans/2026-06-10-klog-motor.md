# Klog motor (v0.6.0) Implementeringsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gør Alfred-spillet klogere uden at ændre det: adaptiv opgavevælger (mestringsmodel pr. tid-position), nabo-fælde i svarmulighederne, Ugos blide niveau-forslag, en "Mit ur"-mestringsside og et "lige nu"-ur i menuen.

**Architecture:** Ren mestringslogik i `domain/mastery.ts` (immutabel, rng-injicerbar, fuldt testet). Stats persisteres under ny nøgle `alfred.stats.v1` (fremgang `alfred.progress.v1` urørt). To små komponenter (`NowClock`, `MasteryClock`) + kirurgiske, præcist specificerede ændringer i `App.tsx`. Spillets udseende, fejring og betjening bevares i øvrigt verbatim.

**Tech Stack:** Vite, React 18, TypeScript (strict), Tailwind v4, Vitest + jsdom. Branch: `feat/klog-motor`.

---

## Filstruktur

```
src/domain/mastery.ts        # NY: mestringsmodel + vægtet valg + hjælpere
src/domain/time.ts           # ÆNDRES: nabo-fælde i makeOptions
src/lib/persistence.ts       # ÆNDRES: loadStats/saveStats (alfred.stats.v1)
src/components/MasteryClock.tsx  # NY: Mit ur-skiven
src/components/NowClock.tsx      # NY: lige nu-uret + spørg-knap
src/App.tsx                  # ÆNDRES: wiring (præcise snippets i Task 6)
tests/mastery.test.ts        # NY
tests/time.test.ts           # UDVIDES (nabo-fælde)
tests/persistence.test.ts    # UDVIDES (stats)
package.json, CHANGELOG.md, README.md  # v0.6.0
```
Urørt: `Owl.tsx`, `Clock.tsx`, `ui.tsx`, `colors.ts`, `main.tsx`, `index.css`, fejring/konfetti/farver.

---

## Task 1: Domæne — mestringsmodellen (TDD)

**Files:** Create `src/domain/mastery.ts`, `tests/mastery.test.ts`

- [ ] **Step 1: Skriv den fejlende test**

```ts
// tests/mastery.test.ts
import { describe, it, expect } from 'vitest';
import {
  defaultStats, bucketState, recordAnswer, pickMinute, pickTime,
  levelMastered, levelBadge, nextLevel, deriveLevel, roundTimeTo5,
  MASTERY_STREAK, type Stats,
} from '../src/domain/mastery';
import { LEVELS } from '../src/domain/time';

function mastered() { return { correct: 3, wrong: 0, streak: 3 }; }

describe('recordAnswer', () => {
  it('bygger stime ved rigtigt første forsøg og er immutabel', () => {
    const s0 = defaultStats();
    const s1 = recordAnswer(s0, 30, true);
    const s2 = recordAnswer(s1, 30, true);
    expect(s2[30]).toEqual({ correct: 2, wrong: 0, streak: 2 });
    expect(s0[30]).toBeUndefined();
  });
  it('nulstiller stimen ved fejl', () => {
    let s = recordAnswer(defaultStats(), 0, true);
    s = recordAnswer(s, 0, true);
    s = recordAnswer(s, 0, false);
    expect(s[0]).toEqual({ correct: 2, wrong: 1, streak: 0 });
  });
});

describe('bucketState', () => {
  it('ny når aldrig set', () => expect(bucketState(undefined)).toBe('ny'));
  it('øver under stime-grænsen', () => expect(bucketState({ correct: 2, wrong: 1, streak: 2 })).toBe('øver'));
  it('mestret ved 3 i træk', () => {
    expect(MASTERY_STREAK).toBe(3);
    expect(bucketState(mastered())).toBe('mestret');
  });
});

describe('pickMinute', () => {
  it('vægter: mestret=1, ny=3 (deterministisk med fast rng)', () => {
    const stats: Stats = { 0: mastered() }; // 'halve': [0, 30] -> vægte [1, 3]
    expect(pickMinute(stats, 'halve', () => 0)).toBe(0);     // roll 0 -> første
    expect(pickMinute(stats, 'halve', () => 0.5)).toBe(30);  // roll 2 -> anden
  });
  it('vælger altid inden for niveauets minutsæt', () => {
    const rngs = [0, 0.1, 0.3, 0.5, 0.7, 0.9, 0.99];
    for (const r of rngs) {
      expect(LEVELS.kvarter.minutes).toContain(pickMinute(defaultStats(), 'kvarter', () => r));
    }
  });
});

describe('pickTime', () => {
  it('giver time 1-12 og gyldigt minut', () => {
    const t = pickTime(defaultStats(), 'minutter', () => 0.999);
    expect(t.h).toBeGreaterThanOrEqual(1);
    expect(t.h).toBeLessThanOrEqual(12);
    expect(LEVELS.minutter.minutes).toContain(t.m);
  });
});

describe('levelMastered + levelBadge', () => {
  it('kræver alle positioner mestret', () => {
    const halv: Stats = { 0: mastered(), 30: mastered() };
    expect(levelMastered(halv, 'halve')).toBe(true);
    expect(levelMastered({ 0: mastered() }, 'halve')).toBe(false);
  });
  it('badge: tom, ◐ ved delvis, ✓ ved fuld', () => {
    expect(levelBadge(defaultStats(), 'halve')).toBe('');
    expect(levelBadge({ 0: mastered() }, 'halve')).toBe('◐');
    expect(levelBadge({ 0: mastered(), 30: mastered() }, 'halve')).toBe('✓');
  });
});

describe('nextLevel + deriveLevel', () => {
  it('niveau-kæden', () => {
    expect(nextLevel('timer')).toBe('halve');
    expect(nextLevel('halve')).toBe('kvarter');
    expect(nextLevel('kvarter')).toBe('minutter');
    expect(nextLevel('minutter')).toBeNull();
  });
  it('mindste niveau for et minut', () => {
    expect(deriveLevel(0)).toBe('timer');
    expect(deriveLevel(30)).toBe('halve');
    expect(deriveLevel(15)).toBe('kvarter');
    expect(deriveLevel(45)).toBe('kvarter');
    expect(deriveLevel(5)).toBe('minutter');
    expect(deriveLevel(50)).toBe('minutter');
  });
});

describe('roundTimeTo5', () => {
  it('runder minut og håndterer time-skift og 12-format', () => {
    expect(roundTimeTo5(14, 2)).toEqual({ h: 2, m: 0 });
    expect(roundTimeTo5(14, 3)).toEqual({ h: 2, m: 5 });
    expect(roundTimeTo5(14, 58)).toEqual({ h: 3, m: 0 });
    expect(roundTimeTo5(11, 58)).toEqual({ h: 12, m: 0 });
    expect(roundTimeTo5(23, 59)).toEqual({ h: 12, m: 0 });
    expect(roundTimeTo5(0, 12)).toEqual({ h: 12, m: 10 });
  });
});
```

- [ ] **Step 2: Kør → FAIL** — `npx vitest run tests/mastery.test.ts` (import kan ikke resolves).

- [ ] **Step 3: Implementér `src/domain/mastery.ts`**

```ts
import { LEVELS, type LevelKey, type Time } from './time';

export interface BucketStat { correct: number; wrong: number; streak: number; }
/** Mestringskort: minut-position (0,5,...,55) -> stat. Fravær = aldrig set. */
export type Stats = Record<number, BucketStat>;
export type BucketState = 'ny' | 'øver' | 'mestret';
export type Rng = () => number;

export const MASTERY_STREAK = 3;

export function defaultStats(): Stats {
  return {};
}

export function bucketState(stat: BucketStat | undefined): BucketState {
  if (!stat || stat.correct + stat.wrong === 0) return 'ny';
  return stat.streak >= MASTERY_STREAK ? 'mestret' : 'øver';
}

/** Registrér ét svar (kun første forsøg tæller). Immutabel. */
export function recordAnswer(stats: Stats, minute: number, firstTryCorrect: boolean): Stats {
  const prev = stats[minute] ?? { correct: 0, wrong: 0, streak: 0 };
  const next: BucketStat = firstTryCorrect
    ? { correct: prev.correct + 1, wrong: prev.wrong, streak: prev.streak + 1 }
    : { correct: prev.correct, wrong: prev.wrong + 1, streak: 0 };
  return { ...stats, [minute]: next };
}

function bucketWeight(stat: BucketStat | undefined): number {
  const state = bucketState(stat);
  if (state === 'ny') return 3;
  if (state === 'mestret') return 1;
  return stat && stat.streak === 0 ? 4 : 2; // kæmper : på vej
}

/** Vægtet minut-valg inden for niveauets minutsæt. */
export function pickMinute(stats: Stats, level: LevelKey, rng: Rng): number {
  const minutes = LEVELS[level].minutes;
  const weights = minutes.map((m) => bucketWeight(stats[m]));
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (let i = 0; i < minutes.length; i++) {
    roll -= weights[i];
    if (roll < 0) return minutes[i];
  }
  return minutes[minutes.length - 1];
}

/** Adaptiv opgave: time uniform 1-12, minut vægtet. */
export function pickTime(stats: Stats, level: LevelKey, rng: Rng): Time {
  return { h: 1 + Math.floor(rng() * 12), m: pickMinute(stats, level, rng) };
}

export function levelMastered(stats: Stats, level: LevelKey): boolean {
  return LEVELS[level].minutes.every((m) => bucketState(stats[m]) === 'mestret');
}

/** '' = intet mestret, '◐' = delvist, '✓' = hele niveauet. */
export function levelBadge(stats: Stats, level: LevelKey): '' | '◐' | '✓' {
  const minutes = LEVELS[level].minutes;
  const done = minutes.filter((m) => bucketState(stats[m]) === 'mestret').length;
  if (done === 0) return '';
  return done === minutes.length ? '✓' : '◐';
}

export const LEVEL_ORDER: LevelKey[] = ['timer', 'halve', 'kvarter', 'minutter'];

export function nextLevel(level: LevelKey): LevelKey | null {
  const i = LEVEL_ORDER.indexOf(level);
  return i >= 0 && i < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[i + 1] : null;
}

/** Mindste niveau hvis minutsæt indeholder minuttet. */
export function deriveLevel(minute: number): LevelKey {
  for (const lvl of LEVEL_ORDER) {
    if (LEVELS[lvl].minutes.includes(minute)) return lvl;
  }
  return 'minutter';
}

/** Rund klokketid (24t) til nærmeste 5 minutter, som 12-timers Time. */
export function roundTimeTo5(h24: number, minute: number): Time {
  let m = Math.round(minute / 5) * 5;
  let h = h24;
  if (m === 60) { m = 0; h = h24 + 1; }
  const h12 = ((h % 12) + 12) % 12 || 12;
  return { h: h12, m };
}
```

- [ ] **Step 4: Kør → PASS** — `npx vitest run tests/mastery.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/domain/mastery.ts tests/mastery.test.ts
git commit -m "feat(mastery): add adaptive mastery model with weighted picking"
```

---

## Task 2: Nabo-fælden i makeOptions (TDD)

**Files:** Modify `src/domain/time.ts`, `tests/time.test.ts`

- [ ] **Step 1: Tilføj fejlende tests** — append inde i `describe('makeOptions', ...)` i `tests/time.test.ts`:

```ts
  it('indeholder altid nabo-fælden (samme minutter, nabotime)', () => {
    const opts = makeOptions({ h: 3, m: 30 }, 'halve');
    expect(opts.some((o) => o.h === 4 && o.m === 30)).toBe(true);
  });
  it('nabo-fælden wrapper 12 -> 1', () => {
    const opts = makeOptions({ h: 12, m: 0 }, 'timer');
    expect(opts.some((o) => o.h === 1 && o.m === 0)).toBe(true);
  });
```

- [ ] **Step 2: Kør → FAIL** — `npx vitest run tests/time.test.ts` (nabo ikke garanteret endnu; kør evt. 2-3 gange — den skal fejle deterministisk EFTER ændringen er testbar; accepter at den kan passere ved tilfælde FØR ændringen, men implementér alligevel Step 3 og bekræft at hele suiten passerer bagefter).

- [ ] **Step 3: Ændr `makeOptions` i `src/domain/time.ts`** — nuværende funktion:

```ts
export function makeOptions(answer: Time, level: LevelKey): Time[] {
  const map = new Map<string, Time>();
  map.set(tKey(answer), answer);
  let guard = 0;
  while (map.size < 4 && guard < 300) {
    guard++;
    const c = randomTime(level);
    map.set(tKey(c), c);
  }
  return shuffle([...map.values()]);
}
```

erstattes med:

```ts
export function makeOptions(answer: Time, level: LevelKey): Time[] {
  const map = new Map<string, Time>();
  map.set(tKey(answer), answer);
  // Nabo-fælden: samme minutter, nabotime (fanger halv/kvart-forvekslingen).
  const neighbour: Time = { h: (answer.h % 12) + 1, m: answer.m };
  map.set(tKey(neighbour), neighbour);
  let guard = 0;
  while (map.size < 4 && guard < 300) {
    guard++;
    const c = randomTime(level);
    map.set(tKey(c), c);
  }
  return shuffle([...map.values()]);
}
```

- [ ] **Step 4: Kør → PASS** — `npx vitest run tests/time.test.ts` (alle, inkl. de eksisterende egenskabstests).

- [ ] **Step 5: Commit**

```bash
git add src/domain/time.ts tests/time.test.ts
git commit -m "feat(time): always include the neighbour-hour trap distractor"
```

---

## Task 3: Stats-persistens (TDD)

**Files:** Modify `src/lib/persistence.ts`, `tests/persistence.test.ts`

- [ ] **Step 1: Tilføj fejlende tests** — append i bunden af `tests/persistence.test.ts` (inde i eller som ny describe):

```ts
import { loadStats, saveStats } from '../src/lib/persistence';

describe('stats-persistens', () => {
  beforeEach(() => localStorage.clear());

  it('gemmer og indlæser stats', () => {
    saveStats({ 30: { correct: 2, wrong: 1, streak: 0 } });
    expect(loadStats()).toEqual({ 30: { correct: 2, wrong: 1, streak: 0 } });
  });
  it('giver tomt kort uden data og ved korrupt JSON', () => {
    expect(loadStats()).toEqual({});
    localStorage.setItem('alfred.stats.v1', '{ikke json');
    expect(loadStats()).toEqual({});
  });
  it('filtrerer ugyldige nøgler og klamper negative tal', () => {
    localStorage.setItem('alfred.stats.v1', JSON.stringify({
      30: { correct: -2, wrong: 1, streak: 2 },
      7: { correct: 1, wrong: 0, streak: 1 },
      abc: { correct: 1, wrong: 0, streak: 1 },
    }));
    expect(loadStats()).toEqual({ 30: { correct: 0, wrong: 1, streak: 2 } });
  });
});
```

(Justér import-linjen øverst i filen i stedet, hvis filen samler imports dér: `import { loadProgress, saveProgress, defaultProgress, loadStats, saveStats } from '../src/lib/persistence';` — og drop den lokale import-linje ovenfor.)

- [ ] **Step 2: Kør → FAIL** — `npx vitest run tests/persistence.test.ts`.

- [ ] **Step 3: Udvid `src/lib/persistence.ts`** — tilføj øverst (efter eksisterende imports):

```ts
import { type Stats, type BucketStat, defaultStats } from '../domain/mastery';
```

og i bunden af filen:

```ts
const STATS_KEY = 'alfred.stats.v1';

export function loadStats(store: Storage = localStorage): Stats {
  try {
    const raw = store.getItem(STATS_KEY);
    if (raw == null) return defaultStats();
    const o = JSON.parse(raw) as Record<string, Partial<BucketStat> | null>;
    const out: Stats = {};
    for (const [k, v] of Object.entries(o ?? {})) {
      const minute = Number(k);
      if (!Number.isInteger(minute) || minute < 0 || minute > 55 || minute % 5 !== 0) continue;
      if (v == null || typeof v !== 'object') continue;
      out[minute] = {
        correct: num(v.correct, 0),
        wrong: num(v.wrong, 0),
        streak: num(v.streak, 0),
      };
    }
    return out;
  } catch {
    return defaultStats();
  }
}

export function saveStats(stats: Stats, store: Storage = localStorage): void {
  try {
    store.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    /* ignorér quota-fejl */
  }
}
```

(`num` findes allerede i filen og genbruges.)

- [ ] **Step 4: Kør → PASS** — `npx vitest run tests/persistence.test.ts`; derefter `npm test` (alle suiter) og `npm run typecheck`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/persistence.ts tests/persistence.test.ts
git commit -m "feat(persistence): persist mastery stats under alfred.stats.v1"
```

---

## Task 4: MasteryClock-komponenten

**Files:** Create `src/components/MasteryClock.tsx`

- [ ] **Step 1: Opret `src/components/MasteryClock.tsx`**

```tsx
import { polar } from "../domain/time";
import { bucketState, type Stats } from "../domain/mastery";

const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

interface MasteryClockProps {
  stats: Stats;
}

export default function MasteryClock({ stats }: MasteryClockProps) {
  return (
    <svg viewBox="0 0 200 200" style={{ width: "100%", height: "auto", display: "block" }} aria-label="mestringskort">
      <circle cx="100" cy="100" r="98" fill="#B5732E" />
      <circle cx="100" cy="100" r="92" fill="#8A551F" />
      <circle cx="100" cy="100" r="88" fill="#FFFDF6" stroke="#EAD3A6" strokeWidth="1" />
      {Array.from({ length: 12 }).map((_, i) => {
        const n = i + 1;
        const p = polar(62, n * 30);
        return (
          <text key={n} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" className="fredoka" style={{ fontSize: 14, fontWeight: 600, fill: "#5A4225" }}>
            {n}
          </text>
        );
      })}
      {MINUTES.map((m) => {
        const p = polar(80, m * 6);
        const state = bucketState(stats[m]);
        if (state === "mestret") {
          return <circle key={m} cx={p.x} cy={p.y} r="7" fill="#FFC23C" stroke="#E9B23A" strokeWidth="2" />;
        }
        if (state === "øver") {
          return <circle key={m} cx={p.x} cy={p.y} r="7" fill="none" stroke="#E9B23A" strokeWidth="2.5" />;
        }
        return <circle key={m} cx={p.x} cy={p.y} r="7" fill="none" stroke="#DCCBA8" strokeWidth="2" opacity="0.45" />;
      })}
      <circle cx="100" cy="100" r="6" fill="#4A3826" />
    </svg>
  );
}
```

- [ ] **Step 2: Verificér** — `npm run typecheck` → ren.

- [ ] **Step 3: Commit**

```bash
git add src/components/MasteryClock.tsx
git commit -m "feat(ui): add Mit ur mastery clock"
```

---

## Task 5: NowClock-komponenten

**Files:** Create `src/components/NowClock.tsx`

- [ ] **Step 1: Opret `src/components/NowClock.tsx`**

```tsx
import { useEffect, useState } from "react";
import Clock from "./Clock";
import { danishTime, cap, type Time } from "../domain/time";
import { roundTimeTo5 } from "../domain/mastery";

interface NowClockProps {
  onAsk: (t: Time) => void;
}

export default function NowClock({ onAsk }: NowClockProps) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 10000);
    return () => window.clearInterval(id);
  }, []);
  const t = roundTimeTo5(now.getHours(), now.getMinutes());
  return (
    <div className="w-full rounded-3xl p-4 flex items-center gap-4" style={{ background: "#FFFDF7", border: "3px solid #F0E2C8", boxShadow: "0 12px 30px rgba(74,56,38,.14)" }}>
      <div style={{ width: 86, flexShrink: 0 }}>
        <Clock h={t.h} m={t.m} />
      </div>
      <div className="flex flex-col items-start gap-1">
        <span className="nunito text-xs font-bold uppercase" style={{ color: "#9A856C", letterSpacing: "0.06em" }}>Lige nu</span>
        <span className="fredoka text-xl font-semibold" style={{ color: "#4A3826" }}>{cap(danishTime(t.h, t.m))}</span>
        <button onClick={() => onAsk(t)} className="fredoka rounded-full px-4 py-2 text-sm font-semibold transition active:translate-y-0.5" style={{ background: "#FFF3D6", color: "#8A551F", border: "3px solid #E9C77E", boxShadow: "0 3px 0 #E9C77E" }}>
          Spørg mig om den! 🕐
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificér** — `npm run typecheck` → ren.

- [ ] **Step 3: Commit**

```bash
git add src/components/NowClock.tsx
git commit -m "feat(ui): add live now-clock with child-initiated question"
```

---

## Task 6: App.tsx — wiring (kirurgisk; LÆS filen først og brug snippets som præcise guides)

**Files:** Modify `src/App.tsx`

Filen bruger dobbelte anførselstegn i JSX/strenge. Foretag ALLE ændringer, kør derefter verifikation. Ret intet andet — fejring, konfetti, layout og spil-logik er i øvrigt verbatim.

- [ ] **Step 1: Imports.** Fjern `randomTime` fra time-importen (bliver ubrugt → noUnusedLocals). Udvid persistence-importen og tilføj de nye moduler:

```tsx
import { LEVELS, danishTime, makeOptions, snapMinute, cap, digital, tKey, rand, CORRECT, WRONG, type LevelKey, type Time } from "./domain/time";
import { pickTime, recordAnswer, levelMastered, levelBadge, nextLevel, deriveLevel } from "./domain/mastery";
import { loadProgress, saveProgress, loadStats, saveStats } from "./lib/persistence";
import NowClock from "./components/NowClock";
import MasteryClock from "./components/MasteryClock";
```

(Behold eksisterende imports af shade/Owl/Clock/ui uændret. Hvis den nuværende time-import nævner andre navne, så bevar dem — fjern KUN `randomTime` og tilføj intet andet dér.)

- [ ] **Step 2: Screen-union.** `useState<"menu" | "play">("menu")` → `useState<"menu" | "play" | "mitur">("menu")`. (Hvis nuværende kode er utypet `useState("menu")`, så tilføj unionen.)

- [ ] **Step 3: Ny state + refs.** Lige efter `const [trophies, setTrophies] = useState(initial.trophies);`:

```tsx
const [stats, setStats] = useState(loadStats);
const [suggestion, setSuggestion] = useState<LevelKey | null>(null);
const firstTry = useRef(true);
const suggestedRef = useRef<Set<LevelKey>>(new Set());
const skipNext = useRef(false);
```

- [ ] **Step 4: Gem-effekt.** Lige efter den eksisterende `useEffect(() => { saveProgress(...) }, [...]);`:

```tsx
useEffect(() => {
  saveStats(stats);
}, [stats]);
```

- [ ] **Step 5: newQuestion.** Erstat `const q2 = randomTime(level);` med `const q2 = pickTime(stats, level, Math.random);`. Tilføj til sidst i funktionen (efter `setSetM(0);`):

```tsx
    firstTry.current = true;
    const nxt = nextLevel(level);
    if (nxt && levelMastered(stats, level) && !suggestedRef.current.has(level)) {
      suggestedRef.current.add(level);
      setSuggestion(level);
    } else {
      setSuggestion(null);
    }
```

og ændr dependency-arrayet fra `[level]` til `[level, stats]`.

- [ ] **Step 6: Skip-guard i skærm-effekten.** Nuværende:

```tsx
useEffect(() => {
  if (screen === "play") newQuestion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [screen, mode, level]);
```

erstattes med:

```tsx
useEffect(() => {
  if (screen === "play") {
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    newQuestion();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [screen, mode, level]);
```

- [ ] **Step 7: Registrér første forsøg i chooseOption.** I den korrekte gren (hvor `handleCorrect()` kaldes) — tilføj FØR `handleCorrect();`:

```tsx
      if (firstTry.current) {
        firstTry.current = false;
        setStats((s) => recordAnswer(s, q.m, true));
      }
```

I den forkerte gren (hvor `setWrongPicks(...)` kaldes) — tilføj FØR `setWrongPicks(...)`:

```tsx
    if (firstTry.current) {
      firstTry.current = false;
      setStats((s) => recordAnswer(s, q.m, false));
    }
```

- [ ] **Step 8: Registrér første forsøg i checkSet.** I succes-grenen (hvor `handleCorrect()` kaldes) — tilføj FØR:

```tsx
      if (firstTry.current) {
        firstTry.current = false;
        setStats((s) => recordAnswer(s, q.m, true));
      }
```

I else-grenen (forkert) — tilføj som første linjer:

```tsx
      if (firstTry.current) {
        firstTry.current = false;
        setStats((s) => recordAnswer(s, q.m, false));
      }
```

- [ ] **Step 9: askNow-funktionen.** Tilføj efter `checkSet`-funktionen:

```tsx
  function askNow(t: Time) {
    skipNext.current = true;
    setScreen("play");
    setQ(t);
    setOptions(makeOptions(t, deriveLevel(t.m)));
    setFeedback("idle");
    setRevealed(false);
    setAttempts(0);
    setWrongPicks([]);
    setMsg("");
    setMood("idle");
    setSetH(12);
    setSetM(0);
    setSuggestion(null);
    firstTry.current = true;
  }
```

- [ ] **Step 10: Ugos forslag i besked-striben.** Nuværende besked-afsnit i Play:

```tsx
        <p className="fredoka text-base sm:text-lg font-semibold" style={{ color: "#5A4225" }}>
          {msg || (mode === "read" ? "Kig godt på uret 👀" : "Flyt viserne på plads! ✋")}
        </p>
```

erstattes med:

```tsx
        {suggestion && !msg && feedback !== "correct" ? (
          <div className="flex flex-col gap-2">
            <p className="fredoka text-base sm:text-lg font-semibold" style={{ color: "#5A4225" }}>
              Du kan {LEVELS[suggestion].label.toLowerCase()} nu! Skal vi prøve {LEVELS[nextLevel(suggestion)!].label.toLowerCase()}? 🦉
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const nxt = nextLevel(suggestion);
                  setSuggestion(null);
                  if (nxt) setLevel(nxt);
                }}
                className="fredoka rounded-full px-4 py-1.5 text-sm font-semibold transition active:translate-y-0.5"
                style={{ background: "#2BB6A3", color: "#fff", border: "3px solid #1F8C7E", boxShadow: "0 3px 0 #1F8C7E" }}
              >
                Ja!
              </button>
              <button
                onClick={() => setSuggestion(null)}
                className="fredoka rounded-full px-4 py-1.5 text-sm font-semibold transition active:translate-y-0.5"
                style={{ background: "#FFFDF7", color: "#7A6650", border: "3px solid #EBDCBF", boxShadow: "0 3px 0 #EBDCBF" }}
              >
                Ikke nu
              </button>
            </div>
          </div>
        ) : (
          <p className="fredoka text-base sm:text-lg font-semibold" style={{ color: "#5A4225" }}>
            {msg || (mode === "read" ? "Kig godt på uret 👀" : "Flyt viserne på plads! ✋")}
          </p>
        )}
```

- [ ] **Step 11: Niveau-badges i menuen.** I niveau-chip-knappen (i Menu, `Object.entries(LEVELS).map(([k, v]) => ...)`), efter `<span style={{ color: ... }}>{"★".repeat(v.stars)}</span>` tilføjes:

```tsx
                {levelBadge(stats, k as LevelKey) && (
                  <span style={{ marginLeft: 6, color: level === k ? "#FFE39B" : "#5DBB63" }}>{levelBadge(stats, k as LevelKey)}</span>
                )}
```

- [ ] **Step 12: Menu-tilføjelser.** I Menu-konstanten, EFTER den store kort-`div` (den med "1. Vælg spil" / "2. Hvor svært?" / Spil!-knappen) men før Menu'ens afsluttende `</div>`:

```tsx
      <button
        onClick={() => setScreen("mitur")}
        className="fredoka rounded-full px-5 py-2 text-base font-semibold transition active:translate-y-0.5"
        style={{ background: "#FFFDF7", color: "#4A3826", border: "3px solid #EBDCBF", boxShadow: "0 4px 0 #EBDCBF" }}
      >
        Mit ur 🕐
      </button>
      <NowClock onAsk={askNow} />
```

- [ ] **Step 13: MitUr-skærmen.** Efter `const Play = (...)`-blokken tilføjes:

```tsx
  const MitUr = (
    <div className="w-full rounded-3xl p-4 sm:p-5 flex flex-col gap-4" style={{ background: "#FFFDF7", border: "3px solid #F0E2C8", boxShadow: "0 12px 30px rgba(74,56,38,.14)" }}>
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setScreen("menu")}
          className="fredoka rounded-full px-3 py-2 text-sm font-semibold transition active:translate-y-0.5"
          style={{ background: "#FFFDF7", color: "#7A6650", border: "3px solid #EBDCBF", boxShadow: "0 3px 0 #EBDCBF" }}
        >
          ← Menu
        </button>
        <div className="fredoka text-base font-bold" style={{ color: "#4A3826" }}>Mit ur 🕐</div>
        <div style={{ width: 64 }} />
      </div>
      <div className="w-full mx-auto" style={{ maxWidth: 280 }}>
        <MasteryClock stats={stats} />
      </div>
      <p className="nunito text-sm text-center font-semibold" style={{ color: "#7A6650" }}>
        Guld = du kan den ⭐ · Ring = du øver · Svag = ny
      </p>
    </div>
  );
```

og render-linjen i bunden ændres fra `{screen === "menu" ? Menu : Play}` til:

```tsx
        {screen === "menu" ? Menu : screen === "play" ? Play : MitUr}
```

- [ ] **Step 14: Verificér**

Run: `npm run typecheck` → ren.
Run: `npm test` → alle suiter grønne.
Run: `npm run build` → success.

- [ ] **Step 15: Commit**

```bash
git add src/App.tsx
git commit -m "feat(app): wire adaptive engine, Mit ur screen and now-clock"
```

---

## Task 7: Dokumentation (v0.6.0)

**Files:** Modify `package.json`, `CHANGELOG.md`, `README.md`

- [ ] **Step 1:** `package.json`: `"version": "0.5.0",` → `"version": "0.6.0",`

- [ ] **Step 2:** Prepend i `CHANGELOG.md` (efter Semantic Versioning-linjen, før `## [0.5.0]`):

```markdown
## [0.6.0] - 2026-06-10

### Added
- Klog motor: adaptiv opgavevælger — mere af det man næsten kan, stille gentagelse af det lærte, altid inden for barnets eget valgte niveau
- Nabo-fælden: én svarmulighed er altid nabotimen med samme minutter (tester ægte halv/kvart-forståelse)
- Ugos blide forslag om næste niveau når alt er mestret (kan ignoreres; skifter aldrig selv)
- "Mit ur": mestringsside hvor hver tid-position bliver guld når den er lært (+ ✓/◐ på niveau-knapperne)
- "Lige nu"-ur i menuen med den rigtige tid og "Spørg mig om den!"-knap (kun på barnets initiativ)

### Teknisk
- Ny localStorage-nøgle `alfred.stats.v1` (stjerner/pokaler urørt)

```

- [ ] **Step 3:** `README.md` — under "## Funktioner" tilføjes:

```markdown
- Klog motor: adaptive opgaver, "Mit ur"-mestringskort og et "lige nu"-ur med den rigtige tid
```

- [ ] **Step 4: Fuld verifikation** — `npm test` (alle grønne), `npm run typecheck` (ren), `npm run build` (success).

- [ ] **Step 5: Commit**

```bash
git add package.json CHANGELOG.md README.md
git commit -m "docs: bump to v0.6.0 for the smart engine"
```

---

## Self-Review (udført under planlægningen)

**Spec-dækning:** Mestringsmodel + vægtet valg (spec §2) → Task 1. Nabo-fælde (§3) → Task 2. Forslag (§4) → Task 6 trin 5+10 (sat i newQuestion, vist i besked-striben, én gang pr. session via suggestedRef, aldrig oven i fejring pga. `feedback !== "correct"` og `!msg`). Mit ur + badges (§5) → Task 4 + Task 6 trin 11-13. Lige nu-ur + spørg-knap (§6, afrundet viser+tekst sammen via roundTimeTo5, barne-initieret, deriveLevel-pulje, rører ikke valgt niveau — askNow ændrer hverken `level` eller `mode`) → Task 5 + Task 6 trin 9. Persistens-nøgle (§7) → Task 3. Verbatim-garanti (§1/§8) → kun de listede snippets ændres. v0.6.0 (§10) → Task 7. ✓

**Placeholder-scan:** Ingen TBD/TODO; alle trin har konkret kode. Task 6 instruerer "læs filen først" med eksakte snippets — bevidst, da App.tsx er den levende fil. ✓

**Type-konsistens:** `Stats`/`BucketStat`/`Rng` (mastery) bruges i persistence (import) og App. `pickTime(stats, level, Math.random)` matcher signaturen `(Stats, LevelKey, Rng)`. `recordAnswer(s, q.m, bool)` immutabel via setStats-callback. `levelBadge`/`levelMastered`/`nextLevel`/`deriveLevel`/`roundTimeTo5` signaturer ens i Task 1/5/6. `makeOptions(t, deriveLevel(t.m))` matcher `(Time, LevelKey)`. `NowClock { onAsk: (t: Time) => void }` matcher `askNow`. `MasteryClock { stats: Stats }` matcher. `suggestion: LevelKey | null` + non-null assert kun hvor `suggestion` er sand. ✓

**Ro-kontrakt:** Motoren ændrer aldrig niveau (kun pickTime inden for valgt niveau); forslag ambient + én gang pr. session + dismissible; nu-spørgsmål kun via knap; Mit ur uden lyd/animation; fejring urørt. ✓
