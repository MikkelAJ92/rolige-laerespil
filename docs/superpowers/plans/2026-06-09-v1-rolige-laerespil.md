# Rolige Lærespil v1 — Implementeringsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bygge v1 af en rolig, reklamefri PWA-læringsapp ("Mine Lærespil") med en forside og en gennemført klokke-aktivitet til en dreng på 5-7 år.

**Architecture:** Vanilla TypeScript-app uden UI-framework. En lille app-skal skifter mellem forsiden og en aktivitet via et fælles `Activity`-interface. UI bygges med en lille, sikker DOM-hjælper (`h`/`svgEl`/`empty`) — aldrig `innerHTML`. Ren domænelogik (dansk tid-til-tekst, ur-vinkler, niveauer) er rene funktioner adskilt fra UI og test-dækket først. Tilstand (niveau, trofæer, samling) gemmes i `localStorage`. Lyd (dansk tale + bløde toner) ligger bag en service med injicerbare afhængigheder, så den er testbar. PWA-laget (offline + hjemmeskærm-ikon) leveres af `vite-plugin-pwa`.

**Tech Stack:** Vite, TypeScript, Vitest (+ jsdom), vite-plugin-pwa, @vite-pwa/assets-generator, ren CSS med design-tokens, SVG.

---

## Filstruktur

```
rolige-laerespil/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── pwa-assets.config.ts
├── index.html
├── public/
│   └── logo.svg                      # kilde til PWA-ikoner (uglen)
├── src/
│   ├── main.ts                       # entry: starter app-skal
│   ├── styles/
│   │   ├── tokens.css                # design-tokens (CSS-variabler)
│   │   └── base.css                  # reset + fælles komponent-styles
│   ├── core/
│   │   ├── dom.ts                    # sikre DOM-hjælpere (h, svgEl, empty)
│   │   ├── activity.ts               # Activity-interface
│   │   ├── router.ts                 # skift mellem forside og aktivitet
│   │   └── storage.ts                # localStorage JSON-wrapper
│   ├── domain/
│   │   ├── time-to-danish.ts         # ren: (timer, minutter) -> dansk tekst
│   │   ├── clock-math.ts             # ren: viser-vinkler
│   │   └── clock-levels.ts           # niveau-config + spørgsmåls-generator
│   ├── services/
│   │   ├── audio.ts                  # tale (da-DK) + bløde toner + mute
│   │   └── progress.ts               # niveauer, trofæer, samling (localStorage)
│   ├── ui/
│   │   ├── icons.ts                  # delte SVG (dino, cykel, trofæ)
│   │   ├── mascot.ts                 # ugle-SVG efter rang
│   │   └── home.ts                   # forside (3 felter + gamification-stribe)
│   ├── activities/
│   │   └── clock/
│   │       ├── clock-face.ts         # render analogt ur (SVG-streng)
│   │       ├── read-mode.ts          # "Se klokken"
│   │       ├── set-mode.ts           # "Stil klokken"
│   │       └── clock-activity.ts     # orkestrerer aktiviteten (Activity)
│   └── parent/
│       └── parent-corner.ts          # tryk-og-hold indstillinger
└── tests/
    ├── time-to-danish.test.ts
    ├── clock-math.test.ts
    ├── clock-levels.test.ts
    ├── storage.test.ts
    ├── progress.test.ts
    ├── audio.test.ts
    ├── dom.test.ts
    ├── mascot.test.ts
    ├── set-mode.test.ts
    └── read-mode.test.ts
```

**Designnote:** Hver fil har ét ansvar. Domæne (`domain/`) kender intet til DOM. UI importerer domæne/services, aldrig omvendt. SVG-funktioner returnerer betroede strenge; de indsættes i DOM'en via `svgEl` (parser), så vi aldrig sætter `innerHTML`.

---

## Task 1: Projekt-skelet (Vite + TypeScript + Vitest)

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`

- [ ] **Step 1: Opret `package.json`**

```json
{
  "name": "rolige-laerespil",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "generate-icons": "pwa-assets-generator"
  },
  "devDependencies": {
    "@vite-pwa/assets-generator": "^0.2.6",
    "jsdom": "^25.0.1",
    "typescript": "^5.6.3",
    "vite": "^5.4.10",
    "vite-plugin-pwa": "^0.21.1",
    "vitest": "^2.1.5"
  }
}
```

- [ ] **Step 2: Opret `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "sourceMap": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client", "vitest/globals"],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src/**/*", "tests/**/*", "*.config.ts"]
}
```

- [ ] **Step 3: Opret `vite.config.ts` (uden PWA endnu — tilføjes i Task 19)**

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

- [ ] **Step 4: Opret `index.html`**

```html
<!DOCTYPE html>
<html lang="da">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>Mine Lærespil</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 5: Opret midlertidig `src/main.ts`**

```ts
const app = document.querySelector<HTMLDivElement>('#app');
if (app) app.textContent = 'Mine Lærespil';
```

- [ ] **Step 6: Installér afhængigheder**

Run: `npm install`
Expected: `node_modules/` oprettes, ingen fejl (advarsler om peer-deps er OK).

- [ ] **Step 7: Verificér dev-server og typecheck**

Run: `npm run typecheck`
Expected: ingen output, exit 0.

Run: `npm run dev` (åbn den viste URL kort, luk igen med Ctrl+C)
Expected: siden viser "Mine Lærespil".

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts index.html src/main.ts
git commit -m "build: scaffold Vite + TypeScript + Vitest project"
```

---

## Task 2: Design-tokens og basis-CSS

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/base.css`
- Modify: `src/main.ts`

- [ ] **Step 1: Opret `src/styles/tokens.css`**

```css
:root {
  /* Flader */
  --bg: #F4F1EA;
  --surface: #FBF8F1;
  --surface-soft: #F8F5EE;
  --white: #FFFFFF;

  /* Tekst */
  --text: #4A4A45;
  --text-muted: #9A968B;

  /* Kanter */
  --border: #E0D8C8;
  --border-strong: #D8CFBE;

  /* Aktivitetsfarver */
  --clock: #A8C3B8;
  --clock-dark: #8FB0A4;
  --letters: #E0B7A0;
  --numbers: #A9BBD0;

  /* Accenter */
  --accent-warm: #C98A6B;
  --trophy: #CBA15A;
  --dino: #9DB89A;
  --bike: #9AB0C4;

  /* Form */
  --radius-md: 14px;
  --radius-lg: 18px;
  --radius-xl: 24px;
  --shadow-md: 0 4px 10px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 12px 34px rgba(0, 0, 0, 0.09);
  --touch-min: 64px;

  /* Skrift */
  --font-head: Georgia, "Times New Roman", serif;
  --font-body: system-ui, "Segoe UI", sans-serif;
}
```

- [ ] **Step 2: Opret `src/styles/base.css`**

```css
* { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  height: 100%;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  -webkit-tap-highlight-color: transparent;
}

#app { min-height: 100%; display: flex; flex-direction: column; }

h1, h2, h3 { font-family: var(--font-head); font-weight: normal; color: var(--text); }

button {
  font-family: var(--font-body);
  cursor: pointer;
  border: none;
  background: none;
  color: inherit;
}

/* Fælles trykflade */
.tile {
  min-height: var(--touch-min);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
  transition: transform 0.12s ease;
}
.tile:active { transform: scale(0.97); }

.screen { flex: 1; padding: 20px; max-width: 760px; margin: 0 auto; width: 100%; }
```

- [ ] **Step 3: Importér CSS i `src/main.ts`**

```ts
import './styles/tokens.css';
import './styles/base.css';

const app = document.querySelector<HTMLDivElement>('#app');
if (app) app.textContent = 'Mine Lærespil';
```

- [ ] **Step 4: Verificér**

