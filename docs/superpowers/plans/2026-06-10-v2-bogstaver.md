# Bogstaver — "Stav ordet" (v2) Implementeringsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tilføj appens anden aktivitet, **Bogstaver**, med spillet **"Stav ordet"**: en rolig tegning + tomme felter + ordets bogstavbrikker i blandet rækkefølge, som barnet trykker i rigtig rækkefølge.

**Architecture:** Genbruger v1's app-skal (`Activity`-interface, router, `core/dom`, `services/audio`, `ui/mascot`, `ui/icons`, design-tokens) uændret. Ny domænelogik (ordliste + niveauer + stave-logik) er rene, test-dækkede funktioner. Bogstaver får sit eget fremgangsspor i `localStorage` (`rl.words.v1`), så klokken er uberørt. Forsidens trofætæller summerer begge aktiviteter.

**Tech Stack:** Vite, TypeScript (vanilla), Vitest + jsdom, ren CSS med design-tokens, SVG. Branch: `feat/v2-bogstaver`.

---

## Filstruktur (nyt + ændret)

```
src/
  domain/words.ts            # NY: ordliste + niveauer + stave-logik (rent)
  ui/pictures.ts             # NY: rolige SVG-tegninger pr. ord
  services/words-progress.ts # NY: Bogstaver-fremgang (localStorage rl.words.v1)
  activities/words/
    spell-mode.ts            # NY: "Stav ordet" skærm + interaktion
    words-activity.ts        # NY: orkestrator (Activity)
  ui/home.ts                 # ÆNDRET: aktivér Bogstaver + summér trofæer
  main.ts                    # ÆNDRET: rut 'letters' -> WordsActivity
  styles/base.css            # ÆNDRET: stave-skærm-styles (append)
tests/
  words.test.ts              # NY
  words-progress.test.ts     # NY
  pictures.test.ts           # NY
  spell-mode.test.ts         # NY
```
Klokke-filer (`activities/clock/*`, `services/progress.ts`, `domain/clock-*`) røres **ikke**.

---

## Task 1: Domæne — ordliste, niveauer og stave-logik

**Files:** Create `src/domain/words.ts`, `tests/words.test.ts`

- [ ] **Step 1: Skriv den fejlende test**

```ts
// tests/words.test.ts
import { describe, it, expect } from 'vitest';
import {
  WORDS, WORD_LEVELS, wordsForLevel, pickWord, shuffledLetters,
  isCorrectNext, isComplete, type WordLevel,
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
```

- [ ] **Step 2: Kør og bekræft FAIL**

Run: `npx vitest run tests/words.test.ts`
Expected: FAIL — import kan ikke resolves.

- [ ] **Step 3: Implementér**

```ts
// src/domain/words.ts
export type WordLevel = 1 | 2 | 3;
export type Rng = () => number; // [0, 1)

export interface WordEntry {
  word: string;    // små bogstaver
  picture: string; // id i ui/pictures.ts
}

export interface WordLevelConfig {
  level: WordLevel;
  label: string;
  showWord: boolean;
}

export const WORD_LEVELS: Record<WordLevel, WordLevelConfig> = {
  1: { level: 1, label: '3 bogstaver', showWord: true },
  2: { level: 2, label: '4 bogstaver', showWord: false },
  3: { level: 3, label: '5+ bogstaver', showWord: false },
};

export const WORDS: WordEntry[] = [
  // Niveau 1 — 3 bogstaver (inkl. æ/ø/å)
  { word: 'sol', picture: 'sol' },
  { word: 'kat', picture: 'kat' },
  { word: 'hus', picture: 'hus' },
  { word: 'træ', picture: 'trae' },
  { word: 'bål', picture: 'baal' },
  { word: 'øje', picture: 'oeje' },
  // Niveau 2 — 4 bogstaver
  { word: 'ugle', picture: 'ugle' },
  { word: 'dino', picture: 'dino' },
  { word: 'bold', picture: 'bold' },
  { word: 'fisk', picture: 'fisk' },
  // Niveau 3 — 5+ bogstaver
  { word: 'cykel', picture: 'cykel' },
  { word: 'banan', picture: 'banan' },
];

export function wordsForLevel(level: WordLevel): WordEntry[] {
  if (level === 1) return WORDS.filter((w) => w.word.length === 3);
  if (level === 2) return WORDS.filter((w) => w.word.length === 4);
  return WORDS.filter((w) => w.word.length >= 5);
}

export function pickWord(level: WordLevel, rng: Rng): WordEntry {
  const pool = wordsForLevel(level);
  return pool[Math.floor(rng() * pool.length)];
}

export function shuffledLetters(word: string, rng: Rng): string[] {
  const a = [...word];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Er det tappede bogstav det næste rigtige i ordet? */
export function isCorrectNext(word: string, typed: string, letter: string): boolean {
  return typed.length < word.length && word[typed.length] === letter;
}

export function isComplete(word: string, typed: string): boolean {
  return typed === word;
}
```

