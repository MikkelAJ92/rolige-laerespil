# Grafisk fidelity (stil B) Implementeringsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Løft alle appens illustrationer til den bløde, skyggede "stil B" (flade former + gradienter + blid feDropShadow), giv uglen en udtryks-API (calm/happy), og tilføj en diskret fade-in — uden at ændre nogen logik.

**Architecture:** Rent visuelt løft. Alle ændringer ligger i SVG-genererende UI-funktioner + CSS. En ny `uid()`-hjælper giver unikke gradient-/filter-id'er pr. kald, så flere tegninger på samme skærm ikke kolliderer i DOM'en. Domæne, services og aktivitets-orkestratorer røres ikke; kun `mascot`-testen opdateres (krone-markør + udtryk), resten af testene skal bestå uændret.

**Tech Stack:** Vite, TypeScript, Vitest + jsdom, ren CSS, SVG (gradienter + feDropShadow). Branch: `feat/grafisk-fidelity`.

---

## Filstruktur (nyt + ændret)

```
src/
  ui/uid.ts                       # NY: uid(prefix) unik id-tæller
  ui/mascot.ts                    # OMSKRIVES: owl stil B + expression + krone (data-part)
  ui/icons.ts                     # OMSKRIVES: dino/bike/trophy stil B
  ui/pictures.ts                  # OMSKRIVES: 9 ord-tegninger stil B (genbruger owl/dino/bike)
  activities/clock/clock-face.ts  # OMSKRIVES: urskive stil B (vinkel-logik uændret)
  styles/base.css                 # ÆNDRET: @keyframes fade-in på .home/.activity
tests/
  uid.test.ts                     # NY
  mascot.test.ts                  # OPDATERES
package.json, CHANGELOG.md        # v0.3.0
```
Urørt: alt under `domain/`, `services/`, `core/`, `activities/*/{read,set,spell}-mode.ts`, `*-activity.ts`, `ui/home.ts`, `parent/`, `main.ts`.

---

## Task 1: uid-hjælper (unikke id'er)

**Files:** Create `src/ui/uid.ts`, `tests/uid.test.ts`

- [ ] **Step 1: Skriv den fejlende test**

```ts
// tests/uid.test.ts
import { describe, it, expect } from 'vitest';
import { uid } from '../src/ui/uid';

describe('uid', () => {
  it('giver forskellige id-er ved hvert kald', () => {
    expect(uid('a')).not.toBe(uid('a'));
  });
  it('bruger prefikset', () => {
    expect(uid('owl').startsWith('owl-')).toBe(true);
  });
});
```

- [ ] **Step 2: Kør og bekræft FAIL**

Run: `npx vitest run tests/uid.test.ts`
Expected: FAIL — import kan ikke resolves.

- [ ] **Step 3: Implementér**

```ts
// src/ui/uid.ts
let counter = 0;

/** Unik id-streng pr. kald — bruges til gradient-/filter-id'er, så de ikke kolliderer i DOM'en. */
export function uid(prefix = 'id'): string {
  counter += 1;
  return `${prefix}-${counter}`;
}
```

- [ ] **Step 4: Kør og bekræft PASS**

Run: `npx vitest run tests/uid.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/uid.ts tests/uid.test.ts
git commit -m "feat(ui): add uid helper for unique SVG ids"
```

---

## Task 2: Uglen i stil B med udtryk

**Files:** Modify `src/ui/mascot.ts` (full rewrite), `tests/mascot.test.ts` (update)

- [ ] **Step 1: Opdatér `tests/mascot.test.ts` med de nye forventninger**

```ts
// tests/mascot.test.ts
import { describe, it, expect } from 'vitest';
import { owlSvg } from '../src/ui/mascot';

describe('owlSvg', () => {
  it('returnerer et svg-element', () => {
    expect(owlSvg(1)).toContain('<svg');
  });
  it('har ingen krone på rang 1', () => {
    expect(owlSvg(1)).not.toContain('data-part="crown"');
  });
  it('får en krone fra rang 2', () => {
    expect(owlSvg(2)).toContain('data-part="crown"');
  });
  it('markerer udtrykket (calm vs happy)', () => {
    expect(owlSvg(1, 64, 'calm')).toContain('data-eyes="calm"');
    expect(owlSvg(1, 64, 'happy')).toContain('data-eyes="happy"');
  });
});
```

