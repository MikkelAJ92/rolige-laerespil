# Alfred lærer klokken — adoptér React-appen (v0.5.0) Implementeringsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gør brugerens React-klokkespil ("Alfred lærer klokken") til den deployede app i `rolige-laerespil` — med gemt fremgang, offline/installerbar, opdelt i moduler + TypeScript + Tailwind — på samme URL.

**Architecture:** Repoet skiftes fra vanilla-TS til **Vite + React 18 + TypeScript + Tailwind v4** PWA. Den verbatim spil-logik og de visuelle dele kopieres fra den committede `docs/reference/alfred-original.jsx` (konverteret til TS) og deles i fokuserede moduler. Det eneste nye er **persistens** (localStorage), self-hostede fonte og tests. Den gamle vanilla-app fjernes fra `src/` (bevaret i git-historik).

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS v4 (@tailwindcss/vite), Vitest + jsdom, vite-plugin-pwa, @fontsource. Branch: `feat/alfred-app`.

**Kilde til verbatim kode:** `docs/reference/alfred-original.jsx` (allerede i repoet). Hvor planen siger "kopiér fra reference", menes: tag den nøjagtige JSX/SVG derfra og tilføj de angivne TS-typer — ret IKKE udseende eller spil-logik.

---

## Filstruktur (efter)

```
index.html                     # React-rod (#root → main.tsx), Alfred-titel + apple-meta
package.json, tsconfig.json, vite.config.ts, pwa-assets.config.ts
public/logo.svg                # Ugo-ikon (+ genererede PNG'er)
src/
  main.tsx                     # React-rod + fonte + index.css
  index.css                    # @import "tailwindcss" + @keyframes + .fredoka/.nunito
  App.tsx                      # menu + spil (forbruger persistens)
  domain/time.ts               # ren klokke-logik + typer
  lib/colors.ts                # shade()
  lib/persistence.ts           # loadProgress/saveProgress
  components/Owl.tsx           # Ugo
  components/Clock.tsx         # uret (læs + interaktiv)
  components/ui.tsx            # Btn, RoundBtn, Pill, StarRow, Cloud, Confetti
tests/
  time.test.ts
  persistence.test.ts
docs/reference/alfred-original.jsx   # bevaret reference
```
**Fjernes:** hele den gamle `src/` (activities, core, domain/clock-*, domain/words, domain/ranks, services, ui/*, parent, styles, main.ts) og alle gamle `tests/`.

---

## Task 1: Skift toolchain til React + TS + Tailwind, fjern den gamle app

Atomar "switch". Alle filer skrives/fjernes, derefter verificeres build + typecheck (ny test-pakke kommer fra Task 2; `test`-scriptet får `--passWithNoTests`, så `npm test` ikke fejler i mellemtiden). Ét commit.

**Files:** rewrite `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`; create `src/main.tsx`, `src/index.css`, `src/App.tsx` (midlertidig); delete old `src/**` + `tests/**`.

- [ ] **Step 1: Rewrite `package.json`**

```json
{
  "name": "rolige-laerespil",
  "version": "0.5.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run --passWithNoTests",
    "test:watch": "vitest",
    "generate-icons": "pwa-assets-generator"
  },
  "dependencies": {
    "@fontsource/fredoka": "^5.1.0",
    "@fontsource/nunito": "^5.1.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.6",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vite-pwa/assets-generator": "^0.2.6",
    "@vitejs/plugin-react": "^4.3.4",
    "jsdom": "^25.0.1",
    "tailwindcss": "^4.0.6",
    "typescript": "^5.6.3",
    "vite": "^5.4.10",
    "vite-plugin-pwa": "^0.21.1",
    "vitest": "^2.1.5"
  }
}
```

- [ ] **Step 2: Rewrite `tsconfig.json`**

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
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client", "vitest/globals"],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src/**/*", "tests/**/*", "*.config.ts"]
}
```

- [ ] **Step 3: Rewrite `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

declare const process: { env: Record<string, string | undefined> };