- [ ] **Step 4: Kør og bekræft PASS**

Run: `npx vitest run tests/words.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/words.ts tests/words.test.ts
git commit -m "feat(words): add word bank, levels and spelling logic"
```

---

## Task 2: UI — tegninger pr. ord

**Files:** Create `src/ui/pictures.ts`, `tests/pictures.test.ts`

Genbruger ugle/dino/cykel fra `mascot`/`icons`; resten er nye, enkle SVG'er.

- [ ] **Step 1: Skriv den fejlende test**

```ts
// tests/pictures.test.ts
import { describe, it, expect } from 'vitest';
import { WORDS } from '../src/domain/words';
import { pictureSvg } from '../src/ui/pictures';

describe('pictureSvg', () => {
  it('returnerer et svg for hvert ord i ordlisten', () => {
    for (const w of WORDS) {
      expect(pictureSvg(w.picture)).toContain('<svg');
    }
  });
});
```

- [ ] **Step 2: Kør og bekræft FAIL**

Run: `npx vitest run tests/pictures.test.ts`
Expected: FAIL — import kan ikke resolves.

- [ ] **Step 3: Implementér**

```ts
// src/ui/pictures.ts
import { owlSvg } from './mascot';
import { dinoSvg, bikeSvg } from './icons';

function wrap(inner: string, size: number): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 120 120" aria-hidden="true">${inner}</svg>`;
}

const sol = (s: number) => wrap(
  `<g stroke="#D9B25A" stroke-width="5" stroke-linecap="round">
     <line x1="60" y1="14" x2="60" y2="28"/><line x1="60" y1="92" x2="60" y2="106"/>
     <line x1="14" y1="60" x2="28" y2="60"/><line x1="92" y1="60" x2="106" y2="60"/>
     <line x1="28" y1="28" x2="38" y2="38"/><line x1="82" y1="82" x2="92" y2="92"/>
     <line x1="92" y1="28" x2="82" y2="38"/><line x1="38" y1="82" x2="28" y2="92"/>
   </g>
   <circle cx="60" cy="60" r="24" fill="#E6C66A"/>`, s);

const kat = (s: number) => wrap(
  `<path d="M38 40 L34 22 L52 36 Z" fill="#A6938A"/><path d="M82 40 L86 22 L68 36 Z" fill="#A6938A"/>
   <circle cx="60" cy="64" r="32" fill="#B3A199"/>
   <circle cx="50" cy="60" r="4" fill="#4A4A45"/><circle cx="70" cy="60" r="4" fill="#4A4A45"/>
   <path d="M60 70 l-4 5 M60 70 l4 5" stroke="#4A4A45" stroke-width="2" fill="none" stroke-linecap="round"/>
   <g stroke="#4A4A45" stroke-width="1.5"><line x1="40" y1="72" x2="24" y2="70"/><line x1="40" y1="76" x2="26" y2="80"/><line x1="80" y1="72" x2="96" y2="70"/><line x1="80" y1="76" x2="94" y2="80"/></g>`, s);