- [ ] **Step 2: Kør og bekræft FAIL**

Run: `npx vitest run tests/mascot.test.ts`
Expected: FAIL (den gamle owl bruger `id="crown"` og har ingen `data-eyes`).

- [ ] **Step 3: Omskriv `src/ui/mascot.ts`**

```ts
// src/ui/mascot.ts
import { uid } from './uid';

export type OwlExpression = 'calm' | 'happy';

/** Tegner uglen "Ugo" i stil B. Krone fra rang 2. */
export function owlSvg(rank = 1, size = 64, expression: OwlExpression = 'calm'): string {
  const body = uid('owl-body');
  const belly = uid('owl-belly');
  const beak = uid('owl-beak');
  const gold = uid('owl-gold');
  const sh = uid('owl-sh');

  const crown = rank >= 2
    ? `<path data-part="crown" d="M40 22 L40 12 L50 18 L60 6 L70 18 L80 12 L80 22 Z" fill="url(#${gold})" filter="url(#${sh})"/>`
    : '';

  const eyes = expression === 'happy'
    ? `<g data-eyes="happy">
         <path d="M37 64 q7 -10 14 0" stroke="#3E3E3A" stroke-width="3.5" fill="none" stroke-linecap="round"/>
         <path d="M69 64 q7 -10 14 0" stroke="#3E3E3A" stroke-width="3.5" fill="none" stroke-linecap="round"/>
         <circle cx="34" cy="72" r="5" fill="#E0A87E" opacity="0.4"/>
         <circle cx="86" cy="72" r="5" fill="#E0A87E" opacity="0.4"/>
       </g>`
    : `<g data-eyes="calm">
         <circle cx="44" cy="62" r="7.5" fill="#3E3E3A"/><circle cx="76" cy="62" r="7.5" fill="#3E3E3A"/>
         <circle cx="47.5" cy="58.5" r="2.8" fill="#fff"/><circle cx="79.5" cy="58.5" r="2.8" fill="#fff"/>
       </g>`;

  return `<svg width="${size}" height="${size * 1.1}" viewBox="0 0 120 132" aria-hidden="true">
    <defs>
      <radialGradient id="${body}" cx="40%" cy="32%" r="78%"><stop offset="0%" stop-color="#BBD0C6"/><stop offset="100%" stop-color="#90B1A5"/></radialGradient>
      <linearGradient id="${belly}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#F8F1E1"/><stop offset="100%" stop-color="#E6D6BA"/></linearGradient>
      <linearGradient id="${beak}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#EAB489"/><stop offset="100%" stop-color="#D2935F"/></linearGradient>
      <linearGradient id="${gold}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#E0C173"/><stop offset="100%" stop-color="#C49A4A"/></linearGradient>
      <filter id="${sh}" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="4" stdDeviation="4.5" flood-color="#3a4a42" flood-opacity="0.18"/></filter>
    </defs>
    ${crown}
    <g filter="url(#${sh})">
      <path d="M38 30 L46 10 L56 30 Z" fill="#8FB0A4"/><path d="M82 30 L74 10 L64 30 Z" fill="#8FB0A4"/>
      <ellipse cx="60" cy="74" rx="44" ry="52" fill="url(#${body})"/>
      <path d="M20 66 q-7 24 7 46 q7 -22 5 -46 z" fill="#83A89B"/><path d="M100 66 q7 24 -7 46 q-7 -22 -5 -46 z" fill="#83A89B"/>
      <ellipse cx="60" cy="84" rx="28" ry="38" fill="url(#${belly})"/>
    </g>
    <circle cx="44" cy="60" r="17" fill="#FBF8F1"/><circle cx="76" cy="60" r="17" fill="#FBF8F1"/>
    ${eyes}
    <path d="M60 68 l-6 9 l12 0 z" fill="url(#${beak})"/>
  </svg>`;
}
```

- [ ] **Step 4: Kør og bekræft PASS**

Run: `npx vitest run tests/mascot.test.ts`
Expected: PASS (4/4).

- [ ] **Step 5: Verificér ingen regression**

