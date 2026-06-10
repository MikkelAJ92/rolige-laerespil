# Progression & level-op (Spor A) Implementeringsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gør gamification rolig-belønnende: én generisk fremgangsmodel (med migration af eksisterende data), en fremgangsbar, et level-op-kort, en besøgbar "Min samling"-skærm og uglens rang-navne.

**Architecture:** `services/progress.ts` omskrives til en generisk model nøglet pr. aktivitet (`clock`/`words`/senere `tal`) og migrerer gamle nøgler. Fordi fremgangs-API'et ændrer form, sker omskrivningen + rewiring af alle forbrugere (clock-/words-activity, home, main) + den nye samlings-skærm som **én atomar opgave (Task 4)**, så testene er grønne ved hver opgavegrænse. Tre rene, selvstændige UI/domæne-enheder (ranks, progress-bar, level-up-card) bygges først.

**Tech Stack:** Vite, TypeScript, Vitest + jsdom, ren CSS, SVG. Branch: `feat/progression`.

---

## Filstruktur

```
src/
  domain/ranks.ts                 # NY: rankName(level)
  ui/progress-bar.ts              # NY: progressBar(current, threshold)
  ui/level-up-card.ts             # NY: showLevelUpCard(opts)
  ui/collection.ts                # NY: renderCollection(container, {onBack})
  services/progress.ts            # OMSKRIVES: generisk model + migration
  services/words-progress.ts      # SLETTES
  activities/clock/clock-activity.ts  # ÆNDRES: generisk API + bar + kort
  activities/words/words-activity.ts  # ÆNDRES: generisk API + bar + kort
  ui/home.ts                      # ÆNDRES: aggregater + "Min samling"
  main.ts                         # ÆNDRES: rut 'collection'
  styles/base.css                 # ÆNDRES (append): bar, kort, samling
tests/
  ranks.test.ts                   # NY
  progress-bar.test.ts            # NY
  level-up-card.test.ts           # NY
  collection.test.ts              # NY
  progress.test.ts                # OMSKRIVES (generisk + migration)
  words-progress.test.ts          # SLETTES
```
Urørt: `domain/{clock-levels,clock-math,time-to-danish,words}`, `activities/clock/{clock-face,read-mode,set-mode}`, `activities/words/spell-mode`, `ui/{mascot,icons,pictures,uid}`, `core/*`, `parent/*`, `services/audio`, `services/storage`.

---

## Task 1: Rang-navne

**Files:** Create `src/domain/ranks.ts`, `tests/ranks.test.ts`

- [ ] **Step 1: Skriv den fejlende test**

```ts
// tests/ranks.test.ts
import { describe, it, expect } from 'vitest';
import { rankName } from '../src/domain/ranks';

describe('rankName', () => {
  it('mapper niveau til navn', () => {
    expect(rankName(1)).toBe('Ugle-ven');
    expect(rankName(2)).toBe('Klog ugle');
    expect(rankName(3)).toBe('Vis ugle');
    expect(rankName(4)).toBe('Mester-ugle');
  });
  it('niveau over 4 er stadig Mester-ugle, under 1 er Ugle-ven', () => {
    expect(rankName(7)).toBe('Mester-ugle');
    expect(rankName(0)).toBe('Ugle-ven');
  });
});
```

- [ ] **Step 2: Kør og bekræft FAIL**

Run: `npx vitest run tests/ranks.test.ts`
Expected: FAIL — import kan ikke resolves.

- [ ] **Step 3: Implementér**

```ts
// src/domain/ranks.ts
/** Uglens rang-navn ud fra niveau. */
export function rankName(level: number): string {
  if (level <= 1) return 'Ugle-ven';
  if (level === 2) return 'Klog ugle';
  if (level === 3) return 'Vis ugle';
  return 'Mester-ugle';
}
```

- [ ] **Step 4: Kør og bekræft PASS**

Run: `npx vitest run tests/ranks.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/ranks.ts tests/ranks.test.ts
git commit -m "feat(progress): add owl rank names"
```

---

## Task 2: Fremgangsbar

**Files:** Create `src/ui/progress-bar.ts`, `tests/progress-bar.test.ts`

- [ ] **Step 1: Skriv den fejlende test**

```ts
// tests/progress-bar.test.ts
import { describe, it, expect } from 'vitest';
import { progressBar } from '../src/ui/progress-bar';

describe('progressBar', () => {
  it('fylder efter fremgang og viser hvor mange flere', () => {
    const el = progressBar(3, 5);
    expect(el.querySelector('.pbar-fill')!.getAttribute('style')).toContain('60%');
    expect(el.textContent).toContain('2 mere');
  });
  it('er tom ved 0', () => {
    const el = progressBar(0, 5);
    expect(el.querySelector('.pbar-fill')!.getAttribute('style')).toContain('0%');
    expect(el.textContent).toContain('5 mere');
  });
});
```