const hus = (s: number) => wrap(
  `<path d="M26 56 L60 28 L94 56 Z" fill="#C98A6B"/>
   <rect x="34" y="56" width="52" height="40" fill="#E0C9A6"/>
   <rect x="54" y="72" width="14" height="24" fill="#9C8466"/>
   <rect x="40" y="62" width="12" height="12" fill="#A9BBD0"/>`, s);

const trae = (s: number) => wrap(
  `<rect x="54" y="66" width="12" height="34" rx="3" fill="#9C8466"/>
   <circle cx="60" cy="48" r="30" fill="#8FB0A4"/>
   <circle cx="42" cy="58" r="18" fill="#9DB89A"/><circle cx="78" cy="58" r="18" fill="#9DB89A"/>`, s);

const baal = (s: number) => wrap(
  `<path d="M60 30 C72 46 70 56 60 70 C50 56 48 46 60 30 Z" fill="#D98A5A"/>
   <path d="M60 44 C66 54 65 60 60 70 C55 60 54 54 60 44 Z" fill="#E6C66A"/>
   <g stroke="#9C8466" stroke-width="6" stroke-linecap="round"><line x1="36" y1="92" x2="84" y2="80"/><line x1="36" y1="80" x2="84" y2="92"/></g>`, s);

const oeje = (s: number) => wrap(
  `<ellipse cx="60" cy="60" rx="40" ry="24" fill="#FBF8F1" stroke="#4A4A45" stroke-width="3"/>
   <circle cx="60" cy="60" r="14" fill="#7D8C9E"/><circle cx="60" cy="60" r="6" fill="#4A4A45"/>
   <circle cx="64" cy="56" r="2" fill="#fff"/>`, s);

const bold = (s: number) => wrap(
  `<circle cx="60" cy="60" r="32" fill="#A9BBD0" stroke="#7D8C9E" stroke-width="3"/>
   <path d="M28 60 H92 M60 28 V92" stroke="#7D8C9E" stroke-width="3" fill="none"/>`, s);

const fisk = (s: number) => wrap(
  `<path d="M86 60 L104 46 L104 74 Z" fill="#9DB89A"/>
   <ellipse cx="54" cy="60" rx="34" ry="20" fill="#8FB0A4"/>
   <circle cx="40" cy="55" r="3.5" fill="#4A4A45"/>`, s);

const banan = (s: number) => wrap(
  `<path d="M30 40 C40 84 80 92 96 70 C84 80 50 70 44 38 Z" fill="#E6C66A" stroke="#C9A94E" stroke-width="3"/>`, s);

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
    default: return wrap('<circle cx="60" cy="60" r="30" fill="#E2DDD2"/>', size);
  }
}
```

- [ ] **Step 4: Kør og bekræft PASS**

Run: `npx vitest run tests/pictures.test.ts`
Expected: PASS (alle ord-id'er giver et svg).

- [ ] **Step 5: Commit**

```bash
git add src/ui/pictures.ts tests/pictures.test.ts
git commit -m "feat(words): add calm picture SVGs for the word bank"
```

---

## Task 3: Service — Bogstaver-fremgang

**Files:** Create `src/services/words-progress.ts`, `tests/words-progress.test.ts`

- [ ] **Step 1: Skriv den fejlende test**

```ts
// tests/words-progress.test.ts
import { describe, it, expect } from 'vitest';
import { wordsDefaultState, wordsRecordCorrect } from '../src/services/words-progress';