Run: `npm test` (alle suiter), `npm run typecheck`
Expected: alle grønne, ren typecheck. (`owlSvg` bruges i `home.ts`, `read-mode.ts`, `spell-mode.ts` med `(rank, size)` — stadig gyldigt, default `calm`.)

- [ ] **Step 6: Commit**

```bash
git add src/ui/mascot.ts tests/mascot.test.ts
git commit -m "feat(ui): redraw owl in style B with calm/happy expressions"
```

---

## Task 3: Urskive i stil B

**Files:** Modify `src/activities/clock/clock-face.ts` (full rewrite — vinkel-logik uændret)

- [ ] **Step 1: Omskriv `src/activities/clock/clock-face.ts`**

```ts
// src/activities/clock/clock-face.ts
import { hourHandAngle, minuteHandAngle } from '../../domain/clock-math';
import { uid } from '../../ui/uid';

const NUMBERS: Array<{ n: number; x: number; y: number }> = [
  { n: 12, x: 100, y: 42 }, { n: 1, x: 131, y: 50 }, { n: 2, x: 154, y: 69 },
  { n: 3, x: 162, y: 100 }, { n: 4, x: 154, y: 131 }, { n: 5, x: 131, y: 150 },
  { n: 6, x: 100, y: 158 }, { n: 7, x: 69, y: 150 }, { n: 8, x: 46, y: 131 },
  { n: 9, x: 38, y: 100 }, { n: 10, x: 46, y: 69 }, { n: 11, x: 69, y: 50 },
];

export function clockFaceSvg(hours: number, minutes: number, size = 200): string {
  const ha = hourHandAngle(hours, minutes);
  const ma = minuteHandAngle(minutes);
  const face = uid('clk-face');
  const sh = uid('clk-sh');
  const numbers = NUMBERS.map(
    ({ n, x, y }) =>
      `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-family="Georgia, serif" font-size="16" fill="#4A4A45">${n}</text>`,
  ).join('');

  return `<svg width="${size}" height="${size}" viewBox="0 0 200 200" role="img" aria-label="analogt ur">
    <defs>
      <radialGradient id="${face}" cx="42%" cy="36%" r="68%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#EDE3D2"/></radialGradient>
      <filter id="${sh}" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#6b6a53" flood-opacity="0.18"/></filter>
    </defs>
    <circle cx="100" cy="100" r="86" fill="url(#${face})" stroke="#A8C3B8" stroke-width="6" filter="url(#${sh})"/>
    <circle cx="100" cy="100" r="79" fill="none" stroke="#E7E0D2" stroke-width="1.5"/>
    ${numbers}
    <line x1="100" y1="100" x2="100" y2="40" stroke="#4A4A45" stroke-width="4.5" stroke-linecap="round" transform="rotate(${ma} 100 100)"/>
    <line x1="100" y1="100" x2="100" y2="58" stroke="#C98A6B" stroke-width="6.5" stroke-linecap="round" transform="rotate(${ha} 100 100)"/>
    <circle cx="100" cy="100" r="5.5" fill="#4A4A45"/>
  </svg>`;
}
```

- [ ] **Step 2: Verificér**

Run: `npm test` (read-mode/clock-math suiter skal stadig passere — de tester ikke SVG-internals), `npm run typecheck`
Expected: alle grønne.

- [ ] **Step 3: Commit**

```bash
git add src/activities/clock/clock-face.ts
git commit -m "feat(clock): restyle clock face in style B (logic unchanged)"
```

---

## Task 4: Ikoner i stil B (dino, cykel, trofæ)

**Files:** Modify `src/ui/icons.ts` (full rewrite)

- [ ] **Step 1: Omskriv `src/ui/icons.ts`**