Run: `npm run dev` (åbn kort, luk med Ctrl+C)
Expected: baggrunden er creme (#F4F1EA), teksten mørk grå.

- [ ] **Step 5: Commit**

```bash
git add src/styles/tokens.css src/styles/base.css src/main.ts
git commit -m "feat: add design tokens and base styles"
```

---

## Task 3: Domæne — dansk tid-til-tekst

**Files:**
- Create: `src/domain/time-to-danish.ts`, `tests/time-to-danish.test.ts`

**Konvention (dokumenteret):** :20 og :40 bruger time-anker ("tyve minutter over/i time"), mens :25 og :35 bruger halv-anker ("fem minutter i/over halv"), som er den mest naturlige danske talemåde.

- [ ] **Step 1: Skriv den fejlende test**

```ts
// tests/time-to-danish.test.ts
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
```

- [ ] **Step 2: Kør testen og bekræft den fejler**

Run: `npx vitest run tests/time-to-danish.test.ts`
Expected: FAIL — "Failed to resolve import '../src/domain/time-to-danish'".

- [ ] **Step 3: Skriv implementeringen**

```ts
// src/domain/time-to-danish.ts
const HOUR_WORDS = [
  'tolv', 'et', 'to', 'tre', 'fire', 'fem',
  'seks', 'syv', 'otte', 'ni', 'ti', 'elleve',
];

export function hourWord(h: number): string {
  return HOUR_WORDS[((h % 12) + 12) % 12];
}

/** Returnerer den danske talemåde uden "klokken er"-præfiks. */
export function timeToDanish(hours: number, minutes: number): string {
  const h = ((hours % 12) + 12) % 12 || 12; // 1..12
  const next = h === 12 ? 1 : h + 1;
  const w = hourWord(h);
  const nw = hourWord(next);

  switch (minutes) {
    case 0:  return w;
    case 5:  return `fem minutter over ${w}`;
    case 10: return `ti minutter over ${w}`;
    case 15: return `kvart over ${w}`;
    case 20: return `tyve minutter over ${w}`;
    case 25: return `fem minutter i halv ${nw}`;
    case 30: return `halv ${nw}`;
    case 35: return `fem minutter over halv ${nw}`;
    case 40: return `tyve minutter i ${nw}`;
    case 45: return `kvart i ${nw}`;
    case 50: return `ti minutter i ${nw}`;
    case 55: return `fem minutter i ${nw}`;
    default: throw new Error(`Ikke-understøttet minut: ${minutes}`);
  }
}
```

- [ ] **Step 4: Kør testen og bekræft den består**

Run: `npx vitest run tests/time-to-danish.test.ts`
Expected: PASS (alle cases).

- [ ] **Step 5: Commit**

```bash
git add src/domain/time-to-danish.ts tests/time-to-danish.test.ts
git commit -m "feat(domain): add Danish time-to-text"
```

---

## Task 4: Domæne — viser-vinkler

**Files:**
- Create: `src/domain/clock-math.ts`, `tests/clock-math.test.ts`

- [ ] **Step 1: Skriv den fejlende test**

```ts
// tests/clock-math.test.ts
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
```

- [ ] **Step 2: Kør testen og bekræft den fejler**

Run: `npx vitest run tests/clock-math.test.ts`
Expected: FAIL — import kan ikke resolves.

- [ ] **Step 3: Skriv implementeringen**

```ts
// src/domain/clock-math.ts
/** Vinkel i grader fra kl. 12, med uret. */
export function minuteHandAngle(minutes: number): number {
  return minutes * 6;
}

export function hourHandAngle(hours: number, minutes: number): number {
  return (hours % 12) * 30 + minutes * 0.5;
}
```

- [ ] **Step 4: Kør testen og bekræft den består**

Run: `npx vitest run tests/clock-math.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/clock-math.ts tests/clock-math.test.ts
git commit -m "feat(domain): add clock hand angle math"
```

---

## Task 5: Domæne — niveauer og spørgsmåls-generator

**Files:**
- Create: `src/domain/clock-levels.ts`, `tests/clock-levels.test.ts`

- [ ] **Step 1: Skriv den fejlende test**

```ts
// tests/clock-levels.test.ts
import { describe, it, expect } from 'vitest';
import { LEVELS, timesForLevel, pickQuestion, type ClockLevel } from '../src/domain/clock-levels';

describe('LEVELS', () => {
  it('niveau 1 er kun hele timer', () => {
    expect(LEVELS[1].minutes).toEqual([0]);
  });
  it('niveau 4 har alle 5-minutters-trin', () => {
    expect(LEVELS[4].minutes).toHaveLength(12);
  });
});

describe('timesForLevel', () => {
  it('niveau 1 giver 12 tider (en pr. time)', () => {
    expect(timesForLevel(1)).toHaveLength(12);
  });
  it('niveau 2 giver 24 tider', () => {
    expect(timesForLevel(2)).toHaveLength(24);
  });
});

describe('pickQuestion', () => {
  const rng = () => 0; // deterministisk
  it('giver præcis 4 svarmuligheder', () => {
    const q = pickQuestion(1 as ClockLevel, rng);
    expect(q.options).toHaveLength(4);
  });
  it('inkluderer det korrekte svar', () => {
    const q = pickQuestion(3 as ClockLevel, rng);
    expect(q.options).toContainEqual(q.answer);
  });
  it('har ingen dubletter blandt svarene', () => {
    const q = pickQuestion(4 as ClockLevel, rng);
    const keys = q.options.map((t) => `${t.hours}:${t.minutes}`);
    expect(new Set(keys).size).toBe(4);
  });
});
```

- [ ] **Step 2: Kør testen og bekræft den fejler**

Run: `npx vitest run tests/clock-levels.test.ts`
Expected: FAIL — import kan ikke resolves.

- [ ] **Step 3: Skriv implementeringen**

```ts
// src/domain/clock-levels.ts
export type ClockLevel = 1 | 2 | 3 | 4;

export interface ClockTime {
  hours: number;   // 1..12
  minutes: number; // multiplum af 5
}

export interface LevelConfig {
  level: ClockLevel;
  label: string;
  minutes: number[];
}

export const LEVELS: Record<ClockLevel, LevelConfig> = {
  1: { level: 1, label: 'Hele timer', minutes: [0] },
  2: { level: 2, label: 'Halve timer', minutes: [0, 30] },
  3: { level: 3, label: 'Kvarter', minutes: [0, 15, 30, 45] },
  4: { level: 4, label: 'Fem-minutter', minutes: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] },
};

export type Rng = () => number; // [0, 1)

export function timesForLevel(level: ClockLevel): ClockTime[] {
  const out: ClockTime[] = [];
  for (let h = 1; h <= 12; h++) {
    for (const m of LEVELS[level].minutes) {
      out.push({ hours: h, minutes: m });
    }
  }
  return out;
}

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickQuestion(level: ClockLevel, rng: Rng): { answer: ClockTime; options: ClockTime[] } {
  const all = timesForLevel(level);
  const answer = all[Math.floor(rng() * all.length)];
  const pool = all.filter((t) => !(t.hours === answer.hours && t.minutes === answer.minutes));
  const distractors: ClockTime[] = [];
  while (distractors.length < 3 && pool.length) {
    const i = Math.floor(rng() * pool.length);
    distractors.push(pool.splice(i, 1)[0]);
  }
  return { answer, options: shuffle([answer, ...distractors], rng) };
}
```

- [ ] **Step 4: Kør testen og bekræft den består**

Run: `npx vitest run tests/clock-levels.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/clock-levels.ts tests/clock-levels.test.ts
git commit -m "feat(domain): add clock levels and question generator"
```

---

## Task 6: Core — localStorage-wrapper

**Files:**
- Create: `src/core/storage.ts`, `tests/storage.test.ts`

- [ ] **Step 1: Skriv den fejlende test**

```ts
// tests/storage.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { getJSON, setJSON } from '../src/core/storage';

describe('storage', () => {
  beforeEach(() => localStorage.clear());

  it('gemmer og henter JSON', () => {
    setJSON('k', { a: 1 });
    expect(getJSON('k', { a: 0 })).toEqual({ a: 1 });
  });
  it('returnerer fallback når nøglen mangler', () => {
    expect(getJSON('mangler', { x: 9 })).toEqual({ x: 9 });
  });
  it('returnerer fallback ved ugyldig JSON', () => {
    localStorage.setItem('korrupt', '{ikke json');
    expect(getJSON('korrupt', { ok: true })).toEqual({ ok: true });
  });
});
```

- [ ] **Step 2: Kør testen og bekræft den fejler**

Run: `npx vitest run tests/storage.test.ts`
Expected: FAIL — import kan ikke resolves.

- [ ] **Step 3: Skriv implementeringen**

```ts
// src/core/storage.ts
export function getJSON<T>(key: string, fallback: T, store: Storage = localStorage): T {
  try {
    const raw = store.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setJSON<T>(key: string, value: T, store: Storage = localStorage): void {
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    /* ignorér quota-fejl */
  }
}
```

- [ ] **Step 4: Kør testen og bekræft den består**

Run: `npx vitest run tests/storage.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/storage.ts tests/storage.test.ts
git commit -m "feat(core): add localStorage JSON wrapper"
```

---

## Task 7: Service — fremgang (niveauer, trofæer, samling)

**Files:**
- Create: `src/services/progress.ts`, `tests/progress.test.ts`

- [ ] **Step 1: Skriv den fejlende test**

```ts
// tests/progress.test.ts
import { describe, it, expect } from 'vitest';
import { defaultState, recordCorrect, owlRank } from '../src/services/progress';

describe('recordCorrect', () => {
  it('tæller rigtige svar op uden belønning før tærsklen', () => {
    const r = recordCorrect(defaultState(), 1);
    expect(r.state.correctByLevel[1]).toBe(1);
    expect(r.newTrophies).toEqual([]);
    expect(r.leveledUp).toBe(false);
  });

  it('giver trofæ, dino og level-up ved 5 rigtige', () => {
    let res = recordCorrect(defaultState(), 1);
    for (let i = 0; i < 4; i++) res = recordCorrect(res.state, 1);
    expect(res.state.correctByLevel[1]).toBe(5);
    expect(res.newTrophies).toContain('lvl1-5');
    expect(res.unlockedDino).toBe('dino-1');
    expect(res.leveledUp).toBe(true);
    expect(res.state.level).toBe(2);
  });

  it('går ikke op over niveau 4', () => {
    const state = { level: 4 as const, correctByLevel: { 1: 0, 2: 0, 3: 0, 4: 4 }, trophies: [], collection: [] };
    const res = recordCorrect(state, 4);
    expect(res.state.level).toBe(4);
    expect(res.leveledUp).toBe(false);
  });
});

describe('owlRank', () => {
  it('svarer til niveauet', () => {
    expect(owlRank({ ...defaultState(), level: 3 })).toBe(3);
  });
});
```

- [ ] **Step 2: Kør testen og bekræft den fejler**

Run: `npx vitest run tests/progress.test.ts`
Expected: FAIL — import kan ikke resolves.

- [ ] **Step 3: Skriv implementeringen**

```ts
// src/services/progress.ts
import type { ClockLevel } from '../domain/clock-levels';
import { getJSON, setJSON } from '../core/storage';

const KEY = 'rl.progress.v1';
const THRESHOLD = 5; // rigtige svar pr. niveau før trofæ + level-up

export interface ProgressState {
  level: ClockLevel;
  correctByLevel: Record<ClockLevel, number>;
  trophies: string[];
  collection: string[];
}

export interface RecordResult {
  state: ProgressState;
  newTrophies: string[];
  unlockedDino: string | null;
  leveledUp: boolean;
}

export function defaultState(): ProgressState {
  return { level: 1, correctByLevel: { 1: 0, 2: 0, 3: 0, 4: 0 }, trophies: [], collection: [] };
}

export function load(store: Storage = localStorage): ProgressState {
  const s = getJSON<ProgressState>(KEY, defaultState(), store);
  const base = defaultState();
  return {
    ...base,
    ...s,
    correctByLevel: { ...base.correctByLevel, ...(s.correctByLevel ?? {}) },
  };
}

export function save(state: ProgressState, store: Storage = localStorage): void {
  setJSON(KEY, state, store);
}

export function recordCorrect(state: ProgressState, level: ClockLevel): RecordResult {
  const next: ProgressState = {
    ...state,
    correctByLevel: { ...state.correctByLevel },
    trophies: [...state.trophies],
    collection: [...state.collection],
  };
  next.correctByLevel[level] = (next.correctByLevel[level] ?? 0) + 1;
  const count = next.correctByLevel[level];

  const newTrophies: string[] = [];
  let unlockedDino: string | null = null;
  let leveledUp = false;

  if (count % THRESHOLD === 0) {
    const trophyId = `lvl${level}-${count}`;
    newTrophies.push(trophyId);
    next.trophies.push(trophyId);
    unlockedDino = `dino-${next.collection.length + 1}`;
    next.collection.push(unlockedDino);
    if (count === THRESHOLD && level < 4) {
      next.level = (level + 1) as ClockLevel;
      leveledUp = true;
    }
  }
  return { state: next, newTrophies, unlockedDino, leveledUp };
}

export function owlRank(state: ProgressState): number {
  return state.level; // 1..4
}
```

- [ ] **Step 4: Kør testen og bekræft den består**

Run: `npx vitest run tests/progress.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/progress.ts tests/progress.test.ts
git commit -m "feat(progress): add level, trophy and collection tracking"
```

---

## Task 8: Service — lyd (tale + bløde toner + mute)

**Files:**
- Create: `src/services/audio.ts`, `tests/audio.test.ts`

- [ ] **Step 1: Skriv den fejlende test**

```ts
// tests/audio.test.ts
import { describe, it, expect, vi } from 'vitest';
import { AudioService, type Speaker, type TonePlayer } from '../src/services/audio';

function makeFakes() {
  const speaker: Speaker = { speak: vi.fn(), cancel: vi.fn() };
  const tone: TonePlayer = vi.fn();
  return { speaker, tone };
}

describe('AudioService', () => {
  it('taler når den ikke er muted', () => {
    const { speaker, tone } = makeFakes();
    new AudioService(speaker, tone).speak('halv fire');
    expect(speaker.speak).toHaveBeenCalledWith('halv fire', 'da-DK');
  });

  it('er tavs når den er muted', () => {
    const { speaker, tone } = makeFakes();
    const audio = new AudioService(speaker, tone);
    audio.setMuted(true);
    audio.speak('tre');
    audio.playCorrect();
    expect(speaker.speak).not.toHaveBeenCalled();
    expect(tone).not.toHaveBeenCalled();
    expect(speaker.cancel).toHaveBeenCalled();
  });

  it('spiller en blød bekræftelse når den ikke er muted', () => {
    const { speaker, tone } = makeFakes();
    new AudioService(speaker, tone).playCorrect();
    expect(tone).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Kør testen og bekræft den fejler**

Run: `npx vitest run tests/audio.test.ts`
Expected: FAIL — import kan ikke resolves.

- [ ] **Step 3: Skriv implementeringen**

```ts
// src/services/audio.ts
export interface Speaker {
  speak(text: string, lang: string): void;
  cancel(): void;
}

export type TonePlayer = (freqHz: number, durationMs: number) => void;

/** Tale via browserens speechSynthesis (no-op uden for browseren). */
export class BrowserSpeaker implements Speaker {
  speak(text: string, lang: string): void {
    if (typeof speechSynthesis === 'undefined') return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.95;
    const voice = speechSynthesis.getVoices().find((v) => v.lang?.startsWith('da'));
    if (voice) u.voice = voice;
    speechSynthesis.speak(u);
  }
  cancel(): void {
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  }
}

/** Blød tone via WebAudio (no-op uden for browseren). */
export const browserTone: TonePlayer = (freqHz, durationMs) => {
  const Ctx = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext });
  const AC = Ctx.AudioContext ?? Ctx.webkitAudioContext;
  if (!AC) return;
  const ctx = new AC();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freqHz;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + durationMs / 1000);
};