- [ ] **Step 2: Kør og bekræft FAIL**

Run: `npx vitest run tests/progress-bar.test.ts`
Expected: FAIL — import kan ikke resolves.

- [ ] **Step 3: Implementér**

```ts
// src/ui/progress-bar.ts
import { h, svgEl } from '../core/dom';
import { trophySvg } from './icons';

/** Bar mod næste trofæ. current = rigtige svar på nuværende niveau. */
export function progressBar(current: number, threshold = 5): HTMLElement {
  const done = current % threshold;
  const remaining = threshold - done;
  const pct = (done / threshold) * 100;

  const fill = h('div', { class: 'pbar-fill', style: `width:${pct}%` });
  const bar = h('div', { class: 'pbar' }, [fill]);
  const label = h('span', { class: 'pbar-label' }, [svgEl(trophySvg('#CBA15A', 16)), ` ${remaining} mere`]);
  return h('div', { class: 'pbar-wrap' }, [bar, label]);
}
```

- [ ] **Step 4: Kør og bekræft PASS**

Run: `npx vitest run tests/progress-bar.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/progress-bar.ts tests/progress-bar.test.ts
git commit -m "feat(ui): add progress bar toward next trophy"
```

---

## Task 3: Level-op-kort

**Files:** Create `src/ui/level-up-card.ts`, `tests/level-up-card.test.ts`

- [ ] **Step 1: Skriv den fejlende test**

```ts
// tests/level-up-card.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { showLevelUpCard } from '../src/ui/level-up-card';

afterEach(() => {
  document.querySelectorAll('.levelup-overlay').forEach((e) => e.remove());
});

describe('showLevelUpCard', () => {
  it('viser niveau + rang og kan lukkes med Videre', () => {
    const onClose = vi.fn();
    showLevelUpCard({ level: 2, rankName: 'Klog ugle', owlMarkup: '<svg width="10" height="10"></svg>', onClose });

    const overlay = document.querySelector('.levelup-overlay');
    expect(overlay).not.toBeNull();
    expect(overlay!.textContent).toContain('Niveau 2!');
    expect(overlay!.textContent).toContain('Klog ugle');

    overlay!.querySelector<HTMLButtonElement>('.levelup-next')!.click();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.levelup-overlay')).toBeNull();
  });
});
```

- [ ] **Step 2: Kør og bekræft FAIL**

Run: `npx vitest run tests/level-up-card.test.ts`
Expected: FAIL — import kan ikke resolves.

- [ ] **Step 3: Implementér**

```ts
// src/ui/level-up-card.ts
import { h, svgEl } from '../core/dom';
import { trophySvg } from './icons';

export interface LevelUpOpts {
  level: number;
  rankName: string;
  owlMarkup: string;
  dinoMarkup?: string;
  onClose: () => void;
}

/** Viser et roligt fejrings-kort som overlay. "Videre" lukker det. */
export function showLevelUpCard(opts: LevelUpOpts): HTMLElement {
  const next = h('button', { class: 'levelup-next' }, ['Videre']);

  const rewards: HTMLElement[] = [];
  if (opts.dinoMarkup) {
    rewards.push(h('div', { class: 'levelup-reward' }, [svgEl(opts.dinoMarkup), h('div', { class: 'levelup-reward-label' }, ['Ny dino!'])]));
  }
  rewards.push(h('div', { class: 'levelup-reward' }, [svgEl(trophySvg('#CBA15A', 34)), h('div', { class: 'levelup-reward-label' }, ['Trofæ!'])]));

  const card = h('div', { class: 'levelup-card' }, [
    svgEl(opts.owlMarkup),
    h('div', { class: 'levelup-title' }, [`Niveau ${opts.level}!`]),
    h('div', { class: 'levelup-rank' }, [opts.rankName]),
    h('div', { class: 'levelup-rewards' }, rewards),
    next,
  ]);

  const overlay = h('div', { class: 'levelup-overlay' }, [card]);
  next.addEventListener('click', () => {
    overlay.remove();
    opts.onClose();
  });
  document.body.append(overlay);
  return overlay;
}
```

- [ ] **Step 4: Kør og bekræft PASS**

Run: `npx vitest run tests/level-up-card.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/level-up-card.ts tests/level-up-card.test.ts
git commit -m "feat(ui): add level-up celebration card"
```