describe('wordsRecordCorrect', () => {
  it('tæller op uden belønning før tærsklen', () => {
    const r = wordsRecordCorrect(wordsDefaultState(), 1);
    expect(r.state.correctByLevel[1]).toBe(1);
    expect(r.newTrophies).toEqual([]);
    expect(r.leveledUp).toBe(false);
  });

  it('giver trofæ, dino og level-op ved 5 rigtige', () => {
    let res = wordsRecordCorrect(wordsDefaultState(), 1);
    for (let i = 0; i < 4; i++) res = wordsRecordCorrect(res.state, 1);
    expect(res.state.correctByLevel[1]).toBe(5);
    expect(res.newTrophies).toContain('wlvl1-5');
    expect(res.unlockedDino).toBe('wdino-1');
    expect(res.leveledUp).toBe(true);
    expect(res.state.level).toBe(2);
  });

  it('går ikke op over niveau 3', () => {
    const state = { level: 3 as const, correctByLevel: { 1: 0, 2: 0, 3: 4 }, trophies: [], collection: [] };
    const res = wordsRecordCorrect(state, 3);
    expect(res.state.level).toBe(3);
    expect(res.leveledUp).toBe(false);
  });
});
```

- [ ] **Step 2: Kør og bekræft FAIL**

Run: `npx vitest run tests/words-progress.test.ts`
Expected: FAIL — import kan ikke resolves.

- [ ] **Step 3: Implementér**

```ts
// src/services/words-progress.ts
import type { WordLevel } from '../domain/words';
import { getJSON, setJSON } from '../core/storage';

const KEY = 'rl.words.v1';
const THRESHOLD = 5;

export interface WordsState {
  level: WordLevel;
  correctByLevel: Record<WordLevel, number>;
  trophies: string[];
  collection: string[];
}

export interface WordsRecordResult {
  state: WordsState;
  newTrophies: string[];
  unlockedDino: string | null;
  leveledUp: boolean;
}

export function wordsDefaultState(): WordsState {
  return { level: 1, correctByLevel: { 1: 0, 2: 0, 3: 0 }, trophies: [], collection: [] };
}

export function wordsLoad(store: Storage = localStorage): WordsState {
  const s = getJSON<WordsState>(KEY, wordsDefaultState(), store);
  const base = wordsDefaultState();
  return {
    ...base,
    ...s,
    correctByLevel: { ...base.correctByLevel, ...(s.correctByLevel ?? {}) },
  };
}

export function wordsSave(state: WordsState, store: Storage = localStorage): void {
  setJSON(KEY, state, store);
}

export function wordsRecordCorrect(state: WordsState, level: WordLevel): WordsRecordResult {
  const next: WordsState = {
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
    const trophyId = `wlvl${level}-${count}`;
    newTrophies.push(trophyId);
    next.trophies.push(trophyId);
    unlockedDino = `wdino-${next.collection.length + 1}`;
    next.collection.push(unlockedDino);
    if (count === THRESHOLD && level < 3) {
      next.level = (level + 1) as WordLevel;
      leveledUp = true;
    }
  }
  return { state: next, newTrophies, unlockedDino, leveledUp };
}
```

- [ ] **Step 4: Kør og bekræft PASS**

Run: `npx vitest run tests/words-progress.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/words-progress.ts tests/words-progress.test.ts
git commit -m "feat(words): add separate progress track for the letters activity"
```

---

## Task 4: Aktivitet — "Stav ordet" skærm

**Files:** Create `src/activities/words/spell-mode.ts`, `tests/spell-mode.test.ts`; modify `src/styles/base.css`

- [ ] **Step 1: Skriv den fejlende test**

```ts
// tests/spell-mode.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderSpellMode } from '../src/activities/words/spell-mode';
import { AudioService } from '../src/services/audio';

function makeAudio() {
  return new AudioService({ speak: vi.fn(), cancel: vi.fn() }, vi.fn());
}
function tap(root: HTMLElement, letter: string) {
  const btn = Array.from(root.querySelectorAll<HTMLButtonElement>('.tray-tile'))
    .find((b) => b.textContent === letter && !b.dataset.used);
  btn!.dataset.used = '1';
  btn!.click();
}