export class AudioService {
  private muted = false;

  constructor(
    private speaker: Speaker = new BrowserSpeaker(),
    private tone: TonePlayer = browserTone,
  ) {}

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) this.speaker.cancel();
  }
  isMuted(): boolean {
    return this.muted;
  }

  /** Siger en tekst på dansk. */
  speak(text: string): void {
    if (this.muted) return;
    this.speaker.speak(text, 'da-DK');
  }

  /** Blød, to-tonet bekræftelse — ingen fanfare. */
  playCorrect(): void {
    if (this.muted) return;
    this.tone(523, 140); // C5
    this.tone(659, 160); // E5
  }
}
```

- [ ] **Step 4: Kør testen og bekræft den består**

Run: `npx vitest run tests/audio.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/audio.ts tests/audio.test.ts
git commit -m "feat(audio): add Danish speech and soft tone service"
```

---

## Task 9: UI — ugle-maskot efter rang

**Files:**
- Create: `src/ui/mascot.ts`, `tests/mascot.test.ts`

- [ ] **Step 1: Skriv den fejlende test**

```ts
// tests/mascot.test.ts
import { describe, it, expect } from 'vitest';
import { owlSvg } from '../src/ui/mascot';

describe('owlSvg', () => {
  it('returnerer et svg-element', () => {
    expect(owlSvg(1)).toContain('<svg');
  });
  it('har ingen krone på rang 1', () => {
    expect(owlSvg(1)).not.toContain('id="crown"');
  });
  it('får en krone fra rang 2', () => {
    expect(owlSvg(2)).toContain('id="crown"');
  });
});
```

- [ ] **Step 2: Kør testen og bekræft den fejler**

Run: `npx vitest run tests/mascot.test.ts`
Expected: FAIL — import kan ikke resolves.

- [ ] **Step 3: Skriv implementeringen**

```ts
// src/ui/mascot.ts
/** Tegner uglen "Ugo". Fra rang 2 får den en lille krone. */
export function owlSvg(rank = 1, size = 64): string {
  const crown = rank >= 2
    ? '<path id="crown" d="M22 14 l18 -8 l18 8 l-4 6 l-28 0 z" fill="#CBA15A"/>'
    : '';
  return `<svg width="${size}" height="${size * 1.1}" viewBox="0 0 80 90" aria-hidden="true">
    ${crown}
    <path d="M26 20 L32 6 L40 20 Z" fill="#8FB0A4"/>
    <path d="M54 20 L48 6 L40 20 Z" fill="#8FB0A4"/>
    <ellipse cx="40" cy="50" rx="30" ry="36" fill="#A6C0B5"/>
    <ellipse cx="40" cy="58" rx="19" ry="26" fill="#F1EAD9"/>
    <circle cx="29" cy="42" r="12" fill="#FBF8F1"/>
    <circle cx="51" cy="42" r="12" fill="#FBF8F1"/>
    <circle cx="29" cy="44" r="5" fill="#4A4A45"/>
    <circle cx="51" cy="44" r="5" fill="#4A4A45"/>
    <circle cx="31" cy="42" r="1.6" fill="#fff"/>
    <circle cx="53" cy="42" r="1.6" fill="#fff"/>
    <path d="M40 48 L35 54 L45 54 Z" fill="#E0A87E"/>
    <ellipse cx="14" cy="54" rx="6" ry="15" fill="#8FB0A4"/>
    <ellipse cx="66" cy="54" rx="6" ry="15" fill="#8FB0A4"/>
  </svg>`;
}
```

- [ ] **Step 4: Kør testen og bekræft den består**

Run: `npx vitest run tests/mascot.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/mascot.ts tests/mascot.test.ts
git commit -m "feat(ui): add owl mascot with rank crown"
```

---

## Task 10: UI — delte ikoner (dino, cykel, trofæ)

**Files:**
- Create: `src/ui/icons.ts`

- [ ] **Step 1: Skriv ikon-modulet** (ingen test — rene SVG-strenge)

```ts
// src/ui/icons.ts
export function dinoSvg(color = '#9DB89A', size = 56): string {
  return `<svg width="${size}" height="${size * 0.8}" viewBox="0 0 100 80" aria-hidden="true">
    <path d="M22 52 Q8 50 4 62" stroke="${color}" stroke-width="9" fill="none" stroke-linecap="round"/>
    <ellipse cx="50" cy="52" rx="30" ry="16" fill="${color}"/>
    <path d="M68 50 Q80 44 80 26 Q80 14 73 12" stroke="${color}" stroke-width="12" fill="none" stroke-linecap="round"/>
    <circle cx="74" cy="14" r="8" fill="${color}"/>
    <circle cx="77" cy="12" r="1.6" fill="#4A4A45"/>
    <rect x="36" y="62" width="8" height="14" rx="4" fill="${color}"/>
    <rect x="58" y="62" width="8" height="14" rx="4" fill="${color}"/>
  </svg>`;
}