---

## Task 4: Generisk fremgangsmodel + atomar rewiring + samling

Dette er én samlet ændring (skema-skiftet bryder forbrugerne, så alt skiftes på én gang). Skriv alle filer, kør så hele testpakken, og lav ét commit.

**Files:**
- Modify (rewrite): `src/services/progress.ts`, `tests/progress.test.ts`
- Delete: `src/services/words-progress.ts`, `tests/words-progress.test.ts`
- Create: `src/ui/collection.ts`, `tests/collection.test.ts`
- Modify (rewrite): `src/activities/clock/clock-activity.ts`, `src/activities/words/words-activity.ts`, `src/ui/home.ts`, `src/main.ts`
- Modify (append): `src/styles/base.css`

- [ ] **Step 1: Omskriv `tests/progress.test.ts`**

```ts
// tests/progress.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { recordCorrect, totalTrophies, overallRank, allDinos, load, type ProgressState } from '../src/services/progress';

function emptyState(): ProgressState {
  return { activities: {} };
}

describe('recordCorrect', () => {
  it('giver trofæ, dino og level-op ved 5 i en aktivitet', () => {
    let res = recordCorrect(emptyState(), 'clock', 1, 4);
    for (let i = 0; i < 4; i++) res = recordCorrect(res.state, 'clock', 1, 4);
    const a = res.state.activities.clock;
    expect(a.correctByLevel[1]).toBe(5);
    expect(res.newTrophies).toContain('clock-lvl1-5');
    expect(res.unlockedDino).toBe('clock-dino-1');
    expect(res.leveledUp).toBe(true);
    expect(a.level).toBe(2);
  });
  it('level-op kun under maxLevel', () => {
    const s: ProgressState = { activities: { words: { level: 3, correctByLevel: { 3: 4 }, trophies: [], collection: [] } } };
    const res = recordCorrect(s, 'words', 3, 3);
    expect(res.state.activities.words.level).toBe(3);
    expect(res.leveledUp).toBe(false);
  });
  it('holder aktiviteter adskilt', () => {
    let res = recordCorrect(emptyState(), 'clock', 1, 4);
    res = recordCorrect(res.state, 'words', 1, 3);
    expect(res.state.activities.clock.correctByLevel[1]).toBe(1);
    expect(res.state.activities.words.correctByLevel[1]).toBe(1);
  });
});

describe('aggregater', () => {
  const s: ProgressState = {
    activities: {
      clock: { level: 2, correctByLevel: {}, trophies: ['a', 'b'], collection: ['d1'] },
      words: { level: 1, correctByLevel: {}, trophies: ['c'], collection: ['d2'] },
    },
  };
  it('totalTrophies summerer', () => expect(totalTrophies(s)).toBe(3));
  it('overallRank er højeste niveau', () => expect(overallRank(s)).toBe(2));
  it('allDinos samler alle', () => expect(allDinos(s).sort()).toEqual(['d1', 'd2']));
});

describe('load + migration', () => {
  beforeEach(() => localStorage.clear());

  it('migrerer gamle v1-nøgler', () => {
    localStorage.setItem('rl.progress.v1', JSON.stringify({ level: 2, correctByLevel: { 1: 5, 2: 1 }, trophies: ['lvl1-5'], collection: ['dino-1'] }));
    localStorage.setItem('rl.words.v1', JSON.stringify({ level: 1, correctByLevel: { 1: 2 }, trophies: [], collection: [] }));
    const s = load();
    expect(s.activities.clock.level).toBe(2);
    expect(s.activities.clock.trophies).toContain('lvl1-5');
    expect(s.activities.words.correctByLevel[1]).toBe(2);
    expect(totalTrophies(s)).toBe(1);
  });

  it('foretrækker v2 hvis den findes', () => {
    localStorage.setItem('rl.progress.v2', JSON.stringify({ activities: { clock: { level: 3, correctByLevel: {}, trophies: [], collection: [] } } }));
    localStorage.setItem('rl.progress.v1', JSON.stringify({ level: 1, correctByLevel: {}, trophies: [], collection: [] }));
    expect(load().activities.clock.level).toBe(3);
  });

  it('giver tom state uden gemte data', () => {
    expect(load().activities).toEqual({});
  });
});
```

- [ ] **Step 2: Kør og bekræft FAIL**

Run: `npx vitest run tests/progress.test.ts`
Expected: FAIL (gammelt `progress.ts` har ikke det generiske API).

- [ ] **Step 3: Omskriv `src/services/progress.ts`**