```ts
// src/ui/icons.ts
import { uid } from './uid';

export function dinoSvg(color = '#9DB89A', size = 56): string {
  const sh = uid('dino-sh');
  return `<svg width="${size}" height="${size * 0.8}" viewBox="0 0 100 80" aria-hidden="true">
    <defs><filter id="${sh}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#3d5142" flood-opacity="0.2"/></filter></defs>
    <g filter="url(#${sh})">
      <path d="M22 52 Q8 50 4 62" stroke="${color}" stroke-width="9" fill="none" stroke-linecap="round"/>
      <ellipse cx="50" cy="52" rx="30" ry="16" fill="${color}"/>
      <path d="M68 50 Q80 44 80 26 Q80 14 73 12" stroke="${color}" stroke-width="12" fill="none" stroke-linecap="round"/>
      <circle cx="74" cy="14" r="8" fill="${color}"/>
      <rect x="36" y="62" width="8" height="14" rx="4" fill="${color}"/>
      <rect x="58" y="62" width="8" height="14" rx="4" fill="${color}"/>
    </g>
    <ellipse cx="44" cy="46" rx="16" ry="6" fill="#FFFFFF" opacity="0.18"/>
    <circle cx="77" cy="12" r="1.6" fill="#4A4A45"/>
  </svg>`;
}

export function bikeSvg(color = '#9AB0C4', frame = '#C99A78', size = 56): string {
  const sh = uid('bike-sh');
  return `<svg width="${size}" height="${size * 0.7}" viewBox="0 0 100 70" aria-hidden="true">
    <defs><filter id="${sh}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2.5" stdDeviation="2" flood-color="#3a4250" flood-opacity="0.2"/></filter></defs>
    <g filter="url(#${sh})">
      <circle cx="24" cy="48" r="16" fill="none" stroke="${color}" stroke-width="4"/>
      <circle cx="76" cy="48" r="16" fill="none" stroke="${color}" stroke-width="4"/>
      <path d="M24 48 L46 48 L60 26 L40 26 M46 48 L60 26 M60 26 L76 48" stroke="${frame}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M36 26 l8 0" stroke="#4A4A45" stroke-width="3" stroke-linecap="round"/>
      <path d="M58 22 l8 0" stroke="#4A4A45" stroke-width="3" stroke-linecap="round"/>
    </g>
    <circle cx="46" cy="48" r="3" fill="#4A4A45"/>
  </svg>`;
}

export function trophySvg(color = '#CBA15A', size = 28): string {
  const g = uid('tr-g');
  const sh = uid('tr-sh');
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">
    <defs>
      <linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#E0C173"/><stop offset="100%" stop-color="${color}"/></linearGradient>
      <filter id="${sh}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1" stdDeviation="0.8" flood-color="#8a6a1f" flood-opacity="0.25"/></filter>
    </defs>
    <g filter="url(#${sh})" fill="url(#${g})">
      <path d="M8 4 h8 v4 a4 4 0 0 1 -8 0 z"/>
      <rect x="11" y="12" width="2" height="4"/>
      <rect x="8" y="16" width="8" height="2.4" rx="1"/>
    </g>
    <path d="M8 5.2 h-2.6 a2.4 2.4 0 0 0 2.6 4" stroke="url(#${g})" stroke-width="1.4" fill="none"/>
    <path d="M16 5.2 h2.6 a2.4 2.4 0 0 1 -2.6 4" stroke="url(#${g})" stroke-width="1.4" fill="none"/>
  </svg>`;
}
```

- [ ] **Step 2: Verificér**

Run: `npm test`, `npm run typecheck`
Expected: alle grønne (ingen test rører ikon-internals; `pictures`-testen bruger dino/bike via pictureSvg og tjekker blot `<svg` + ≠ pladsholder).

- [ ] **Step 3: Commit**

```bash
git add src/ui/icons.ts
git commit -m "feat(ui): restyle dino, bike and trophy icons in style B"
```

---

## Task 5: Ord-tegninger i stil B

**Files:** Modify `src/ui/pictures.ts` (full rewrite)

- [ ] **Step 1: Omskriv `src/ui/pictures.ts`**

```ts
// src/ui/pictures.ts
import { owlSvg } from './mascot';
import { dinoSvg, bikeSvg } from './icons';
import { uid } from './uid';

function svg(inner: string, size: number): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 120 120" aria-hidden="true">${inner}</svg>`;
}