export function bikeSvg(color = '#9AB0C4', frame = '#C99A78', size = 56): string {
  return `<svg width="${size}" height="${size * 0.7}" viewBox="0 0 100 70" aria-hidden="true">
    <circle cx="24" cy="48" r="16" fill="none" stroke="${color}" stroke-width="4"/>
    <circle cx="76" cy="48" r="16" fill="none" stroke="${color}" stroke-width="4"/>
    <path d="M24 48 L46 48 L60 26 L40 26 M46 48 L60 26 M60 26 L76 48" stroke="${frame}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M36 26 l8 0" stroke="#4A4A45" stroke-width="3" stroke-linecap="round"/>
    <path d="M58 22 l8 0" stroke="#4A4A45" stroke-width="3" stroke-linecap="round"/>
    <circle cx="46" cy="48" r="3" fill="#4A4A45"/>
  </svg>`;
}

export function trophySvg(color = '#CBA15A', size = 28): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8 4 h8 v4 a4 4 0 0 1 -8 0 z" fill="${color}"/>
    <path d="M8 5.2 h-2.6 a2.4 2.4 0 0 0 2.6 4" stroke="${color}" stroke-width="1.4" fill="none"/>
    <path d="M16 5.2 h2.6 a2.4 2.4 0 0 1 -2.6 4" stroke="${color}" stroke-width="1.4" fill="none"/>
    <rect x="11" y="12" width="2" height="4" fill="${color}"/>
    <rect x="8" y="16" width="8" height="2.4" rx="1" fill="${color}"/>
  </svg>`;
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: ingen fejl.

- [ ] **Step 3: Commit**

```bash
git add src/ui/icons.ts
git commit -m "feat(ui): add shared dino, bike and trophy icons"
```

---

## Task 11: Core — sikre DOM-hjælpere

Bygger alle UI-elementer uden `innerHTML`. `h` opretter elementer, `svgEl` parser betroet SVG-markup til en node, `empty` tømmer et element.

**Files:**
- Create: `src/core/dom.ts`, `tests/dom.test.ts`

- [ ] **Step 1: Skriv den fejlende test**

```ts
// tests/dom.test.ts
import { describe, it, expect, vi } from 'vitest';
import { h, svgEl, empty } from '../src/core/dom';

describe('h', () => {
  it('sætter klasse, tekst og klik-handler', () => {
    const fn = vi.fn();
    const el = h('button', { class: 'x', onclick: fn }, ['Hej']);
    expect(el.className).toBe('x');
    expect(el.textContent).toBe('Hej');
    el.click();
    expect(fn).toHaveBeenCalled();
  });
  it('sætter attributter som data-*', () => {
    const el = h('div', { 'data-id': 'klokken' });
    expect(el.getAttribute('data-id')).toBe('klokken');
  });
});

describe('svgEl', () => {
  it('parser svg-markup til et svg-element', () => {
    const node = svgEl('<svg><circle/></svg>');
    expect(node.tagName.toLowerCase()).toBe('svg');
  });
});

describe('empty', () => {
  it('fjerner alle børn', () => {
    const d = h('div', {}, ['a', h('span')]);
    empty(d);
    expect(d.childNodes.length).toBe(0);
  });
});
```

- [ ] **Step 2: Kør testen og bekræft den fejler**

Run: `npx vitest run tests/dom.test.ts`
Expected: FAIL — import kan ikke resolves.

- [ ] **Step 3: Skriv implementeringen**

```ts
// src/core/dom.ts
type Child = Node | string;
type Props = Record<string, unknown>;

/** Opretter et element, sætter class/attributter/handlers og tilføjer børn. */
export function h(tag: string, props: Props = {}, children: Child[] = []): HTMLElement {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null) continue;
    if (k === 'class') el.className = String(v);
    else if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    } else {
      el.setAttribute(k, String(v));
    }
  }
  for (const c of children) el.append(typeof c === 'string' ? document.createTextNode(c) : c);
  return el;
}

/** Parser BETROET SVG-markup (aldrig brugerinput) til et DOM-element. */
export function svgEl(markup: string): Element {
  const doc = new DOMParser().parseFromString(`<body>${markup}</body>`, 'text/html');
  return document.importNode(doc.body.firstElementChild as Element, true);
}

/** Tømmer et element for børn. */
export function empty(el: Element): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}
```

- [ ] **Step 4: Kør testen og bekræft den består**

Run: `npx vitest run tests/dom.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/dom.ts tests/dom.test.ts
git commit -m "feat(core): add safe DOM helpers (h, svgEl, empty)"
```

---

## Task 12: Aktivitet — render af analogt ur

**Files:**
- Create: `src/activities/clock/clock-face.ts`

- [ ] **Step 1: Skriv ur-render-funktionen** (returnerer SVG-streng; verificeres i dev-server)

```ts
// src/activities/clock/clock-face.ts
import { hourHandAngle, minuteHandAngle } from '../../domain/clock-math';

const NUMBERS: Array<{ n: number; x: number; y: number }> = [
  { n: 12, x: 100, y: 42 }, { n: 1, x: 131, y: 50 }, { n: 2, x: 154, y: 69 },
  { n: 3, x: 162, y: 100 }, { n: 4, x: 154, y: 131 }, { n: 5, x: 131, y: 150 },
  { n: 6, x: 100, y: 158 }, { n: 7, x: 69, y: 150 }, { n: 8, x: 46, y: 131 },
  { n: 9, x: 38, y: 100 }, { n: 10, x: 46, y: 69 }, { n: 11, x: 69, y: 50 },
];