```ts
// src/services/progress.ts
import { getJSON, setJSON } from '../core/storage';

const KEY = 'rl.progress.v2';
const OLD_CLOCK_KEY = 'rl.progress.v1';
const OLD_WORDS_KEY = 'rl.words.v1';
const THRESHOLD = 5;

export interface ActivityProgress {
  level: number;
  correctByLevel: Record<number, number>;
  trophies: string[];
  collection: string[];
}

export interface ProgressState {
  activities: Record<string, ActivityProgress>;
}

export interface RecordResult {
  state: ProgressState;
  newTrophies: string[];
  unlockedDino: string | null;
  leveledUp: boolean;
}

export function defaultActivity(): ActivityProgress {
  return { level: 1, correctByLevel: {}, trophies: [], collection: [] };
}

export function getActivity(state: ProgressState, id: string): ActivityProgress {
  return state.activities[id] ?? defaultActivity();
}

function normalize(o: Partial<ActivityProgress> | null | undefined): ActivityProgress {
  const base = defaultActivity();
  if (!o) return base;
  return {
    level: typeof o.level === 'number' ? o.level : base.level,
    correctByLevel: { ...(o.correctByLevel ?? {}) },
    trophies: Array.isArray(o.trophies) ? [...o.trophies] : [],
    collection: Array.isArray(o.collection) ? [...o.collection] : [],
  };
}

export function load(store: Storage = localStorage): ProgressState {
  const existing = getJSON<ProgressState | null>(KEY, null, store);
  if (existing && existing.activities) {
    const activities: Record<string, ActivityProgress> = {};
    for (const [id, a] of Object.entries(existing.activities)) activities[id] = normalize(a);
    return { activities };
  }
  // Migrér gamle v1-nøgler.
  const activities: Record<string, ActivityProgress> = {};
  const oldClock = getJSON<Partial<ActivityProgress> | null>(OLD_CLOCK_KEY, null, store);
  if (oldClock) activities.clock = normalize(oldClock);
  const oldWords = getJSON<Partial<ActivityProgress> | null>(OLD_WORDS_KEY, null, store);
  if (oldWords) activities.words = normalize(oldWords);
  const migrated: ProgressState = { activities };
  if (oldClock || oldWords) save(migrated, store);
  return migrated;
}

export function save(state: ProgressState, store: Storage = localStorage): void {
  setJSON(KEY, state, store);
}

export function recordCorrect(state: ProgressState, id: string, level: number, maxLevel: number): RecordResult {
  const prev = getActivity(state, id);
  const next: ActivityProgress = {
    level: prev.level,
    correctByLevel: { ...prev.correctByLevel },
    trophies: [...prev.trophies],
    collection: [...prev.collection],
  };
  next.correctByLevel[level] = (next.correctByLevel[level] ?? 0) + 1;
  const count = next.correctByLevel[level];

  const newTrophies: string[] = [];
  let unlockedDino: string | null = null;
  let leveledUp = false;

  if (count % THRESHOLD === 0) {
    const trophyId = `${id}-lvl${level}-${count}`;
    newTrophies.push(trophyId);
    next.trophies.push(trophyId);
    unlockedDino = `${id}-dino-${next.collection.length + 1}`;
    next.collection.push(unlockedDino);
    if (count === THRESHOLD && level < maxLevel) {
      next.level = level + 1;
      leveledUp = true;
    }
  }

  return {
    state: { activities: { ...state.activities, [id]: next } },
    newTrophies,
    unlockedDino,
    leveledUp,
  };
}

export function totalTrophies(state: ProgressState): number {
  return Object.values(state.activities).reduce((sum, a) => sum + a.trophies.length, 0);
}

export function allDinos(state: ProgressState): string[] {
  return Object.values(state.activities).flatMap((a) => a.collection);
}

export function overallRank(state: ProgressState): number {
  const levels = Object.values(state.activities).map((a) => a.level);
  return levels.length ? Math.max(1, ...levels) : 1;
}
```

- [ ] **Step 4: Kør og bekræft PASS for progress**

Run: `npx vitest run tests/progress.test.ts`
Expected: PASS.

- [ ] **Step 5: Slet det gamle words-progress-modul + test**

```bash
git rm src/services/words-progress.ts tests/words-progress.test.ts
```

- [ ] **Step 6: Opret `tests/collection.test.ts`**