export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Alfred lærer klokken',
        short_name: 'Klokken',
        description: 'Lær klokken med uglen Ugo.',
        lang: 'da',
        theme_color: '#BFE6F7',
        background_color: '#BFE6F7',
        display: 'standalone',
        orientation: 'any',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'] },
    }),
  ],
  test: { environment: 'jsdom', globals: true },
});
```

- [ ] **Step 4: Rewrite `index.html`**

```html
<!DOCTYPE html>
<html lang="da">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>Alfred lærer klokken</title>
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Alfred lærer klokken" />
    <meta name="theme-color" content="#BFE6F7" />
    <link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Delete the old vanilla app + tests**

```bash
git rm -r src tests
```
(We recreate `src/` below; new tests come in Task 2-3.)

- [ ] **Step 6: Create `src/index.css`**

```css
@import "tailwindcss";

.fredoka { font-family: 'Fredoka', ui-rounded, system-ui, sans-serif; }
.nunito { font-family: 'Nunito', ui-rounded, system-ui, sans-serif; }

@keyframes floaty { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
@keyframes drift { from { transform: translateX(0); } to { transform: translateX(36px); } }
@keyframes pop { 0% { transform: scale(.8); } 60% { transform: scale(1.08); } 100% { transform: scale(1); } }
@keyframes shakey { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }
@keyframes fall { 0% { transform: translateY(-10px) rotate(0); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateY(420px) rotate(380deg); opacity: 0; } }
@keyframes softpulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
```

- [ ] **Step 7: Create `src/main.tsx`**

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 8: Create a temporary `src/App.tsx` placeholder (replaced in Task 5)**

```tsx
export default function App() {
  return <div className="nunito" style={{ padding: 24 }}>Alfred kommer snart …</div>;
}
```

- [ ] **Step 9: Install + verify**

Run: `npm install` → no errors.
Run: `npm run typecheck` → clean.
Run: `npm run build` → success (React + Tailwind bundle; `dist/` with manifest + service worker). Note: icon PNGs are regenerated in Task 6; if the build warns about missing icon assets it still completes — they're added later.
Run: `npm test` → passes (no tests yet, `--passWithNoTests`).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "build: switch repo to React + TS + Tailwind PWA (replaces vanilla app)"
```

---

## Task 2: Domæne — klokke-logik (ren, TypeScript)

**Files:** Create `src/domain/time.ts`, `tests/time.test.ts`

- [ ] **Step 1: Write `tests/time.test.ts` (failing)**

```ts
import { describe, it, expect } from 'vitest';
import { danishTime, snapMinute, makeOptions, randomTime, LEVELS, tKey } from '../src/domain/time';

describe('danishTime (eksakt som referencen)', () => {
  it('hele timer har klokken-præfiks', () => {
    expect(danishTime(3, 0)).toBe('klokken tre');
    expect(danishTime(12, 0)).toBe('klokken tolv');
  });
  it('kvarter og halve', () => {
    expect(danishTime(3, 15)).toBe('kvart over tre');
    expect(danishTime(3, 30)).toBe('halv fire');
    expect(danishTime(3, 45)).toBe('kvart i fire');
    expect(danishTime(12, 30)).toBe('halv et');
  });
  it('fem-minutter med time- og halv-anker', () => {
    expect(danishTime(3, 5)).toBe('fem minutter over tre');
    expect(danishTime(3, 20)).toBe('tyve minutter over tre');
    expect(danishTime(3, 25)).toBe('fem minutter i halv fire');
    expect(danishTime(3, 35)).toBe('fem minutter over halv fire');
    expect(danishTime(3, 40)).toBe('tyve minutter i fire');
    expect(danishTime(3, 55)).toBe('fem minutter i fire');
  });
});

describe('snapMinute', () => {
  it('runder til nærmeste tilladte minut for niveauet', () => {
    expect(snapMinute(13, 'kvarter')).toBe(15);
    expect(snapMinute(58, 'kvarter')).toBe(0); // wrap 60→0
    expect(snapMinute(20, 'halve')).toBe(30);
  });
});

describe('makeOptions', () => {
  it('giver 4 unikke muligheder inkl. svaret', () => {
    const ans = { h: 3, m: 30 };
    const opts = makeOptions(ans, 'kvarter');
    expect(opts).toHaveLength(4);
    expect(opts.some((o) => o.h === 3 && o.m === 30)).toBe(true);
    expect(new Set(opts.map(tKey)).size).toBe(4);
  });
});