function sol(s: number): string {
  const g = uid('sol-g');
  const sh = uid('sol-sh');
  return svg(
    `<defs>
       <radialGradient id="${g}" cx="42%" cy="38%" r="65%"><stop offset="0%" stop-color="#F0D98A"/><stop offset="100%" stop-color="#DBB85A"/></radialGradient>
       <filter id="${sh}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3.5" flood-color="#9a7d2e" flood-opacity="0.22"/></filter>
     </defs>
     <g stroke="#E2C261" stroke-width="6" stroke-linecap="round">
       <line x1="60" y1="12" x2="60" y2="26"/><line x1="60" y1="94" x2="60" y2="108"/><line x1="12" y1="60" x2="26" y2="60"/><line x1="94" y1="60" x2="108" y2="60"/>
       <line x1="26" y1="26" x2="36" y2="36"/><line x1="84" y1="84" x2="94" y2="94"/><line x1="94" y1="26" x2="84" y2="36"/><line x1="36" y1="84" x2="26" y2="94"/>
     </g>
     <circle cx="60" cy="60" r="26" fill="url(#${g})" filter="url(#${sh})"/>`,
    s,
  );
}

function kat(s: number): string {
  const g = uid('kat-g');
  const sh = uid('kat-sh');
  return svg(
    `<defs>
       <radialGradient id="${g}" cx="42%" cy="34%" r="72%"><stop offset="0%" stop-color="#C2B1A8"/><stop offset="100%" stop-color="#9E8B82"/></radialGradient>
       <filter id="${sh}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3.5" flood-color="#4a3f39" flood-opacity="0.2"/></filter>
     </defs>
     <g filter="url(#${sh})">
       <path d="M40 42 L34 22 L54 38 Z" fill="#9E8B82"/><path d="M80 42 L86 22 L66 38 Z" fill="#9E8B82"/>
       <circle cx="60" cy="64" r="32" fill="url(#${g})"/>
     </g>
     <circle cx="50" cy="60" r="4" fill="#3E3E3A"/><circle cx="70" cy="60" r="4" fill="#3E3E3A"/>
     <path d="M60 70 l-4 5 M60 70 l4 5" stroke="#3E3E3A" stroke-width="2" fill="none" stroke-linecap="round"/>
     <g stroke="#3E3E3A" stroke-width="1.5"><line x1="40" y1="72" x2="24" y2="70"/><line x1="40" y1="76" x2="26" y2="80"/><line x1="80" y1="72" x2="96" y2="70"/><line x1="80" y1="76" x2="94" y2="80"/></g>`,
    s,
  );
}

function hus(s: number): string {
  const roof = uid('hus-roof');
  const wall = uid('hus-wall');
  const sh = uid('hus-sh');
  return svg(
    `<defs>
       <linearGradient id="${roof}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#D89C7D"/><stop offset="100%" stop-color="#B97A5C"/></linearGradient>
       <linearGradient id="${wall}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ECD7B4"/><stop offset="100%" stop-color="#DBC198"/></linearGradient>
       <filter id="${sh}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3.5" flood-color="#6a4f3a" flood-opacity="0.2"/></filter>
     </defs>
     <g filter="url(#${sh})">
       <rect x="34" y="56" width="52" height="40" fill="url(#${wall})"/>
       <path d="M26 56 L60 28 L94 56 Z" fill="url(#${roof})"/>
     </g>
     <rect x="54" y="72" width="14" height="24" rx="2" fill="#9C8466"/>
     <rect x="40" y="62" width="12" height="12" rx="2" fill="#A9BBD0"/>`,
    s,
  );
}

function trae(s: number): string {
  const g = uid('trae-g');
  const sh = uid('trae-sh');
  return svg(
    `<defs>
       <radialGradient id="${g}" cx="40%" cy="34%" r="72%"><stop offset="0%" stop-color="#A6C4AC"/><stop offset="100%" stop-color="#7FA083"/></radialGradient>
       <filter id="${sh}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3.5" flood-color="#3f5140" flood-opacity="0.2"/></filter>
     </defs>
     <rect x="54" y="66" width="12" height="34" rx="3" fill="#9C8466"/>
     <g filter="url(#${sh})">
       <circle cx="42" cy="56" r="18" fill="url(#${g})"/><circle cx="78" cy="56" r="18" fill="url(#${g})"/><circle cx="60" cy="44" r="24" fill="url(#${g})"/>
     </g>`,
    s,
  );
}