```ts
// tests/collection.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderCollection } from '../src/ui/collection';

describe('renderCollection', () => {
  beforeEach(() => localStorage.clear());

  it('viser rang-navn og optjente trofæer/dinoer', () => {
    localStorage.setItem('rl.progress.v2', JSON.stringify({
      activities: { clock: { level: 2, correctByLevel: {}, trophies: ['clock-lvl1-5'], collection: ['clock-dino-1'] } },
    }));
    const root = document.createElement('div');
    renderCollection(root, { onBack: () => {} });
    expect(root.textContent).toContain('Klog ugle');
    expect(root.querySelectorAll('.col-trophy').length).toBe(1);
    expect(root.querySelectorAll('.col-dino').length).toBe(1);
  });
});
```

- [ ] **Step 7: Opret `src/ui/collection.ts`**

```ts
// src/ui/collection.ts
import { h, svgEl, empty } from '../core/dom';
import { owlSvg } from './mascot';
import { trophySvg, dinoSvg } from './icons';
import { rankName } from '../domain/ranks';
import { load, totalTrophies, allDinos, overallRank } from '../services/progress';

export interface CollectionDeps {
  onBack: () => void;
}

const LOCKED_SLOTS = 3; // antydning af "mere at samle"

export function renderCollection(container: HTMLElement, deps: CollectionDeps): void {
  const state = load();
  const rank = overallRank(state);
  const trophies = totalTrophies(state);
  const dinos = allDinos(state).length;

  const back = h('button', { class: 'back' }, ['‹ Hjem']);
  back.addEventListener('click', () => deps.onBack());

  const head = h('div', { class: 'col-head' }, [
    svgEl(owlSvg(rank, 64)),
    h('div', {}, [
      h('div', { class: 'col-title' }, ['Min samling']),
      h('div', { class: 'col-rank' }, [`Ugo — "${rankName(rank)}"`]),
    ]),
  ]);

  const trophyGrid = h('div', { class: 'col-grid' });
  for (let i = 0; i < trophies; i++) trophyGrid.append(h('span', { class: 'col-trophy' }, [svgEl(trophySvg('#CBA15A', 30))]));
  for (let i = 0; i < LOCKED_SLOTS; i++) trophyGrid.append(h('span', { class: 'col-locked' }, [svgEl(trophySvg('#C9C2B4', 30))]));

  const dinoGrid = h('div', { class: 'col-grid' });
  const dinoColors = ['#9DB89A', '#C99A78', '#9AB0C4', '#A6938A'];
  for (let i = 0; i < dinos; i++) dinoGrid.append(h('span', { class: 'col-dino' }, [svgEl(dinoSvg(dinoColors[i % dinoColors.length], 44))]));
  for (let i = 0; i < LOCKED_SLOTS; i++) dinoGrid.append(h('span', { class: 'col-locked' }, [svgEl(dinoSvg('#C9C2B4', 44))]));

  const wrapper = h('div', { class: 'activity' }, [
    h('div', { class: 'topbar' }, [back, h('div', {}, []), h('div', {}, [])]),
    h('div', { class: 'collection' }, [
      head,
      h('div', { class: 'col-section' }, [h('div', { class: 'label' }, ['Trofæer']), trophyGrid]),
      h('div', { class: 'col-section' }, [h('div', { class: 'label' }, ['Dinoer']), dinoGrid]),
    ]),
  ]);

  empty(container);
  container.append(wrapper);
}
```

- [ ] **Step 8: Omskriv `src/activities/clock/clock-activity.ts`**

```ts
// src/activities/clock/clock-activity.ts
import type { Activity } from '../../core/activity';
import { LEVELS, type ClockLevel } from '../../domain/clock-levels';
import { renderReadMode } from './read-mode';
import { renderSetMode } from './set-mode';
import { trophySvg } from '../../ui/icons';
import { owlSvg } from '../../ui/mascot';
import { progressBar } from '../../ui/progress-bar';
import { showLevelUpCard } from '../../ui/level-up-card';
import { rankName } from '../../domain/ranks';
import { h, svgEl, empty } from '../../core/dom';
import type { AudioService } from '../../services/audio';
import { load, save, recordCorrect, getActivity, overallRank, type ProgressState } from '../../services/progress';

const ACTIVITY = 'clock';
const MAX_LEVEL = 4;

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
  private pendingRedraw?: number;

  constructor(private deps: ClockActivityDeps) {}

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
    const act = getActivity(this.state, ACTIVITY);
    const level = act.level as ClockLevel;

    const back = h('button', { class: 'back' }, ['‹ Hjem']);
    back.addEventListener('click', () => this.deps.onExit());
    const trophyCount = h('div', { class: 'trophy-count' }, [svgEl(trophySvg()), ` ${act.trophies.length}`]);
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
    const wrapper = h('div', { class: 'activity' }, [
      topbar,
      h('div', { class: 'progress-row' }, [progressBar(act.correctByLevel[level] ?? 0)]),
      modeSwitch,
      body,
    ]);

    empty(c);
    c.append(wrapper);

    const deps = { audio: this.deps.audio, rng: this.deps.rng, onCorrect: (lvl: ClockLevel) => this.onCorrect(lvl) };
    if (this.mode === 'read') renderReadMode(body, level, deps);
    else renderSetMode(body, level, deps);
  }

  private onCorrect(level: ClockLevel): void {
    const res = recordCorrect(this.state, ACTIVITY, level, MAX_LEVEL);
    this.state = res.state;
    save(this.state);
    if (this.pendingRedraw !== undefined) window.clearTimeout(this.pendingRedraw);

    if (res.leveledUp) {
      const rank = overallRank(this.state);
      const newLevel = getActivity(this.state, ACTIVITY).level;
      this.deps.audio.speak(`Godt klaret! Nu er du på niveau ${newLevel}`);
      this.deps.audio.playCorrect();
      showLevelUpCard({
        level: newLevel,
        rankName: rankName(rank),
        owlMarkup: owlSvg(rank, 96, 'happy'),
        onClose: () => this.render(),
      });
    } else {
      this.pendingRedraw = window.setTimeout(() => {
        this.pendingRedraw = undefined;
        this.render();
      }, 1400);
    }
  }
}
```