describe('renderSpellMode', () => {
  it('viser ét felt pr. bogstav (niveau 1 => ordet "sol")', () => {
    const root = document.createElement('div');
    renderSpellMode(root, 1, { audio: makeAudio(), rng: () => 0, onCorrect: vi.fn() });
    expect(root.querySelectorAll('.slot').length).toBe(3);
  });

  it('kalder onCorrect når ordet staves i rigtig rækkefølge', () => {
    const root = document.createElement('div');
    const onCorrect = vi.fn();
    renderSpellMode(root, 1, { audio: makeAudio(), rng: () => 0, onCorrect });
    // rng=()=>0 => ordet er "sol"
    for (const ch of 'sol') {
      const btn = Array.from(root.querySelectorAll<HTMLButtonElement>('.tray-tile'))
        .find((b) => b.textContent === ch)!;
      btn.click();
    }
    expect(onCorrect).toHaveBeenCalledWith(1);
    expect(onCorrect).toHaveBeenCalledTimes(1);
  });

  it('fylder ikke ved forkert bogstav', () => {
    const root = document.createElement('div');
    const onCorrect = vi.fn();
    renderSpellMode(root, 1, { audio: makeAudio(), rng: () => 0, onCorrect });
    // "sol": forkert første tryk er alt andet end "s"
    const wrong = Array.from(root.querySelectorAll<HTMLButtonElement>('.tray-tile'))
      .find((b) => b.textContent !== 's')!;
    wrong.click();
    expect(root.querySelectorAll('.slot--filled').length).toBe(0);
    expect(onCorrect).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Kør og bekræft FAIL**

Run: `npx vitest run tests/spell-mode.test.ts`
Expected: FAIL — import kan ikke resolves.

- [ ] **Step 3: Implementér**

```ts
// src/activities/words/spell-mode.ts
import {
  pickWord, shuffledLetters, isCorrectNext, isComplete,
  WORD_LEVELS, type WordLevel, type Rng,
} from '../../domain/words';
import { pictureSvg } from '../../ui/pictures';
import { owlSvg } from '../../ui/mascot';
import { h, svgEl, empty } from '../../core/dom';
import type { AudioService } from '../../services/audio';

export interface SpellModeDeps {
  audio: AudioService;
  rng: Rng;
  onCorrect: (level: WordLevel) => void;
}

export function renderSpellMode(container: HTMLElement, level: WordLevel, deps: SpellModeDeps): void {
  const entry = pickWord(level, deps.rng);
  const word = entry.word;
  const cfg = WORD_LEVELS[level];
  let typed = '';
  let tray = shuffledLetters(word, deps.rng);
  let done = false;

  const owlRow = h('div', { class: 'owl-row' }, [
    svgEl(owlSvg(1, 56)),
    h('div', { class: 'speech' }, ['Stav ordet 🔊']),
  ]);
  const picture = h('div', { class: 'word-picture' }, [svgEl(pictureSvg(entry.picture, 120))]);
  const guide = h('div', { class: cfg.showWord ? 'word-guide' : 'word-guide word-guide--hidden' }, [word]);
  const questionZone = h('div', { class: 'question-zone' }, [owlRow, picture, guide]);

  const slotsEl = h('div', { class: 'slots' });
  const trayEl = h('div', { class: 'tray' });
  const answerZone = h('div', { class: 'answer-zone' }, [
    h('div', { class: 'answer-label' }, ['Tryk bogstaverne i rækkefølge']),
    slotsEl,
    trayEl,
  ]);

  function update(): void {
    empty(slotsEl);
    for (let i = 0; i < word.length; i++) {
      const filled = i < typed.length;
      slotsEl.append(h('div', { class: filled ? 'slot slot--filled' : 'slot' }, [filled ? typed[i] : '']));
    }
    empty(trayEl);
    tray.forEach((letter, idx) => {
      const tile = h('button', { class: 'tray-tile' }, [letter]);
      tile.addEventListener('click', () => onTile(letter, idx, tile));
      tile.addEventListener('animationend', () => tile.classList.remove('tray-tile--wrong'));
      trayEl.append(tile);
    });
  }

  function onTile(letter: string, idx: number, tile: HTMLElement): void {
    if (done) return;
    if (isCorrectNext(word, typed, letter)) {
      typed += letter;
      tray.splice(idx, 1);
      update();
      if (isComplete(word, typed)) {
        done = true;
        deps.audio.speak(word);
        deps.audio.playCorrect();
        deps.onCorrect(level);
      }
    } else {
      tile.classList.add('tray-tile--wrong');
    }
  }

  empty(container);
  container.append(questionZone, answerZone);
  update();
  deps.audio.speak(word);
}
```

- [ ] **Step 4: Kør og bekræft PASS**

Run: `npx vitest run tests/spell-mode.test.ts`
Expected: PASS.

- [ ] **Step 5: Append CSS til `src/styles/base.css`**

```css
/* Bogstaver — Stav ordet */
.word-picture { margin: 6px 0; }
.word-guide { font-family: var(--font-head); font-size: 28px; letter-spacing: 6px; color: var(--text); min-height: 34px; }
.word-guide--hidden { visibility: hidden; }
.slots { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-bottom: 16px; }
.slot {
  width: 48px; height: 56px; border-radius: 10px; background: var(--surface-soft);
  border: 1.5px solid var(--border); display: flex; align-items: center; justify-content: center;
  font-family: var(--font-head); font-size: 26px; color: var(--text);
}
.slot--filled { background: #EAF1ED; border-color: var(--clock); }
.tray { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
.tray-tile {
  width: 56px; height: 56px; border-radius: 12px; background: var(--white);
  border: 1.5px solid var(--border); font-family: var(--font-head); font-size: 24px;
  color: var(--text); box-shadow: var(--shadow-md);
}
.tray-tile--wrong { animation: wobble 0.3s ease; border-color: var(--accent-warm); }
@keyframes wobble { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
```

- [ ] **Step 6: Commit**

```bash
git add src/activities/words/spell-mode.ts tests/spell-mode.test.ts src/styles/base.css
git commit -m "feat(words): add 'spell the word' screen"
```

---

## Task 5: Aktivitet — orkestrator

**Files:** Create `src/activities/words/words-activity.ts`

Genbruger de eksisterende topbar/aktivitet-styles fra v1 (`.activity`, `.topbar`, `.back`, `.level-pill`, `.trophy-count`) — ingen ny CSS nødvendig.

- [ ] **Step 1: Implementér**

```ts
// src/activities/words/words-activity.ts
import type { Activity } from '../../core/activity';
import { WORD_LEVELS, type WordLevel } from '../../domain/words';
import { renderSpellMode } from './spell-mode';
import { trophySvg } from '../../ui/icons';
import { h, svgEl, empty } from '../../core/dom';
import type { AudioService } from '../../services/audio';
import { wordsLoad, wordsSave, wordsRecordCorrect, type WordsState } from '../../services/words-progress';

export interface WordsActivityDeps {
  audio: AudioService;
  rng: () => number;
  onExit: () => void;
}

export class WordsActivity implements Activity {
  readonly id = 'words';
  private container: HTMLElement | null = null;
  private state: WordsState = wordsLoad();
  private pendingRedraw?: number;

  constructor(private deps: WordsActivityDeps) {}

  mount(container: HTMLElement): void {
    this.container = container;
    this.render();
  }

  unmount(): void {
    if (this.pendingRedraw !== undefined) {
      window.clearTimeout(this.pendingRedraw);
      this.pendingRedraw = undefined;
    }
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
      h('div', { class: 'level-pill' }, [`Niveau ${level} · ${WORD_LEVELS[level].label}`]),
      trophyCount,
    ]);

    const body = h('div', { class: 'activity-body' });
    const wrapper = h('div', { class: 'activity' }, [topbar, body]);

    empty(c);
    c.append(wrapper);

    renderSpellMode(body, level, {
      audio: this.deps.audio,
      rng: this.deps.rng,
      onCorrect: (lvl: WordLevel) => this.onCorrect(lvl),
    });
  }

  private onCorrect(level: WordLevel): void {
    const res = wordsRecordCorrect(this.state, level);
    this.state = res.state;
    wordsSave(this.state);
    if (this.pendingRedraw !== undefined) window.clearTimeout(this.pendingRedraw);
    this.pendingRedraw = window.setTimeout(() => {
      this.pendingRedraw = undefined;
      this.render();
    }, 1600);
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: ingen fejl.

- [ ] **Step 3: Commit**

```bash
git add src/activities/words/words-activity.ts
git commit -m "feat(words): add letters activity orchestrator"
```

---

## Task 6: Wiring — forside + router

**Files:** Modify `src/ui/home.ts`, `src/main.ts`

- [ ] **Step 1: Erstat indholdet af `src/ui/home.ts`**

```ts
// src/ui/home.ts
import { owlSvg } from './mascot';
import { trophySvg } from './icons';
import { h, svgEl, empty } from '../core/dom';
import { load, owlRank } from '../services/progress';
import { wordsLoad } from '../services/words-progress';

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
  const clock = load();
  const words = wordsLoad();
  const rank = Math.max(owlRank(clock), words.level);
  const totalTrophies = clock.trophies.length + words.trophies.length;

  const brand = h('div', { class: 'brand' }, [svgEl(owlSvg(rank, 44)), h('span', {}, ['Mine Lærespil'])]);
  const gear = h('button', { class: 'gear', 'aria-label': 'Forælder' }, ['⚙']);
  const trophies = h('div', { class: 'home-trophies' }, [svgEl(trophySvg()), ` ${totalTrophies}`, gear]);
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

  // Forælder-hjørne: tryk-og-hold (600 ms)
  let timer: number | undefined;
  const start = () => { timer = window.setTimeout(() => deps.onParent(), 600); };
  const cancel = () => { if (timer) window.clearTimeout(timer); };
  gear.addEventListener('pointerdown', start);
  gear.addEventListener('pointerup', cancel);
  gear.addEventListener('pointerleave', cancel);
}
```

- [ ] **Step 2: Erstat indholdet af `src/main.ts`**

```ts
// src/main.ts
import './styles/tokens.css';
import './styles/base.css';
import { Router } from './core/router';
import { AudioService } from './services/audio';
import { renderHome } from './ui/home';
import { renderParentCorner } from './parent/parent-corner';
import { ClockActivity } from './activities/clock/clock-activity';
import { WordsActivity } from './activities/words/words-activity';

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
        } else if (id === 'letters') {
          router.showActivity(new WordsActivity({ audio, rng, onExit: goHome }));
        }
        // 'numbers' kommer i v3.
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

- [ ] **Step 3: Verificér hele flowet**

Run: `npm run build` (forventes at lykkes) og `npm test` (alle suiter grønne) og `npm run typecheck` (ren).
Manuelt (valgfrit): `npm run dev`, åbn forsiden, tryk **Bogstaver** → stave-skærm; stav fx "sol"; uglen siger ordet; fremgang vises. "‹ Hjem" → tilbage. Klokken virker stadig.

- [ ] **Step 4: Commit**

```bash
git add src/ui/home.ts src/main.ts
git commit -m "feat(words): wire letters activity into home and router"
```

---

## Task 7: Dokumentation + versionsbump

**Files:** Modify `package.json`, `CHANGELOG.md`, `README.md`

- [ ] **Step 1: Bump version i `package.json`** — ændr linjen `"version": "0.1.0",` til:

```json
  "version": "0.2.0",
```

- [ ] **Step 2: Tilføj øverst i `CHANGELOG.md`** (lige efter Semantic Versioning-linjen, før `## [0.1.0]`):

```markdown
## [0.2.0] - 2026-06-10

### Added
- Bogstaver-aktivitet med spillet "Stav ordet": rolig tegning + tomme felter + blandede bogstavbrikker
- Niveauer (ord vist på niveau 1, skjult fra niveau 2; ordlængde 3 → 4 → 5)
- Ordliste med billeder (sol, kat, hus, træ, bål, øje, ugle, dino, bold, fisk, cykel, banan)
- Separat fremgangsspor for Bogstaver; forsidens trofætæller summerer begge aktiviteter

```

- [ ] **Step 3: Opdatér `README.md`** — under "## Funktioner (v1)" tilføj en linje i listen:

```markdown
- Bogstaver: "Stav ordet" — byg korte ord ud fra en tegning (niveauer med stigende sværhed)
```

- [ ] **Step 4: Fuld verifikation**

Run: `npm test` → alle tests grønne (klokke + bogstaver).
Run: `npm run typecheck` → ren.
Run: `npm run build` → success.

- [ ] **Step 5: Commit**

```bash
git add package.json CHANGELOG.md README.md
git commit -m "docs: bump to v0.2.0 and document the letters activity"
```

---

## Self-Review (udført under planlægningen)

**Spec-dækning:**
- Formål / ét spil "Stav ordet" → Task 4. ✓
- Interaktion (tegning + tomme felter + blandede brikker, tryk i rækkefølge, blid fejl, færdig-ophold) → Task 4 (spell-mode) + Task 5 (1600 ms ophold). ✓
- Små bogstaver; ord vist niveau 1 → skjult niveau 2+; længde 3→4→5 → Task 1 (WORD_LEVELS, wordsForLevel) + Task 4 (guide-visning). ✓
- Ordliste m. favoritter + æ/ø/å → Task 1 (WORDS: træ/bål/øje + ugle/dino/cykel). ✓
- Eget fremgangsspor (rl.words.v1), klokken uberørt → Task 3. ✓
- Forsidens trofætæller summerer → Task 6 (home). ✓
- Lyd: uglen læser ordet + ros, mute → Task 4 (audio.speak(word), playCorrect) genbruger AudioService. ✓
- Genbrug af skal/dom/audio/mascot/tokens → Task 4/5/6. ✓
- Test (stave-logik, fremgang, DOM) → Task 1, 3, 4. ✓
- Tegninger pr. ord → Task 2 (+ test sikrer fuld dækning). ✓
- Leverance branch + v0.2.0 → Task 7 + PR-flow. ✓

**Placeholder-scan:** Ingen TBD/TODO. `pictureSvg` har en `default`-figur, men alle ord-id'er i WORDS er eksplicit dækket (test verificerer det). Al kode er konkret.

**Type-konsistens:** `WordLevel`, `Rng`, `WordEntry`, `WORD_LEVELS`, `WORDS` (words.ts) bruges ens i pictures/spell-mode/words-activity. `WordsState`/`WordsRecordResult` (words-progress) bruges i words-activity og home. `renderSpellMode(container, level, {audio, rng, onCorrect})` matcher kaldet i words-activity. `pictureSvg(id, size?)` matcher kaldet i spell-mode. Genbrugte v1-eksporter (`Activity`, `h/svgEl/empty`, `AudioService`, `owlSvg`, `trophySvg`, `load/owlRank`) bruges med deres eksisterende signaturer. ✓

---

## Næste skridt efter v2
- v3: Tal & tælle (dino-tælling) — overvej da at samle klokke- og bogstav-fremgang i én aktivitets-generisk model.
- Flere ord/tegninger; evt. distraktor-bogstaver i bakken som ekstra sværhedsgrad.
- De øvrige bogstav-måder (find ordet, match STORE/små).