function baal(s: number): string {
  const g = uid('baal-g');
  const sh = uid('baal-sh');
  return svg(
    `<defs>
       <linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#E6C66A"/><stop offset="100%" stop-color="#D9774A"/></linearGradient>
       <filter id="${sh}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#7a3f24" flood-opacity="0.22"/></filter>
     </defs>
     <g stroke="#9C8466" stroke-width="6" stroke-linecap="round"><line x1="36" y1="92" x2="84" y2="80"/><line x1="36" y1="80" x2="84" y2="92"/></g>
     <path d="M60 30 C72 46 70 56 60 70 C50 56 48 46 60 30 Z" fill="url(#${g})" filter="url(#${sh})"/>
     <path d="M60 44 C66 54 65 60 60 70 C55 60 54 54 60 44 Z" fill="#F0DE9A"/>`,
    s,
  );
}

function oeje(s: number): string {
  const g = uid('oeje-g');
  const sh = uid('oeje-sh');
  return svg(
    `<defs>
       <radialGradient id="${g}" cx="50%" cy="45%" r="60%"><stop offset="0%" stop-color="#8FA0B2"/><stop offset="100%" stop-color="#5E7A83"/></radialGradient>
       <filter id="${sh}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#3a3a45" flood-opacity="0.18"/></filter>
     </defs>
     <ellipse cx="60" cy="60" rx="40" ry="24" fill="#FBF8F1" stroke="#4A4A45" stroke-width="3" filter="url(#${sh})"/>
     <circle cx="60" cy="60" r="14" fill="url(#${g})"/><circle cx="60" cy="60" r="6" fill="#3E3E3A"/>
     <circle cx="64" cy="56" r="2.4" fill="#fff"/>`,
    s,
  );
}

function bold(s: number): string {
  const g = uid('bold-g');
  const sh = uid('bold-sh');
  return svg(
    `<defs>
       <radialGradient id="${g}" cx="40%" cy="34%" r="70%"><stop offset="0%" stop-color="#BCCBDB"/><stop offset="100%" stop-color="#90A6BE"/></radialGradient>
       <filter id="${sh}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3.5" flood-color="#3f4a57" flood-opacity="0.2"/></filter>
     </defs>
     <circle cx="60" cy="60" r="32" fill="url(#${g})" stroke="#7D8C9E" stroke-width="2.5" filter="url(#${sh})"/>
     <path d="M28 60 H92 M60 28 V92" stroke="#7D8C9E" stroke-width="2.5" fill="none" opacity="0.8"/>`,
    s,
  );
}

function fisk(s: number): string {
  const g = uid('fisk-g');
  const sh = uid('fisk-sh');
  return svg(
    `<defs>
       <linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#A6C4B6"/><stop offset="100%" stop-color="#7FA092"/></linearGradient>
       <filter id="${sh}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#3f5147" flood-opacity="0.2"/></filter>
     </defs>
     <g filter="url(#${sh})">
       <path d="M84 60 L104 46 L104 74 Z" fill="#7FA092"/>
       <ellipse cx="52" cy="60" rx="34" ry="20" fill="url(#${g})"/>
     </g>
     <circle cx="38" cy="55" r="3.5" fill="#3E3E3A"/>`,
    s,
  );
}

function banan(s: number): string {
  const g = uid('banan-g');
  const sh = uid('banan-sh');
  return svg(
    `<defs>
       <linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#EBD27A"/><stop offset="100%" stop-color="#D4B24A"/></linearGradient>
       <filter id="${sh}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#8a6f2a" flood-opacity="0.2"/></filter>
     </defs>
     <path d="M30 40 C40 84 80 92 96 70 C84 80 50 70 44 38 Z" fill="url(#${g})" stroke="#C9A94E" stroke-width="2.5" filter="url(#${sh})"/>`,
    s,
  );
}