- [ ] **Step 9: Omskriv `src/activities/words/words-activity.ts`**

```ts
// src/activities/words/words-activity.ts
import type { Activity } from '../../core/activity';
import { WORD_LEVELS, type WordLevel } from '../../domain/words';
import { renderSpellMode } from './spell-mode';
import { trophySvg } from '../../ui/icons';
import { owlSvg } from '../../ui/mascot';
import { progressBar } from '../../ui/progress-bar';
import { showLevelUpCard } from '../../ui/level-up-card';
import { rankName } from '../../domain/ranks';
import { h, svgEl, empty } from '../../core/dom';
import type { AudioService } from '../../services/audio';
import { load, save, recordCorrect, getActivity, overallRank, type ProgressState } from '../../services/progress';

const ACTIVITY = 'words';
const MAX_LEVEL = 3;

export interface WordsActivityDeps {
  audio: AudioService;
  rng: () => number;
  onExit: () => void;
}

export class WordsActivity implements Activity {
  readonly id = 'words';
  private container: HTMLElement | null = null;
  private state: ProgressState = load();
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
    const act = getActivity(this.state, ACTIVITY);
    const level = act.level as WordLevel;

    const back = h('button', { class: 'back' }, ['‹ Hjem']);
    back.addEventListener('click', () => this.deps.onExit());
    const trophyCount = h('div', { class: 'trophy-count' }, [svgEl(trophySvg()), ` ${act.trophies.length}`]);
    const topbar = h('div', { class: 'topbar' }, [
      back,
      h('div', { class: 'level-pill' }, [`Niveau ${level} · ${WORD_LEVELS[level].label}`]),
      trophyCount,
    ]);

    const body = h('div', { class: 'activity-body' });
    const wrapper = h('div', { class: 'activity' }, [
      topbar,
      h('div', { class: 'progress-row' }, [progressBar(act.correctByLevel[level] ?? 0)]),
      body,
    ]);

    empty(c);
    c.append(wrapper);

    renderSpellMode(body, level, {
      audio: this.deps.audio,
      rng: this.deps.rng,
      onCorrect: (lvl: WordLevel) => this.onCorrect(lvl),
    });
  }

  private onCorrect(level: WordLevel): void {
    const res = recordCorrect(this.state, ACTIVITY, level, MAX_LEVEL);
    this.state = res.state;
    save(this.state);
    if (this.pendingRedraw !== undefined) window.clearTimeout(this.pendingRedraw);

    if (res.leveledUp) {
      const rank = overallRank(this.state);
      const newLevel = getActivity(this.state, ACTIVITY).level;
      this.deps.audio.speak(`Godt klaret! Nu er du på niveau ${newLevel}`);
      this.deps.audio.playCorrect();
      showLevelUpCard({
        level: newLevel,
        rankName: rankName(rank),
        owlMarkup: owlSvg(rank, 96, 'happy'),
        onClose: () => this.render(),
      });
    } else {
      this.pendingRedraw = window.setTimeout(() => {
        this.pendingRedraw = undefined;
        this.render();
      }, 1600);
    }
  }
}
```

- [ ] **Step 10: Omskriv `src/ui/home.ts`**