export function clockFaceSvg(hours: number, minutes: number, size = 200): string {
  const ha = hourHandAngle(hours, minutes);
  const ma = minuteHandAngle(minutes);
  const numbers = NUMBERS.map(
    ({ n, x, y }) =>
      `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-family="Georgia, serif" font-size="16" fill="#4A4A45">${n}</text>`,
  ).join('');

  return `<svg width="${size}" height="${size}" viewBox="0 0 200 200" role="img" aria-label="analogt ur">
    <circle cx="100" cy="100" r="86" fill="#FBF8F1" stroke="#A8C3B8" stroke-width="6"/>
    ${numbers}
    <line x1="100" y1="100" x2="100" y2="40" stroke="#4A4A45" stroke-width="4" stroke-linecap="round" transform="rotate(${ma} 100 100)"/>
    <line x1="100" y1="100" x2="100" y2="58" stroke="#C98A6B" stroke-width="6" stroke-linecap="round" transform="rotate(${ha} 100 100)"/>
    <circle cx="100" cy="100" r="5" fill="#4A4A45"/>
  </svg>`;
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: ingen fejl.

- [ ] **Step 3: Commit**

```bash
git add src/activities/clock/clock-face.ts
git commit -m "feat(clock): add analog clock face rendering"
```

---

## Task 13: Aktivitet — "Se klokken"

**Files:**
- Create: `src/activities/clock/read-mode.ts`, `tests/read-mode.test.ts`
- Modify: `src/styles/base.css`

- [ ] **Step 1: Skriv den fejlende test**

```ts
// tests/read-mode.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderReadMode } from '../src/activities/clock/read-mode';
import { AudioService } from '../src/services/audio';

function makeAudio() {
  return new AudioService({ speak: vi.fn(), cancel: vi.fn() }, vi.fn());
}

describe('renderReadMode', () => {
  it('viser 4 svarknapper', () => {
    const root = document.createElement('div');
    renderReadMode(root, 1, { audio: makeAudio(), rng: () => 0, onCorrect: vi.fn() });
    expect(root.querySelectorAll('.answer').length).toBe(4);
  });

  it('kalder onCorrect når det rigtige svar trykkes', () => {
    const root = document.createElement('div');
    const onCorrect = vi.fn();
    // rng=()=>0 => answer er den første tid (kl. 1, niveau 1 => label "Klokken 1")
    renderReadMode(root, 1, { audio: makeAudio(), rng: () => 0, onCorrect });
    const btn = Array.from(root.querySelectorAll<HTMLButtonElement>('.answer'))
      .find((b) => b.textContent === 'Klokken 1')!;
    btn.click();
    expect(onCorrect).toHaveBeenCalledWith(1);
  });

  it('kalder ikke onCorrect ved forkert svar', () => {
    const root = document.createElement('div');
    const onCorrect = vi.fn();
    renderReadMode(root, 1, { audio: makeAudio(), rng: () => 0, onCorrect });
    const wrong = Array.from(root.querySelectorAll<HTMLButtonElement>('.answer'))
      .find((b) => b.textContent !== 'Klokken 1')!;
    wrong.click();
    expect(onCorrect).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Kør testen og bekræft den fejler**

Run: `npx vitest run tests/read-mode.test.ts`
Expected: FAIL — import kan ikke resolves.

- [ ] **Step 3: Skriv implementeringen**

```ts
// src/activities/clock/read-mode.ts
import { pickQuestion, type ClockLevel, type ClockTime, type Rng } from '../../domain/clock-levels';
import { timeToDanish } from '../../domain/time-to-danish';
import { clockFaceSvg } from './clock-face';
import { owlSvg } from '../../ui/mascot';
import { h, svgEl, empty } from '../../core/dom';
import type { AudioService } from '../../services/audio';

export interface ReadModeDeps {
  audio: AudioService;
  rng: Rng;
  onCorrect: (level: ClockLevel) => void;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Niveau 1 viser cifferform ("Klokken 3"), højere niveauer viser frasen. */
function optionLabel(t: ClockTime, level: ClockLevel): string {
  if (level === 1) return `Klokken ${t.hours}`;
  return capitalize(timeToDanish(t.hours, t.minutes));
}

export function renderReadMode(container: HTMLElement, level: ClockLevel, deps: ReadModeDeps): void {
  const { answer, options } = pickQuestion(level, deps.rng);

  const owlRow = h('div', { class: 'owl-row' }, [
    svgEl(owlSvg(1, 56)),
    h('div', { class: 'speech' }, ['Hvad er klokken? 🔊']),
  ]);
  const clockWrap = h('div', { class: 'clock-wrap' }, [svgEl(clockFaceSvg(answer.hours, answer.minutes, 184))]);
  const questionZone = h('div', { class: 'question-zone' }, [owlRow, clockWrap]);

  const answersEl = h('div', { class: 'answers' });
  const answerZone = h('div', { class: 'answer-zone' }, [
    h('div', { class: 'answer-label' }, ['Tryk på det rigtige svar']),
    answersEl,
  ]);

  for (const opt of options) {
    const btn = h('button', { class: 'answer' }, [optionLabel(opt, level)]);
    btn.addEventListener('click', () => {
      const correct = opt.hours === answer.hours && opt.minutes === answer.minutes;
      if (correct) {
        deps.audio.speak(`Klokken er ${timeToDanish(answer.hours, answer.minutes)}`);
        deps.audio.playCorrect();
        btn.classList.add('answer--correct');
        deps.onCorrect(level);
      } else {
        btn.classList.add('answer--try');
        deps.audio.speak('Prøv igen');
      }
    });
    answersEl.append(btn);
  }

  empty(container);
  container.append(questionZone, answerZone);
}
```

- [ ] **Step 4: Kør testen og bekræft den består**

Run: `npx vitest run tests/read-mode.test.ts`
Expected: PASS.

- [ ] **Step 5: Tilføj styles for klokke-skærmen i `src/styles/base.css`**

```css
/* Klokke-aktivitet */
.question-zone { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.owl-row { display: flex; align-items: center; gap: 12px; align-self: flex-start; }
.speech {
  background: var(--white); border: 1px solid #E7E0D2; border-radius: var(--radius-lg);
  padding: 11px 18px; font-family: var(--font-head); font-size: 19px;
}
.clock-wrap { margin: 6px 0; }

.answer-zone {
  background: var(--white); border: 1px solid var(--border); border-top: 3px solid var(--clock);
  border-radius: var(--radius-md); padding: 14px 16px 16px; margin-top: 10px; box-shadow: var(--shadow-md);
}
.answer-label {
  text-align: center; margin-bottom: 10px; color: var(--text-muted);
  font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;
}
.answers { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; }
.answer {
  background: var(--surface-soft); border: 1.5px solid var(--border); border-radius: 13px;
  padding: 16px; font-family: var(--font-head); font-size: 19px; color: var(--text); min-height: var(--touch-min);
}
.answer--correct { background: #EAF1ED; border-color: var(--clock); }
.answer--try { border-color: var(--accent-warm); }
```

- [ ] **Step 6: Commit**

```bash
git add src/activities/clock/read-mode.ts tests/read-mode.test.ts src/styles/base.css
git commit -m "feat(clock): add 'read the clock' mode with 4 options"
```

---

## Task 14: Aktivitet — "Stil klokken"

**Files:**
- Create: `src/activities/clock/set-mode.ts`, `tests/set-mode.test.ts`
- Modify: `src/styles/base.css`

- [ ] **Step 1: Skriv den fejlende test**

```ts
// tests/set-mode.test.ts
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
```

- [ ] **Step 2: Kør testen og bekræft den fejler**

Run: `npx vitest run tests/set-mode.test.ts`
Expected: FAIL — import kan ikke resolves.

- [ ] **Step 3: Skriv implementeringen**

```ts
// src/activities/clock/set-mode.ts
import { LEVELS, type ClockLevel, type ClockTime, type Rng, timesForLevel } from '../../domain/clock-levels';
import { timeToDanish } from '../../domain/time-to-danish';
import { clockFaceSvg } from './clock-face';
import { owlSvg } from '../../ui/mascot';
import { h, svgEl, empty } from '../../core/dom';
import type { AudioService } from '../../services/audio';

export function stepHour(h: number, dir: 1 | -1): number {
  return ((h - 1 + dir + 12) % 12) + 1;
}

export function stepMinute(current: number, minutes: number[], dir: 1 | -1): number {
  const i = minutes.indexOf(current);
  const n = (i + dir + minutes.length) % minutes.length;
  return minutes[n];
}

export interface SetModeDeps {
  audio: AudioService;
  rng: Rng;
  onCorrect: (level: ClockLevel) => void;
}

function stepper(label: string, onMinus: () => void, onPlus: () => void): HTMLElement {
  const minus = h('button', { class: 'step' }, ['−']);
  minus.addEventListener('click', onMinus);
  const plus = h('button', { class: 'step' }, ['+']);
  plus.addEventListener('click', onPlus);
  return h('div', { class: 'stepper' }, [minus, h('span', {}, [label]), plus]);
}

export function renderSetMode(container: HTMLElement, level: ClockLevel, deps: SetModeDeps): void {
  const all = timesForLevel(level);
  const target: ClockTime = all[Math.floor(deps.rng() * all.length)];
  const minutes = LEVELS[level].minutes;
  let current: ClockTime = { hours: 6, minutes: minutes[0] };

  const clockWrap = h('div', { class: 'clock-wrap' });
  const redraw = () => {
    empty(clockWrap);
    clockWrap.append(svgEl(clockFaceSvg(current.hours, current.minutes, 184)));
  };

  const owlRow = h('div', { class: 'owl-row' }, [
    svgEl(owlSvg(1, 56)),
    h('div', { class: 'speech' }, [`Sæt den til ${timeToDanish(target.hours, target.minutes)} 🔊`]),
  ]);
  const questionZone = h('div', { class: 'question-zone' }, [owlRow, clockWrap]);

  const hourStepper = stepper(
    'Time',
    () => { current = { ...current, hours: stepHour(current.hours, -1) }; redraw(); },
    () => { current = { ...current, hours: stepHour(current.hours, 1) }; redraw(); },
  );
  const minuteStepper = stepper(
    'Minut',
    () => { current = { ...current, minutes: stepMinute(current.minutes, minutes, -1) }; redraw(); },
    () => { current = { ...current, minutes: stepMinute(current.minutes, minutes, 1) }; redraw(); },
  );

  const check = h('button', { class: 'check' }, ['Sådan!']);
  check.addEventListener('click', () => {
    if (current.hours === target.hours && current.minutes === target.minutes) {
      deps.audio.speak('Flot! Det er rigtigt');
      deps.audio.playCorrect();
      deps.onCorrect(level);
    } else {
      deps.audio.speak('Prøv igen');
    }
  });

  const answerZone = h('div', { class: 'answer-zone' }, [
    h('div', { class: 'answer-label' }, ['Stil viserne']),
    h('div', { class: 'steppers' }, [hourStepper, minuteStepper]),
    check,
  ]);

  empty(container);
  container.append(questionZone, answerZone);
  redraw();
  deps.audio.speak(`Sæt den til ${timeToDanish(target.hours, target.minutes)}`);
}
```

- [ ] **Step 4: Kør testen og bekræft den består**

Run: `npx vitest run tests/set-mode.test.ts`
Expected: PASS.

- [ ] **Step 5: Tilføj stepper-styles i `src/styles/base.css`**

```css
.steppers { display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px; }
.stepper { display: flex; align-items: center; justify-content: center; gap: 16px; font-family: var(--font-body); color: var(--text-muted); }
.step {
  width: 56px; height: 56px; border-radius: 50%; background: var(--surface-soft);
  border: 1.5px solid var(--border); font-size: 26px; color: var(--text);
}
.check {
  display: block; margin: 0 auto; background: var(--clock); color: #2F3A33;
  border-radius: var(--radius-md); padding: 14px 28px; font-family: var(--font-head); font-size: 19px; min-height: var(--touch-min);
}
```

- [ ] **Step 6: Commit**

```bash
git add src/activities/clock/set-mode.ts tests/set-mode.test.ts src/styles/base.css
git commit -m "feat(clock): add 'set the clock' mode with steppers"
```

---

## Task 15: Aktivitet — orkestrator (Activity-interface + gamification-stribe)

**Files:**
- Create: `src/core/activity.ts`, `src/activities/clock/clock-activity.ts`
- Modify: `src/styles/base.css`

- [ ] **Step 1: Opret `src/core/activity.ts`**

```ts
// src/core/activity.ts
export interface Activity {
  readonly id: string;
  mount(container: HTMLElement): void;
  unmount(): void;
}
```

- [ ] **Step 2: Opret `src/activities/clock/clock-activity.ts`**

```ts
// src/activities/clock/clock-activity.ts
import type { Activity } from '../../core/activity';
import { LEVELS, type ClockLevel } from '../../domain/clock-levels';
import { renderReadMode } from './read-mode';
import { renderSetMode } from './set-mode';
import { trophySvg } from '../../ui/icons';
import { h, svgEl, empty } from '../../core/dom';
import type { AudioService } from '../../services/audio';
import { load, save, recordCorrect, type ProgressState } from '../../services/progress';

export interface ClockActivityDeps {
  audio: AudioService;
  rng: () => number;
  onExit: () => void;
}

type Mode = 'read' | 'set';

export class ClockActivity implements Activity {
  readonly id = 'clock';
  private container: HTMLElement | null = null;
  private state: ProgressState = load();
  private mode: Mode = 'read';

  constructor(private deps: ClockActivityDeps) {}

  mount(container: HTMLElement): void {
    this.container = container;
    this.render();
  }

  unmount(): void {
    if (this.container) empty(this.container);
    this.container = null;
  }

  private render(): void {
    const c = this.container;
    if (!c) return;
    const level = this.state.level;

    const back = h('button', { class: 'back' }, ['‹ Hjem']);
    back.addEventListener('click', () => this.deps.onExit());
    const trophyCount = h('div', { class: 'trophy-count' }, [svgEl(trophySvg()), ` ${this.state.trophies.length}`]);
    const topbar = h('div', { class: 'topbar' }, [
      back,
      h('div', { class: 'level-pill' }, [`Niveau ${level} · ${LEVELS[level].label}`]),
      trophyCount,
    ]);

    const readBtn = h('button', { class: this.mode === 'read' ? 'on' : '' }, ['Se klokken']);
    readBtn.addEventListener('click', () => { this.mode = 'read'; this.render(); });
    const setBtn = h('button', { class: this.mode === 'set' ? 'on' : '' }, ['Stil klokken']);
    setBtn.addEventListener('click', () => { this.mode = 'set'; this.render(); });
    const modeSwitch = h('div', { class: 'mode-switch' }, [readBtn, setBtn]);

    const body = h('div', { class: 'activity-body' });
    const wrapper = h('div', { class: 'activity' }, [topbar, modeSwitch, body]);

    empty(c);
    c.append(wrapper);

    const deps = { audio: this.deps.audio, rng: this.deps.rng, onCorrect: (lvl: ClockLevel) => this.onCorrect(lvl) };
    if (this.mode === 'read') renderReadMode(body, level, deps);
    else renderSetMode(body, level, deps);
  }

  private onCorrect(level: ClockLevel): void {
    const res = recordCorrect(this.state, level);
    this.state = res.state;
    save(this.state);
    // Rolig opdatering: gentegn efter et kort øjeblik, så barnet ser sit rigtige svar først.
    window.setTimeout(() => this.render(), 1400);
  }
}
```

- [ ] **Step 3: Tilføj styles i `src/styles/base.css`**

```css
.activity { display: flex; flex-direction: column; gap: 12px; }
.topbar { display: flex; align-items: center; justify-content: space-between; }
.back { color: var(--text-muted); font-size: 16px; padding: 8px; }
.level-pill { background: var(--clock); color: #2F3A33; border-radius: 9px; padding: 4px 12px; font-size: 14px; }
.trophy-count { display: flex; align-items: center; gap: 4px; color: var(--text-muted); }
.mode-switch { display: flex; gap: 8px; justify-content: center; }
.mode-switch button {
  background: var(--surface-soft); border: 1px solid var(--border); border-radius: 999px;
  padding: 8px 18px; color: var(--text-muted); font-family: var(--font-body);
}
.mode-switch button.on { background: var(--clock); color: #2F3A33; border-color: var(--clock-dark); }
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: ingen fejl.

- [ ] **Step 5: Commit**

```bash
git add src/core/activity.ts src/activities/clock/clock-activity.ts src/styles/base.css
git commit -m "feat(clock): add activity orchestrator with mode switch and progress"
```

---

## Task 16: UI — forside

**Files:**
- Create: `src/ui/home.ts`
- Modify: `src/styles/base.css`

- [ ] **Step 1: Opret `src/ui/home.ts`**

```ts
// src/ui/home.ts
import { owlSvg } from './mascot';
import { trophySvg } from './icons';
import { h, svgEl, empty } from '../core/dom';
import { load, owlRank } from '../services/progress';

export interface HomeDeps {
  onSelect: (activityId: string) => void;
  onParent: () => void;
}

const TILES = [
  { id: 'clock', label: 'Klokken', color: 'var(--clock)' },
  { id: 'letters', label: 'Bogstaver', color: 'var(--letters)' },
  { id: 'numbers', label: 'Tal', color: 'var(--numbers)' },
];

export function renderHome(container: HTMLElement, deps: HomeDeps): void {
  const state = load();

  const brand = h('div', { class: 'brand' }, [svgEl(owlSvg(owlRank(state), 44)), h('span', {}, ['Mine Lærespil'])]);
  const gear = h('button', { class: 'gear', 'aria-label': 'Forælder' }, ['⚙']);
  const trophies = h('div', { class: 'home-trophies' }, [svgEl(trophySvg()), ` ${state.trophies.length}`, gear]);
  const top = h('div', { class: 'home-top' }, [brand, trophies]);

  const tileEls = TILES.map((t) => {
    const tile = h('button', { class: 'tile home-tile', 'data-id': t.id, style: `background:${t.color}` }, [
      h('span', { class: 'tile-label' }, [t.label]),
    ]);
    tile.addEventListener('click', () => deps.onSelect(t.id));
    return tile;
  });
  const tiles = h('div', { class: 'tiles' }, tileEls);

  empty(container);
  container.append(h('div', { class: 'home' }, [top, tiles]));

  // Forælder-hjørne åbnes med tryk-og-hold (600 ms) for at undgå utilsigtede tryk.
  let timer: number | undefined;
  const start = () => { timer = window.setTimeout(() => deps.onParent(), 600); };
  const cancel = () => { if (timer) window.clearTimeout(timer); };
  gear.addEventListener('pointerdown', start);
  gear.addEventListener('pointerup', cancel);
  gear.addEventListener('pointerleave', cancel);
}
```

- [ ] **Step 2: Tilføj forside-styles i `src/styles/base.css`**

```css
.home { display: flex; flex-direction: column; gap: 20px; }
.home-top { display: flex; align-items: center; justify-content: space-between; }
.brand { display: flex; align-items: center; gap: 10px; font-family: var(--font-head); font-size: 20px; }
.home-trophies { display: flex; align-items: center; gap: 6px; color: var(--text-muted); }
.gear { opacity: 0.4; font-size: 18px; padding: 8px; }
.tiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.home-tile { flex-direction: column; min-height: 130px; }
.tile-label { font-family: var(--font-head); font-size: 20px; color: var(--text); }
@media (max-width: 560px) { .tiles { grid-template-columns: 1fr; } }
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: ingen fejl.

- [ ] **Step 4: Commit**

```bash
git add src/ui/home.ts src/styles/base.css
git commit -m "feat(ui): add home screen with activity tiles"
```

---

## Task 17: Forælder-hjørne

**Files:**
- Create: `src/parent/parent-corner.ts`
- Modify: `src/styles/base.css`

- [ ] **Step 1: Opret `src/parent/parent-corner.ts`**

```ts
// src/parent/parent-corner.ts
import { LEVELS, type ClockLevel } from '../domain/clock-levels';
import { h, empty } from '../core/dom';
import type { AudioService } from '../services/audio';
import { load, save, defaultState } from '../services/progress';

export interface ParentDeps {
  audio: AudioService;
  onClose: () => void;
}

export function renderParentCorner(container: HTMLElement, deps: ParentDeps): void {
  const state = load();

  const sound = h('input', { type: 'checkbox' }) as HTMLInputElement;
  sound.checked = !deps.audio.isMuted();
  sound.addEventListener('change', () => deps.audio.setMuted(!sound.checked));
  const soundRow = h('label', { class: 'row' }, [h('span', {}, ['Lyd']), sound]);

  const select = h('select') as HTMLSelectElement;
  ([1, 2, 3, 4] as ClockLevel[]).forEach((l) => {
    const opt = h('option', { value: String(l) }, [`${l} · ${LEVELS[l].label}`]) as HTMLOptionElement;
    if (state.level === l) opt.selected = true;
    select.append(opt);
  });
  select.addEventListener('change', () => save({ ...load(), level: Number(select.value) as ClockLevel }));
  const levelRow = h('div', { class: 'row' }, [h('span', {}, ['Niveau (klokken)']), select]);

  const reset = h('button', { class: 'reset' }, ['Nulstil fremgang']);
  reset.addEventListener('click', () => { save(defaultState()); deps.onClose(); });
  const close = h('button', { class: 'close' }, ['Luk']);
  close.addEventListener('click', () => deps.onClose());

  const card = h('div', { class: 'parent-card' }, [h('h2', {}, ['Forælder']), soundRow, levelRow, reset, close]);

  empty(container);
  container.append(h('div', { class: 'parent-overlay' }, [card]));
}
```

- [ ] **Step 2: Tilføj overlay-styles i `src/styles/base.css`**

```css
.parent-overlay {
  position: fixed; inset: 0; background: rgba(26, 26, 46, 0.35);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.parent-card {
  background: var(--white); border-radius: var(--radius-lg); padding: 22px;
  width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: 16px; box-shadow: var(--shadow-lg);
}
.parent-card .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.parent-card select { padding: 8px; border-radius: 8px; border: 1px solid var(--border); }
.parent-card .reset { color: var(--accent-warm); align-self: flex-start; }
.parent-card .close { background: var(--clock); color: #2F3A33; border-radius: var(--radius-md); padding: 12px; min-height: 48px; }
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: ingen fejl.

- [ ] **Step 4: Commit**

```bash
git add src/parent/parent-corner.ts src/styles/base.css
git commit -m "feat(parent): add parent corner with sound, level and reset"
```

---

## Task 18: App-skal — router og wiring

**Files:**
- Create: `src/core/router.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Opret `src/core/router.ts`**

```ts
// src/core/router.ts
import type { Activity } from './activity';
import { empty } from './dom';

export class Router {
  private current: Activity | null = null;

  constructor(private root: HTMLElement) {}

  showActivity(activity: Activity): void {
    this.reset();
    this.current = activity;
    activity.mount(this.root);
  }

  showView(render: (root: HTMLElement) => void): void {
    this.reset();
    render(this.root);
  }

  private reset(): void {
    if (this.current) { this.current.unmount(); this.current = null; }
    empty(this.root);
  }
}
```

- [ ] **Step 2: Erstat indholdet af `src/main.ts` med den fulde wiring**

```ts
// src/main.ts
import './styles/tokens.css';
import './styles/base.css';
import { Router } from './core/router';
import { AudioService } from './services/audio';
import { renderHome } from './ui/home';
import { renderParentCorner } from './parent/parent-corner';
import { ClockActivity } from './activities/clock/clock-activity';

const root = document.querySelector<HTMLDivElement>('#app')!;
const router = new Router(root);
const audio = new AudioService();
const rng = () => Math.random();

function goHome(): void {
  router.showView((el) =>
    renderHome(el, {
      onSelect: (id) => {
        if (id === 'clock') {
          router.showActivity(new ClockActivity({ audio, rng, onExit: goHome }));
        }
        // 'letters' og 'numbers' kommer i v2/v3.
      },
      onParent: openParent,
    }),
  );
}

function openParent(): void {
  const layer = document.createElement('div');
  document.body.append(layer);
  renderParentCorner(layer, {
    audio,
    onClose: () => { layer.remove(); goHome(); },
  });
}

goHome();
```

- [ ] **Step 3: Verificér hele flowet i dev-server**

Run: `npm run dev` (åbn URL'en)
Expected:
- Forsiden viser tre felter (Klokken, Bogstaver, Tal) + ugle + trofætæller.
- Klik "Klokken" → klokke-aktiviteten åbner med "Se klokken"/"Stil klokken".
- Vælg rigtigt svar → uglen siger klokken (hvis lyd til) og blød tone; skærmen gentegner efter ~1,4 s.
- Tryk-og-hold tandhjul → forælder-overlay; sluk lyd, skift niveau, luk.
- "‹ Hjem" → tilbage til forsiden.
Luk med Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add src/core/router.ts src/main.ts
git commit -m "feat(core): wire app shell with router, home and clock activity"
```

---

## Task 19: PWA — manifest, ikoner og offline

**Files:**
- Create: `public/logo.svg`, `pwa-assets.config.ts`
- Modify: `vite.config.ts`, `index.html`

- [ ] **Step 1: Opret `public/logo.svg` (uglen som ikon-kilde, fyldt baggrund)**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#F4F1EA"/>
  <g transform="translate(116 96) scale(3.5)">
    <path d="M26 20 L32 6 L40 20 Z" fill="#8FB0A4"/>
    <path d="M54 20 L48 6 L40 20 Z" fill="#8FB0A4"/>
    <ellipse cx="40" cy="50" rx="30" ry="36" fill="#A6C0B5"/>
    <ellipse cx="40" cy="58" rx="19" ry="26" fill="#F1EAD9"/>
    <circle cx="29" cy="42" r="12" fill="#FBF8F1"/>
    <circle cx="51" cy="42" r="12" fill="#FBF8F1"/>
    <circle cx="29" cy="44" r="5" fill="#4A4A45"/>
    <circle cx="51" cy="44" r="5" fill="#4A4A45"/>
    <path d="M40 48 L35 54 L45 54 Z" fill="#E0A87E"/>
  </g>
</svg>
```

- [ ] **Step 2: Opret `pwa-assets.config.ts`**

```ts
import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

export default defineConfig({
  preset: minimal2023Preset,
  images: ['public/logo.svg'],
});
```

- [ ] **Step 3: Generér ikoner**

Run: `npm run generate-icons`
Expected: PNG-filer oprettes i `public/` (bl.a. `pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon-180x180.png`, `maskable-icon-512x512.png`).

- [ ] **Step 4: Opdatér `vite.config.ts` med PWA-pluginnet**

```ts
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Mine Lærespil',
        short_name: 'Lærespil',
        description: 'Rolige lærespil — klokken, bogstaver og tal.',
        lang: 'da',
        theme_color: '#A8C3B8',
        background_color: '#F4F1EA',
        display: 'standalone',
        orientation: 'any',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
    }),
  ],
  test: { environment: 'jsdom', globals: true },
});
```

- [ ] **Step 5: Tilføj Apple-meta i `index.html`** (i `<head>`, efter title)

```html
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Mine Lærespil" />
    <meta name="theme-color" content="#A8C3B8" />
    <link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" />
```

- [ ] **Step 6: Byg og verificér PWA-output**

Run: `npm run build`
Expected: `dist/` indeholder `manifest.webmanifest`, `sw.js` (service worker) og ikon-PNG'er; ingen TypeScript-fejl.

Run: `npm run preview` (åbn URL'en)
Expected: appen kører fra build; i browserens DevTools → Application ses manifest + registreret service worker.

- [ ] **Step 7: Commit**

```bash
git add public/ pwa-assets.config.ts vite.config.ts index.html
git commit -m "feat(pwa): add manifest, icons and offline service worker"
```

---

## Task 20: Dokumentation og iPad-testtjekliste

**Files:**
- Create: `README.md`, `CHANGELOG.md`, `docs/ipad-test.md`

- [ ] **Step 1: Opret `README.md`**

````markdown
# Mine Lærespil (Rolige Lærespil)

Rolig, reklamefri læringsapp (PWA) til en dreng på 5-7 år — klokken, bogstaver og tal,
uden reklamer, pop-ups, blink eller sporing. Bygget med Vite + TypeScript.

## Tech stack
| Lag | Valg |
|-----|------|
| Build | Vite |
| Sprog | TypeScript (vanilla, ingen UI-framework) |
| Test | Vitest + jsdom |
| PWA | vite-plugin-pwa |
| Styling | Ren CSS med design-tokens |

## Quick start
```bash
npm install
npm run dev        # udvikling
npm test           # kør alle tests
npm run build      # produktion (dist/)
npm run preview    # kør produktions-build lokalt
```

## Funktioner (v1)
- Forside med tre aktiviteter (Klokken aktiv; Bogstaver/Tal kommer i v2/v3)
- Klokken: "Se klokken" og "Stil klokken", dansk progression (hele → halve → kvarter → 5-min)
- Rolig dansk stemme + bløde toner (kan slås fra)
- Rolig gamification: niveauer, trofæer, uglens rang, dino-samling
- Forælder-hjørne (tryk-og-hold): lyd, niveau, nulstil
- Virker offline, kan lægges på iPad'ens hjemmeskærm

## Version
v0.1.0 — se [CHANGELOG.md](CHANGELOG.md).
````

- [ ] **Step 2: Opret `CHANGELOG.md`**

```markdown
# Changelog

Formatet følger [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
og projektet bruger [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-06-09

### Added
- Forside med tre aktivitetsfelter og rolig gamification-visning
- Klokke-aktivitet: "Se klokken" (4 svar) og "Stil klokken" (steppers)
- Dansk tid-til-tekst (hele, halve, kvarter, fem-minutter)
- Niveauer, trofæer, uglens rang og dino-samling (gemt lokalt)
- Dansk tale + bløde toner med mute
- Forælder-hjørne (lyd, niveau, nulstil)
- PWA: manifest, ikoner og offline-understøttelse
```

- [ ] **Step 3: Opret `docs/ipad-test.md`**

```markdown
# Manuel iPad-test

1. Host `dist/` på HTTPS (fx Cloudflare Pages / Netlify / GitHub Pages).
2. Åbn URL'en i Safari på iPad'en.
3. Del → "Føj til hjemmeskærm" → bekræft ikon og navn ("Mine Lærespil").
4. Åbn fra hjemmeskærmen: skal starte i fuldskærm uden Safari-knapper.
5. Aktivér flytilstand → appen skal stadig åbne og virke (offline).
6. Tjek lyd: første tryk skal udløse dansk tale; sluk lyd i forælder-hjørnet.
7. Tjek trykflader: knapper er nemme at ramme; intet kan klikkes "væk".
```

- [ ] **Step 4: Kør den fulde testpakke en sidste gang**

Run: `npm test`
Expected: alle tests PASS.

Run: `npm run build`
Expected: build lykkes uden fejl.

- [ ] **Step 5: Commit**

```bash
git add README.md CHANGELOG.md docs/ipad-test.md
git commit -m "docs: add README, changelog and iPad test checklist"
```

---

## Self-Review (udført under planlægningen)

**Spec-dækning:**
- Rolige principper → tokens/CSS (Task 2), ingen netværk/reklamer i koden, mute (Task 8/17). ✓
- Platform/PWA/offline → Task 19. ✓
- Forside + 3 felter → Task 16. ✓
- Klokken (Se/Stil, dansk progression, 4 svar) → Task 3, 12, 13, 14, 15. ✓
- Lyd (dansk stemme + bløde lyde + mute) → Task 8, brugt i 13/14. ✓
- Maskot/motiver (ugle, dino, cykel) → Task 9, 10; dino-samling i progress (Task 7). ✓
- Rolig gamification (niveauer, trofæer, samling, uglens rang) → Task 7, vist i 15/16. ✓
- Forælder-hjørne → Task 17. ✓
- Teknik (Vite + TS + ren CSS + PWA, ingen innerHTML) → Task 1, 2, 11, 19. ✓
- Test → Task 3-9, 11, 13, 14. ✓
- Bogstaver/Tal = v2/v3 (uden for scope) → felter findes, men ikke aktive. ✓

**Type-konsistens:** `ClockLevel`, `ClockTime`, `Rng` (clock-levels) bruges ens i read-mode/set-mode/clock-activity. `ProgressState`/`RecordResult` (progress) bruges i clock-activity. `Activity` (core) implementeres af `ClockActivity` og bruges af `Router`. `AudioService.speak/playCorrect/setMuted/isMuted` bruges konsistent. `onCorrect(level)` har samme signatur i begge modes. UI bruger samme `h`/`svgEl`/`empty` fra Task 11. ✓

**Placeholder-scan:** Ingen TBD/TODO; al kode er konkret. Ingen brug af `innerHTML`. Cykel-motiv leveres som ikon (Task 10) men er ikke et selvstændigt spor i v1 — bevidst afgrænset (nævnt her, ikke et hul). ✓

---

## Næste skridt efter v1
- v2: Bogstaver & ord (genbruger app-skal, `Activity`-interface, audio, progress).
- v3: Tal & tælle (dino-tælling).
- Evt. udvidelse af "Stil klokken" med træk-i-viser-interaktion.
- Valg af hosting + deployment (jf. spec §3).
```