export function pictureSvg(id: string, size = 120): string {
  switch (id) {
    case 'ugle': return owlSvg(1, size);
    case 'dino': return dinoSvg('#9DB89A', size);
    case 'cykel': return bikeSvg('#9AB0C4', '#C99A78', size);
    case 'sol': return sol(size);
    case 'kat': return kat(size);
    case 'hus': return hus(size);
    case 'trae': return trae(size);
    case 'baal': return baal(size);
    case 'oeje': return oeje(size);
    case 'bold': return bold(size);
    case 'fisk': return fisk(size);
    case 'banan': return banan(size);
    default: return svg('<circle cx="60" cy="60" r="30" fill="#E2DDD2"/>', size);
  }
}
```

> **Bemærk:** kopiér hex-farverne eksakt fra koden ovenfor.

- [ ] **Step 2: Verificér**

Run: `npx vitest run tests/pictures.test.ts` (hvert ord giver `<svg` og ≠ pladsholder), derefter `npm test` og `npm run typecheck`
Expected: alle grønne.

- [ ] **Step 3: Commit**

```bash
git add src/ui/pictures.ts
git commit -m "feat(ui): restyle word pictures in style B"
```

---

## Task 6: Diskret fade-in

**Files:** Modify `src/styles/base.css` (append)

- [ ] **Step 1: Append til `src/styles/base.css`**

```css
/* Diskret fade-in på skærme */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
.home, .activity { animation: fade-in 0.25s ease both; }
@media (prefers-reduced-motion: reduce) {
  .home, .activity { animation: none; }
}
```

- [ ] **Step 2: Verificér**

Run: `npm run build` (success), `npm test` (uændret grøn)
Expected: bygger; ingen test rører dette.

- [ ] **Step 3: Commit**

```bash
git add src/styles/base.css
git commit -m "feat(ui): add a gentle screen fade-in"
```

---

## Task 7: Versionsbump + dokumentation

**Files:** Modify `package.json`, `CHANGELOG.md`

- [ ] **Step 1: Bump `package.json`** — ændr `"version": "0.2.0",` til:

```json
  "version": "0.3.0",
```

- [ ] **Step 2: Tilføj øverst i `CHANGELOG.md`** (efter Semantic Versioning-linjen, før `## [0.2.0]`):

```markdown
## [0.3.0] - 2026-06-10

### Changed
- Alle illustrationer løftet til blød "stil B" (gradienter + blid skygge): ugle, ur, dino, cykel, trofæ og ord-tegninger
- Uglen har nu udtryk (rolig/glad) og krone ved højere rang
- Diskret fade-in når en skærm vises (respekterer prefers-reduced-motion)
- Unikke gradient-/filter-id'er pr. tegning (undgår DOM-id-kollision)

```

- [ ] **Step 3: Fuld verifikation**

Run: `npm test` → alle grønne.
Run: `npm run typecheck` → ren.
Run: `npm run build` → success (manifest + service worker i `dist/`).

- [ ] **Step 4: Commit**

```bash
git add package.json CHANGELOG.md
git commit -m "docs: bump to v0.3.0 for the graphic fidelity uplift"
```

---

## Self-Review (udført under planlægningen)

**Spec-dækning:**
- Stil B (gradienter + feDropShadow) på alle tegninger → Task 2 (ugle), 3 (ur), 4 (ikoner), 5 (ord-tegninger). ✓
- Ugle-udtryks-API (calm/happy) + krone (data-part) → Task 2. ✓
- Unikke gradient-/filter-id'er → Task 1 (uid) brugt i Task 2-5. ✓
- Diskret fade-in (.home/.activity, reduced-motion) → Task 6. ✓
- Ingen logik-ændring; kun mascot-test opdateret, resten urørt → Task 2 (test), Task 3-6 (verifikation viser uændrede suiter). ✓
- v0.3.0 → Task 7. ✓

**Placeholder-scan:** Ingen TBD/TODO. `pictureSvg` har en `default`-figur, men alle ord-id'er er eksplicit dækket (pictures-testen håndhæver det). Bemærkning indsat om eksakt hex i `oeje`. Al kode er konkret.

**Type-konsistens:** `owlSvg(rank?, size?, expression?)` er bagudkompatibel med eksisterende kald `owlSvg(1, 56)` / `owlSvg(owlRank(state), 44)`. `dinoSvg/bikeSvg/trophySvg` beholder deres signaturer (color/frame/size), så `clock-activity`, `words-activity`, `home`, `pictures` kalder dem uændret. `clockFaceSvg(hours, minutes, size?)` uændret signatur — `read-mode`/`set-mode` kalder den som før. `uid(prefix)` bruges ens i alle. `pictureSvg(id, size?)` uændret. ✓

---

## Næste skridt
- **Spor A:** progression & level-op-følelse (fælles fremgangsmodel, synlig fremgangsbar, level-up-moment der bruger den nye `happy`-ugle + krone, besøgbar samling).
- Derefter **v3: Tal & tælle**.