```ts
// src/ui/home.ts
import { owlSvg } from './mascot';
import { trophySvg } from './icons';
import { h, svgEl, empty } from '../core/dom';
import { load, totalTrophies, overallRank } from '../services/progress';

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
  const rank = overallRank(state);
  const trophies = totalTrophies(state);

  const brand = h('div', { class: 'brand' }, [svgEl(owlSvg(rank, 44)), h('span', {}, ['Mine Lærespil'])]);
  const gear = h('button', { class: 'gear', 'aria-label': 'Forælder' }, ['⚙']);
  const trophyBadge = h('div', { class: 'home-trophies' }, [svgEl(trophySvg()), ` ${trophies}`, gear]);
  const top = h('div', { class: 'home-top' }, [brand, trophyBadge]);

  const tileEls = TILES.map((t) => {
    const tile = h('button', { class: 'tile home-tile', 'data-id': t.id, style: `background:${t.color}` }, [
      h('span', { class: 'tile-label' }, [t.label]),
    ]);
    tile.addEventListener('click', () => deps.onSelect(t.id));
    return tile;
  });
  const tiles = h('div', { class: 'tiles' }, tileEls);

  const samling = h('button', { class: 'collection-link' }, [svgEl(trophySvg('#CBA15A', 20)), ' Min samling']);
  samling.addEventListener('click', () => deps.onSelect('collection'));

  empty(container);
  container.append(h('div', { class: 'home' }, [top, tiles, samling]));

  let timer: number | undefined;
  const start = () => { timer = window.setTimeout(() => deps.onParent(), 600); };
  const cancel = () => { if (timer) window.clearTimeout(timer); };
  gear.addEventListener('pointerdown', start);
  gear.addEventListener('pointerup', cancel);
  gear.addEventListener('pointerleave', cancel);
}
```

- [ ] **Step 11: Omskriv `src/main.ts`**