describe('randomTime', () => {
  it('giver gyldig time og minut for niveauet', () => {
    for (let i = 0; i < 50; i++) {
      const t = randomTime('minutter');
      expect(t.h).toBeGreaterThanOrEqual(1);
      expect(t.h).toBeLessThanOrEqual(12);
      expect(LEVELS.minutter.minutes).toContain(t.m);
    }
  });
});
```

- [ ] **Step 2: Run → FAIL** — `npx vitest run tests/time.test.ts` (import unresolved).

- [ ] **Step 3: Create `src/domain/time.ts`** (logik verbatim fra referencen, med typer)

```ts
export type LevelKey = 'timer' | 'halve' | 'kvarter' | 'minutter';
export interface Time { h: number; m: number; }
export interface LevelDef { label: string; minutes: number[]; stars: number; desc: string; }

const HOUR_NAMES = ['tolv', 'et', 'to', 'tre', 'fire', 'fem', 'seks', 'syv', 'otte', 'ni', 'ti', 'elleve'];
export const hourName = (h: number): string => HOUR_NAMES[h % 12];
export const nextHourName = (h: number): string => HOUR_NAMES[(h + 1) % 12];

export const LEVELS: Record<LevelKey, LevelDef> = {
  timer: { label: 'Hele timer', minutes: [0], stars: 1, desc: 'fx „klokken tre“' },
  halve: { label: 'Halve timer', minutes: [0, 30], stars: 2, desc: 'hel og „halv“' },
  kvarter: { label: 'Kvarter', minutes: [0, 15, 30, 45], stars: 3, desc: '„kvart over / i“' },
  minutter: { label: 'Fem minutter', minutes: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55], stars: 4, desc: 'alle fem minutter' },
};

export function danishTime(h: number, m: number): string {
  switch (m) {
    case 0: return `klokken ${hourName(h)}`;
    case 5: return `fem minutter over ${hourName(h)}`;
    case 10: return `ti minutter over ${hourName(h)}`;
    case 15: return `kvart over ${hourName(h)}`;
    case 20: return `tyve minutter over ${hourName(h)}`;
    case 25: return `fem minutter i halv ${nextHourName(h)}`;
    case 30: return `halv ${nextHourName(h)}`;
    case 35: return `fem minutter over halv ${nextHourName(h)}`;
    case 40: return `tyve minutter i ${nextHourName(h)}`;
    case 45: return `kvart i ${nextHourName(h)}`;
    case 50: return `ti minutter i ${nextHourName(h)}`;
    case 55: return `fem minutter i ${nextHourName(h)}`;
    default: return `${hourName(h)} ${m}`;
  }
}

export const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
export const digital = (h: number, m: number): string => `${h}.${String(m).padStart(2, '0')}`;
export const tKey = (t: Time): string => `${t.h}:${t.m}`;
export const rand = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
export const randInt = (n: number): number => Math.floor(Math.random() * n);

export function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export function randomTime(level: LevelKey): Time {
  const mins = LEVELS[level].minutes;
  return { h: 1 + randInt(12), m: mins[randInt(mins.length)] };
}

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

export function snapMinute(m: number, level: LevelKey): number {
  const opts = LEVELS[level].minutes;
  let best = opts[0];
  let bd = 999;
  for (const o of opts) {
    const raw = Math.abs(m - o);
    const d = Math.min(raw, 60 - raw);
    if (d < bd) { bd = d; best = o; }
  }
  return best;
}

export const polar = (r: number, deg: number): { x: number; y: number } => {
  const rad = (deg * Math.PI) / 180;
  return { x: 100 + r * Math.sin(rad), y: 100 - r * Math.cos(rad) };
};