```ts
// src/main.ts
import './styles/tokens.css';
import './styles/base.css';
import { Router } from './core/router';
import { AudioService } from './services/audio';
import { renderHome } from './ui/home';
import { renderCollection } from './ui/collection';
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
        if (id === 'clock') router.showActivity(new ClockActivity({ audio, rng, onExit: goHome }));
        else if (id === 'letters') router.showActivity(new WordsActivity({ audio, rng, onExit: goHome }));
        else if (id === 'collection') router.showView((el2) => renderCollection(el2, { onBack: goHome }));
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

- [ ] **Step 12: Append CSS til `src/styles/base.css`**

```css
/* Fremgangsbar */
.progress-row { padding: 0 4px; }
.pbar-wrap { display: flex; align-items: center; gap: 10px; }
.pbar { flex: 1; height: 12px; background: #EFE7D8; border-radius: 99px; overflow: hidden; }
.pbar-fill { height: 100%; background: var(--clock); border-radius: 99px; transition: width 0.3s ease; }
.pbar-label { display: flex; align-items: center; gap: 4px; color: var(--text-muted); font-size: 13px; white-space: nowrap; }

/* Level-op-kort */
.levelup-overlay {
  position: fixed; inset: 0; background: rgba(26, 26, 46, 0.34);
  display: flex; align-items: center; justify-content: center; padding: 20px; animation: fade-in 0.2s ease both;
}
.levelup-card {
  background: var(--surface); border-radius: var(--radius-xl); padding: 22px 28px; text-align: center;
  max-width: 300px; box-shadow: var(--shadow-lg); animation: pop-in 0.28s ease both;
}
.levelup-title { font-family: var(--font-head); font-size: 30px; color: var(--text); margin-top: 4px; }
.levelup-rank { color: var(--text-muted); font-size: 14px; margin: 2px 0 16px; }
.levelup-rewards { display: flex; gap: 22px; justify-content: center; margin-bottom: 18px; }
.levelup-reward-label { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.levelup-next {
  background: var(--clock); color: #2F3A33; border-radius: var(--radius-md);
  padding: 12px 30px; font-family: var(--font-head); font-size: 18px; min-height: 52px;
}
@keyframes pop-in { from { opacity: 0; transform: scale(0.92) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
@media (prefers-reduced-motion: reduce) { .levelup-overlay, .levelup-card { animation: none; } }

/* Min samling */
.collection-link {
  align-self: center; display: inline-flex; align-items: center; gap: 6px;
  background: var(--surface-soft); border: 1px solid var(--border); border-radius: 999px;
  padding: 9px 20px; color: var(--text); font-family: var(--font-body); min-height: 44px;
}
.collection { display: flex; flex-direction: column; gap: 16px; }
.col-head { display: flex; align-items: center; gap: 12px; justify-content: center; }
.col-title { font-family: var(--font-head); font-size: 20px; color: var(--text); }
.col-rank { font-size: 13px; color: var(--text-muted); }
.col-section { background: var(--white); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px; }
.col-grid { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 8px; }
.col-locked { opacity: 0.3; }
```

- [ ] **Step 13: Kør HELE pakken + typecheck + build**

Run: `npm test`
Expected: alle suiter grønne (de nye + de uændrede; `words-progress` er væk). 

Run: `npm run typecheck`
Expected: ren.

Run: `npm run build`
Expected: success (manifest + service worker i `dist/`).

(Manuelt valgfrit: `npm run dev` — svar 5 rigtige i klokken → level-op-kort med glad krone-ugle + "Videre"; forsiden viser "Min samling" → trofæer + dinoer; fremgangsbaren fylder.)

- [ ] **Step 14: Commit (ét samlet commit for skiftet)**

```bash
git add -A
git commit -m "feat(progress): generic progress model, progress bar, level-up card and collection"
```

---

## Task 5: Versionsbump + dokumentation

**Files:** Modify `package.json`, `CHANGELOG.md`

- [ ] **Step 1: Bump `package.json`** — `"version": "0.3.0",` → `"version": "0.4.0",`

- [ ] **Step 2: Tilføj øverst i `CHANGELOG.md`** (efter Semantic Versioning-linjen, før `## [0.3.0]`):

```markdown
## [0.4.0] - 2026-06-10

### Added
- Fremgangsbar i aktiviteterne (mod næste trofæ)
- Level op-kort der fejrer nye niveauer med den glade krone-ugle + rolig ros
- "Min samling"-skærm (fra forsiden): trofæer, oplåste dinoer og uglens rang-navn
- Uglens rang-navne (Ugle-ven → Klog ugle → Vis ugle → Mester-ugle)

### Changed
- Fælles, aktivitets-generisk fremgangsmodel (klokke + bogstaver), klar til Tal
- Forsidens trofætal og uglens rang afspejler nu al fremgang samlet

### Migration
- Eksisterende lokal fremgang flyttes automatisk til den nye model (intet tabt)
```

- [ ] **Step 3: Fuld verifikation**

Run: `npm test` → grøn. `npm run typecheck` → ren. `npm run build` → success.

- [ ] **Step 4: Commit**

```bash
git add package.json CHANGELOG.md
git commit -m "docs: bump to v0.4.0 for progression & level-up"
```

---

## Self-Review (udført under planlægningen)

**Spec-dækning:**
- Fælles fremgangsmodel + migration → Task 4 (progress.ts + progress.test migration). ✓
- `words-progress.ts` udgår → Task 4 (git rm). ✓
- Fremgangsbar → Task 2 + vist i Task 4 (clock/words-activity). ✓
- Level op-kort → Task 3 + udløst i Task 4 (onCorrect ved leveledUp). ✓
- Min samling (fra forsiden) → Task 4 (collection.ts + home-link + main-route). ✓
- Rang-navne → Task 1, brugt i kort + samling. ✓
- Aggregater (totalTrophies/overallRank) på forsiden → Task 4 (home). ✓
- Lyd ved level-op (ros + tone) → Task 4 (onCorrect: audio.speak + playCorrect). ✓
- v0.4.0 → Task 5. ✓
- Domæne/modes/tegninger urørt → kun progress + activities + home + main + css + collection ændres. ✓

**Placeholder-scan:** Ingen TBD/TODO. Al kode konkret. `LOCKED_SLOTS = 3` er en bevidst visuel "mere at samle"-antydning (ikke en placeholder).

**Type-konsistens:** `ProgressState { activities }`, `ActivityProgress`, `recordCorrect(state, id, level, maxLevel)`, `getActivity`, `totalTrophies`, `overallRank`, `allDinos` bruges ens i progress.ts, clock-activity, words-activity, home, collection. `act.level as ClockLevel`/`as WordLevel` ved kald til renderReadMode/renderSetMode/renderSpellMode (som forventer de typer). `showLevelUpCard({level, rankName, owlMarkup, onClose})` matcher kaldet i begge aktiviteter. `progressBar(current, threshold?)` kaldes med ét argument (default 5). `owlSvg(rank, size, 'happy')` matcher v0.3.0-signaturen. `renderCollection(container, {onBack})` matcher main. ✓

---

## Næste skridt
- **v3: Tal & tælle** (dino-tælling) — registreres nu bare som aktivitet `tal` i den fælles model (maxLevel sættes pr. aktivitet).
- Evt. cykel-tur-fremgangsspor.