export const CORRECT = ['Flot, Alfred! 🌟', 'Sådan! 🎉', 'Du er en klokke-mester! ⭐', 'Helt rigtigt! 👏', 'Super, Alfred! 💫', 'Wow — du kan det! 🚀'];
export const WRONG = ['Ikke helt — prøv igen! 💪', 'Tæt på! Kig en gang til 👀', 'Hov, prøv igen, Alfred 🙂', 'Prøv lige igen — du kan godt! ✨'];
```

- [ ] **Step 4: Run → PASS** — `npx vitest run tests/time.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/domain/time.ts tests/time.test.ts
git commit -m "feat(time): add typed Danish clock domain logic"
```

---

## Task 3: Farver + persistens

**Files:** Create `src/lib/colors.ts`, `src/lib/persistence.ts`, `tests/persistence.test.ts`

- [ ] **Step 1: Create `src/lib/colors.ts`** (verbatim fra reference, typet)

```ts
// darken/lighten a hex color (amt -100..100)
export function shade(hex: string, amt: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + (amt / 100) * 255)));
  const r = f((num >> 16) & 255);
  const g = f((num >> 8) & 255);
  const b = f(num & 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
```

- [ ] **Step 2: Write `tests/persistence.test.ts` (failing)**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { loadProgress, saveProgress, defaultProgress } from '../src/lib/persistence';

describe('persistence', () => {
  beforeEach(() => localStorage.clear());

  it('gemmer og indlæser fremgang', () => {
    saveProgress({ stars: 7, trophies: 1, starRow: 2, level: 'kvarter', mode: 'set' });
    expect(loadProgress()).toEqual({ stars: 7, trophies: 1, starRow: 2, level: 'kvarter', mode: 'set' });
  });
  it('giver standard uden gemt data', () => {
    expect(loadProgress()).toEqual(defaultProgress());
  });
  it('giver standard ved ugyldig JSON', () => {
    localStorage.setItem('alfred.progress.v1', '{ikke json');
    expect(loadProgress()).toEqual(defaultProgress());
  });
  it('validerer ukendt level og mode', () => {
    localStorage.setItem('alfred.progress.v1', JSON.stringify({ stars: -5, trophies: 2, starRow: 9, level: 'xxx', mode: 'yyy' }));
    const p = loadProgress();
    expect(p.level).toBe('timer');
    expect(p.mode).toBe('read');
    expect(p.stars).toBe(0);   // negativt → 0
    expect(p.starRow).toBe(4); // klampet til 0-4
    expect(p.trophies).toBe(2);
  });
});
```

- [ ] **Step 3: Run → FAIL** — `npx vitest run tests/persistence.test.ts`.

- [ ] **Step 4: Create `src/lib/persistence.ts`**

```ts
import { LEVELS, type LevelKey } from '../domain/time';

const KEY = 'alfred.progress.v1';

export interface Progress {
  stars: number;
  trophies: number;
  starRow: number;
  level: LevelKey;
  mode: 'read' | 'set';
}

export function defaultProgress(): Progress {
  return { stars: 0, trophies: 0, starRow: 0, level: 'timer', mode: 'read' };
}

const num = (v: unknown, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER): number => {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
};

export function loadProgress(store: Storage = localStorage): Progress {
  const d = defaultProgress();
  try {
    const raw = store.getItem(KEY);
    if (raw == null) return d;
    const o = JSON.parse(raw) as Partial<Progress>;
    const level: LevelKey = (o.level && o.level in LEVELS ? o.level : d.level) as LevelKey;
    const mode: 'read' | 'set' = o.mode === 'set' ? 'set' : 'read';
    return {
      stars: num(o.stars, d.stars),
      trophies: num(o.trophies, d.trophies),
      starRow: num(o.starRow, d.starRow, 0, 4),
      level,
      mode,
    };
  } catch {
    return d;
  }
}

export function saveProgress(p: Progress, store: Storage = localStorage): void {
  try {
    store.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignorér quota-fejl */
  }
}
```

- [ ] **Step 5: Run → PASS** — `npx vitest run tests/persistence.test.ts`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/colors.ts src/lib/persistence.ts tests/persistence.test.ts
git commit -m "feat(persistence): persist progress to localStorage (robust)"
```

---

## Task 4: Komponenter (Owl, Clock, ui) — TS fra referencen

Kopiér JSX/SVG **verbatim** fra `docs/reference/alfred-original.jsx` og tilføj kun TS-typer + imports. Ret intet visuelt.

**Files:** Create `src/components/Owl.tsx`, `src/components/Clock.tsx`, `src/components/ui.tsx`

- [ ] **Step 1: Create `src/components/Owl.tsx`**
  - Kopiér `Owl`-funktionen (og dens indre `Eye`) verbatim fra referencen.
  - Tilføj øverst: `import React from 'react';`
  - Typer: `interface OwlProps { mood?: 'idle' | 'happy' | 'cheer' | 'sad' | 'think'; size?: number }` og `function Owl({ mood = 'idle', size = 96 }: OwlProps)`. Den indre `const Eye = ({ cx }: { cx: number }) => (...)`.
  - Eksportér: `export default Owl;` (eller `export function Owl`).

- [ ] **Step 2: Create `src/components/Clock.tsx`**
  - `import React, { useRef, useState } from 'react';`
  - `import { polar, snapMinute, type LevelKey, type Time } from '../domain/time';`
  - Kopiér `Clock`-funktionen verbatim. Typer:
    `interface ClockProps { h: number; m: number; interactive?: boolean; level?: LevelKey; onChange?: (t: Time) => void }`
    `function Clock({ h, m, interactive = false, level = 'timer', onChange }: ClockProps)`.
  - Interne refs/typer: `const svgRef = useRef<SVGSVGElement | null>(null);` `const dragRef = useRef<'minute' | 'hour' | null>(null);` `const [hourDrag, setHourDrag] = useState<number | null>(null);`. Pointer-handlere: parameter `e: React.PointerEvent<SVGSVGElement>`. `getAngle(e)` returnerer `{a:number; r:number}`.
  - Eksportér default.

- [ ] **Step 3: Create `src/components/ui.tsx`**
  - `import React from 'react';` + `import { shade } from '../lib/colors';`
  - Kopiér `Btn`, `RoundBtn`, `Pill`, `StarRow`, `Cloud`, `Confetti` verbatim. Typer:
    - `interface BtnProps { children: React.ReactNode; onClick?: () => void; color?: string; textColor?: string; disabled?: boolean; className?: string; style?: React.CSSProperties }`
    - `RoundBtn`: `{ children: React.ReactNode; onClick?: () => void; disabled?: boolean }`
    - `Pill`: `{ children: React.ReactNode }`
    - `StarRow`: `{ filled: number }`
    - `Cloud`: `{ style?: React.CSSProperties }`
    - `Confetti`: `{ big: boolean }`
  - Eksportér alle (named): `export { Btn, RoundBtn, Pill, StarRow, Cloud, Confetti };`

- [ ] **Step 4: Verify** — `npm run typecheck` → clean. (Komponenterne bruges først i Task 5, så ingen render-test endnu.)

- [ ] **Step 5: Commit**

```bash
git add src/components/Owl.tsx src/components/Clock.tsx src/components/ui.tsx
git commit -m "feat(ui): port Owl, Clock and UI components to TypeScript"
```

---

## Task 5: App.tsx — menu + spil + persistens

Erstat placeholder-`App.tsx` med den fulde app, adapteret fra referencens `App()` — **uændret spil/JSX**, men med disse ændringer: importér fra de nye moduler, fjern den inline `styleBlock` + `<style>` (flyttet til index.css) og Google Fonts `@import`, og wire persistens.

**Files:** Rewrite `src/App.tsx`

- [ ] **Step 1: Skriv `src/App.tsx`**
  1. Toppen:
     ```tsx
     import React, { useState, useRef, useEffect, useCallback } from 'react';
     import { LEVELS, danishTime, randomTime, makeOptions, snapMinute, cap, digital, tKey, rand, CORRECT, WRONG, type LevelKey, type Time } from './domain/time';
     import { shade } from './lib/colors';
     import { loadProgress, saveProgress } from './lib/persistence';
     import Owl from './components/Owl';
     import Clock from './components/Clock';
     import { Btn, RoundBtn, Pill, StarRow, Cloud, Confetti } from './components/ui';
     ```
  2. Kopiér resten af referencens `export default function App() { ... }` **verbatim**, MED disse præcise ændringer:
     - **Persistens-init** — erstat de fem rå `useState`-initialiseringer:
       ```tsx
       const [initial] = useState(loadProgress);
       const [screen, setScreen] = useState<'menu' | 'play'>('menu');
       const [mode, setMode] = useState<'read' | 'set'>(initial.mode);
       const [level, setLevel] = useState<LevelKey>(initial.level);
       ...
       const [stars, setStars] = useState(initial.stars);
       const [streak, setStreak] = useState(0);
       const [starRow, setStarRow] = useState(initial.starRow);
       const [trophies, setTrophies] = useState(initial.trophies);
       ```
       (øvrige `useState` som i referencen: `q`, `options`, `feedback`, `revealed`, `attempts`, `wrongPicks`, `msg`, `mood`, `setH`, `setM`, `burst`, `burstBig`, `showBurst`.)
     - **Typer på spil-state:** `useState<Time>({ h: 3, m: 0 })` for `q`; `useState<Time[]>([])` for `options`; `useState<'idle' | 'correct'>('idle')` for `feedback`; `useState<string[]>([])` for `wrongPicks`; `useState<'idle'|'happy'|'cheer'|'sad'|'think'>('idle')` for `mood`; `useRef<boolean>(false)` for `burstBig`.
     - **Gem-effekt** — tilføj efter de øvrige hooks:
       ```tsx
       useEffect(() => {
         saveProgress({ stars, trophies, starRow, level, mode });
       }, [stars, trophies, starRow, level, mode]);
       ```
     - **Fjern** `const styleBlock = ...` og `<style>{styleBlock}</style>` i `return` (animationer/fonte kommer nu fra `index.css`).
     - Alt andet (`handleCorrect`, `chooseOption`, `clearFb`, `incHour/decHour/incMin/decMin`, `checkSet`, `Menu`, `Play`, `return`-JSX) kopieres **uændret** fra referencen.

- [ ] **Step 2: Verify**

Run: `npm run typecheck` → clean.
Run: `npm run build` → success.
Manuelt (valgfrit): `npm run dev` → spil et niveau, saml 5 stjerner → pokal; genindlæs siden → stjerner/pokaler/niveau **huskes**.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(app): wire menu+game with persisted progress"
```

---

## Task 6: PWA-ikon (Ugo) + ikon-generering

**Files:** Replace `public/logo.svg`; keep `pwa-assets.config.ts`; regenerate icons.

- [ ] **Step 1: Replace `public/logo.svg`** (Ugo på lys himmel-baggrund — enkelt ikon-venligt motiv)

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#BFE6F7"/>
  <g transform="translate(136 120) scale(2.0)">
    <path d="M40 30 L31 12 L53 26 Z" fill="#B5732E"/>
    <path d="M80 30 L89 12 L67 26 Z" fill="#B5732E"/>
    <ellipse cx="60" cy="68" rx="41" ry="46" fill="#B5732E"/>
    <ellipse cx="60" cy="78" rx="27" ry="32" fill="#FCEFD3"/>
    <circle cx="45" cy="58" r="15" fill="#FFFFFF" stroke="#8A551F" stroke-width="1.5"/>
    <circle cx="75" cy="58" r="15" fill="#FFFFFF" stroke="#8A551F" stroke-width="1.5"/>
    <circle cx="45" cy="58" r="7" fill="#3A2A1A"/>
    <circle cx="75" cy="58" r="7" fill="#3A2A1A"/>
    <path d="M60 66 L53 73 L67 73 Z" fill="#F2A03D" stroke="#8A551F" stroke-width="0.8"/>
  </g>
</svg>
```

- [ ] **Step 2: Generate icons** — Run: `npm run generate-icons`
Expected: `public/pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png` (+ favicon) opdateres med Ugo.

- [ ] **Step 3: Verify** — `npm run build` → success; `dist/` har manifest (navn "Alfred lærer klokken") + service worker + de nye ikoner.

- [ ] **Step 4: Commit**

```bash
git add public/
git commit -m "feat(pwa): Ugo app icon"
```

---

## Task 7: Dokumentation (v0.5.0)

**Files:** Modify `README.md`, `CHANGELOG.md`

- [ ] **Step 1: Rewrite `README.md`** så det matcher den nye app:

```markdown
# Alfred lærer klokken

Et roligt, reklamefrit klokke-spil (PWA) til børn — læs uret og sæt viserne, med uglen Ugo.
Bygget med Vite + React + TypeScript + Tailwind. Husker fremgang (stjerner, pokaler, niveau) lokalt.

## Tech stack
| Lag | Valg |
|-----|------|
| Build | Vite |
| UI | React 18 + TypeScript |
| Styling | Tailwind CSS v4 |
| Test | Vitest + jsdom |
| PWA | vite-plugin-pwa (offline + hjemmeskærm) |

## Quick start
```bash
npm install
npm run dev
npm test
npm run build
npm run preview
```

## Funktioner
- To spil: "Hvad er klokken?" (læs uret) og "Sæt viserne" (træk eller ＋/−)
- Niveauer: hele timer → halve → kvarter → fem minutter (vælges frit i menuen)
- Stjerner + pokal for hver 5 stjerner; Ugo med udtryk; konfetti
- Gemmer fremgang lokalt og virker offline

## Version
v0.5.0 — se [CHANGELOG.md](CHANGELOG.md).
```

- [ ] **Step 2: Prepend to `CHANGELOG.md`** (efter Semantic Versioning-linjen, før `## [0.4.0]`):

```markdown
## [0.5.0] - 2026-06-10

### Changed
- Appen er nu "Alfred lærer klokken" — en React-version (Vite + React + TS + Tailwind) som barnet er glad for, deployet på samme URL
- Den tidligere vanilla-app (klokke/bogstaver/progression) er erstattet (bevaret i git-historikken)

### Added
- Gemt fremgang: stjerner, pokaler, fremgang-mod-næste-pokal, valgt niveau og spil huskes lokalt
- Self-hostede fonte (Fredoka/Nunito) så spillet ser rigtigt ud offline
- Ugo-app-ikon
```

- [ ] **Step 3: Full verification** — `npm test` (alle grønne), `npm run typecheck` (ren), `npm run build` (success).

- [ ] **Step 4: Commit**

```bash
git add README.md CHANGELOG.md
git commit -m "docs: v0.5.0 — Alfred clock game"
```

---

## Self-Review (udført under planlægningen)

**Spec-dækning:**
- Stak-skift React+TS+Tailwind+PWA, erstatter vanilla → Task 1. ✓
- Bevar adfærd verbatim (Owl/Clock/ui/App/danishTime fra reference) → Task 2, 4, 5. ✓
- Persistens (stars/trophies/starRow/level/mode, robust) → Task 3 + wiring i Task 5. ✓
- Offline + ikon + self-hostede fonte → Task 1 (workbox woff/woff2 + fonts i main.tsx) + Task 6 (ikon). ✓
- Fjern gammel vanilla src/ + tests → Task 1 (git rm). ✓
- Test (time + persistence) → Task 2, 3. ✓
- v0.5.0 + samme deploy-workflow → Task 1 (version) + Task 7 (changelog); workflow urørt. ✓

**Placeholder-scan:** "Kopiér fra reference" peger på en konkret, committet fil (`docs/reference/alfred-original.jsx`) med de eksakte dele + de præcise TS/wiring-ændringer angivet — ikke et hul. Øvrig kode er fuldt udskrevet. Midlertidig `App.tsx` i Task 1 erstattes eksplicit i Task 5.

**Type-konsistens:** `LevelKey`, `Time`, `LEVELS`, `danishTime`, `snapMinute`, `makeOptions`, `randomTime`, `tKey`, `cap`, `digital`, `rand`, `CORRECT`, `WRONG`, `polar` (time.ts) bruges ens i Clock/App. `Progress` + `loadProgress/saveProgress` (persistence) bruges i App. `shade` (colors) i ui. Komponent-props (`OwlProps`/`ClockProps`/ui) matcher kaldene i App. `main.tsx` importerer `App` default. ✓

---

## Næste skridt
- Senere: port Bogstaver-aktiviteten + den fælles progression/samling ind i React-appen (lå i vanilla-versionen, bevaret i git-historik).
- Evt. lyd.
