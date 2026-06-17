# Kodespil: træk-på-plads + ledetråds-variation — Implementeringsplan (v0.12.0)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lad Alfred trække kodetal ned i et vilkårligt felt (touch-venligt) i stedet for kun at taste i rækkefølge, og spred `genPuzzle`'s ledetråds-typer så „3 rigtige, forkert plads" ikke dominerer.

**Architecture:** Ren placerings-logik (4 faste felter) + de eksisterende variations-justeringer lægges i `src/domain/code.ts` og unit-testes. `src/components/CodeGame.tsx` skifter indtastnings-modellen fra en liste til 4 felter og får pointer-baseret træk (som `Clock`/„Sæt viserne" allerede bruger) med spøgelses-tal og drop-zoner. Klokke-/dino-spil, scener, krydse-af-mærker og løsnings-/celebration-flow er urørte.

**Tech Stack:** Vite + React 18 + TypeScript (strict) + Tailwind v4 + Vitest/jsdom. Pointer events for touch+mus. Ren logik testes med TDD; træk-gestussen verificeres live i Claude Preview.

---

## Filstruktur

| Fil | Ansvar |
|-----|--------|
| `src/domain/code.ts` | ÆNDRES — nye rene felt-hjælpere (`Slots`, `emptyEntry`, `placeDigit`, `clearSlot`, `firstEmpty`, `entryComplete`, `entryToCode`) + `genPuzzle` variations-justering (round-robin, `0,3`-loft, ≥4 typer). |
| `src/components/CodeGame.tsx` | ÆNDRES — felt-model `Slots`, pointer-træk + drop-zoner + spøgelses-tal, tryk-for-at-rydde, ⌫ = ryd sidst lagte, submit via `entryToCode`. |
| `tests/code.test.ts` | UDVIDES — felt-hjælpere + variations-test; eksisterende entydigheds-sweep består. |
| `package.json`, `CHANGELOG.md`, `README.md` | ÆNDRES — version v0.12.0. |

---

### Task 1: Felt-hjælpere i `src/domain/code.ts` (TDD)

**Files:**
- Modify: `src/domain/code.ts`
- Test: `tests/code.test.ts`

- [ ] **Step 1: Tilføj de fejlende tests**

Tilføj i `tests/code.test.ts` (behold alt eksisterende; tilføj importerne til den eksisterende import fra `../src/domain/code`):

```ts
import {
  emptyEntry, placeDigit, clearSlot, firstEmpty, entryComplete, entryToCode,
} from '../src/domain/code';

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
```

- [ ] **Step 2: Kør testen — den skal fejle**

Run: `npm test -- code`
Expected: FAIL (`emptyEntry` m.fl. findes ikke endnu).

- [ ] **Step 3: Tilføj hjælperne i `src/domain/code.ts`**

Tilføj nær toppen (efter `Mark`-typen) typen, og hjælperne et naturligt sted (fx lige efter `cycleMark`):

```ts
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
```

- [ ] **Step 4: Kør testen — den skal bestå**

Run: `npm test -- code` → PASS. Også `npm run typecheck` → ingen fejl.

- [ ] **Step 5: Commit**

```bash
git add src/domain/code.ts tests/code.test.ts
git commit -m "feat(kode): add pure entry-slot helpers"
```

---

### Task 2: Mere ledetråds-variation i `genPuzzle` (TDD)

**Files:**
- Modify: `src/domain/code.ts`
- Test: `tests/code.test.ts`

- [ ] **Step 1: Tilføj den fejlende variations-test**

Tilføj i `tests/code.test.ts` (genbruger `mulberry32` og `DIFFS` der allerede er defineret i filen):

```ts
describe('ledetråds-variation', () => {
  it('spreder typerne: mindst 4 forskellige og højst én 0,3', () => {
    for (const diff of DIFFS) {
      for (let seed = 1; seed <= 40; seed++) {
        const p = genPuzzle(diff, mulberry32(seed));
        const types = p.rows.map((r) => `${r.b},${r.c}`);
        expect(new Set(types).size, `${diff} seed ${seed} distinct`).toBeGreaterThanOrEqual(4);
        expect(types.filter((t) => t === '0,3').length, `${diff} seed ${seed} 0,3`).toBeLessThanOrEqual(1);
      }
    }
  });
});
```

- [ ] **Step 2: Kør testen — den skal fejle**

Run: `npm test -- code`
Expected: FAIL (i dag kan en kode have to `0,3` og kun 3 typer).

- [ ] **Step 3: Justér `genPuzzle` i `src/domain/code.ts`**

Tre præcise ændringer i `genPuzzle`:

**(a) Loft over `0,3` i udfyldnings-puljen.** Find:
```ts
      const pool = types.filter((k) => (count[k] || 0) < 2 && !(isBull(k) && bulls >= cfg.bullCap));
```
Erstat med:
```ts
      const pool = types.filter((k) => (count[k] || 0) < 2 && !(isBull(k) && bulls >= cfg.bullCap) && !(k === '0,3' && (count['0,3'] || 0) >= 1));
```

**(b) Round-robin: mindst-brugte type først, præference som tiebreaker.** Find:
```ts
      pool.sort((a, b) => {
        if (cfg.prefer === 'place') { const d = (isBull(a) ? 0 : 1) - (isBull(b) ? 0 : 1); if (d) return d; }
        if (cfg.prefer === 'wrong') { const d = (isBull(a) ? 1 : 0) - (isBull(b) ? 1 : 0); if (d) return d; }
        return (count[a] || 0) - (count[b] || 0);
      });
```
Erstat med:
```ts
      pool.sort((a, b) => {
        const dc = (count[a] || 0) - (count[b] || 0);
        if (dc) return dc;
        if (cfg.prefer === 'place') { const d = (isBull(a) ? 0 : 1) - (isBull(b) ? 0 : 1); if (d) return d; }
        if (cfg.prefer === 'wrong') { const d = (isBull(a) ? 1 : 0) - (isBull(b) ? 1 : 0); if (d) return d; }
        return 0;
      });
```

**(c) Stærkere variations-krav.** Find:
```ts
    if (cands.length === 1 && rows.length <= 7 && distinct >= 3) {
```
Erstat med:
```ts
    if (cands.length === 1 && rows.length <= 7 && distinct >= 4) {
```

- [ ] **Step 4: Kør hele code-test-suiten — alt skal bestå**

Run: `npm test -- code`
Expected: PASS — både den nye variations-test OG den eksisterende entydigheds-sweep (præcis ét tal i `ALL` opfylder alle rækker) for alle niveauer/seeds.

**Hvis et niveau fejler `≥4 distinct` (pga. at generatoren falder tilbage på `FALLBACK` for nogle seeds):** blødgør accept-kravet for netop det niveau frem for at miste entydigheden. Konkret: erstat `distinct >= 4` med `distinct >= (diff === 'ekspert' ? 3 : 4)` og kør igen. (Dokumentér i commit-beskeden hvis dette var nødvendigt.) Rør IKKE ved entydigheds-betingelsen `cands.length === 1`.

- [ ] **Step 5: Commit**

```bash
git add src/domain/code.ts tests/code.test.ts
git commit -m "feat(kode): spread clue types (round-robin fill, cap 0,3, >=4 types)"
```

---

### Task 3: Træk-på-plads i `src/components/CodeGame.tsx`

**Files:**
- Modify: `src/components/CodeGame.tsx` (erstat hele filen med indholdet nedenfor)

- [ ] **Step 1: Erstat filens indhold**

Overskriv `src/components/CodeGame.tsx` med præcis dette:

```tsx
import { type CSSProperties, type PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  genPuzzle, clueText, excludedDigits, cycleMark,
  emptyEntry, placeDigit, clearSlot, firstEmpty, entryComplete, entryToCode,
  type CodeLevelKey, type Mark, type Slots,
} from '../domain/code';
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
const DRAG_THRESHOLD = 8;

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
  const [entry, setEntry] = useState<Slots>(emptyEntry);
  const [solved, setSolved] = useState(false);
  const [shake, setShake] = useState(false);
  const [hintOn, setHintOn] = useState(false);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [drag, setDrag] = useState<{ digit: number; x: number; y: number } | null>(null);

  const lastPlaced = useRef<number | null>(null);
  const dragStart = useRef<{ digit: number; x: number; y: number; moved: boolean } | null>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null]);

  useEffect(() => {
    setEntry(emptyEntry());
    setSolved(false);
    setShake(false);
    setHintOn(false);
    setMarks({});
    setDrag(null);
    lastPlaced.current = null;
    dragStart.current = null;
    audio.speak(scene.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle]);

  const excluded = excludedDigits(puzzle);
  const canSubmit = entryComplete(entry);

  function toggleMark(key: string) {
    setMarks((m) => ({ ...m, [key]: cycleMark(m[key] ?? 'none') }));
  }

  function tapDigit(digit: number) {
    if (solved) return;
    const idx = firstEmpty(entry);
    if (idx < 0) return;
    setEntry(placeDigit(entry, idx, digit));
    lastPlaced.current = idx;
  }
  function dropDigit(idx: number, digit: number) {
    if (solved) return;
    setEntry(placeDigit(entry, idx, digit));
    lastPlaced.current = idx;
  }
  function clearSlotAt(idx: number) {
    if (solved || entry[idx] == null) return;
    setEntry(clearSlot(entry, idx));
    if (lastPlaced.current === idx) lastPlaced.current = null;
  }
  function backspace() {
    if (solved) return;
    let idx = lastPlaced.current;
    if (idx == null || entry[idx] == null) {
      idx = -1;
      for (let i = 3; i >= 0; i--) if (entry[i] != null) { idx = i; break; }
    }
    if (idx < 0) return;
    setEntry(clearSlot(entry, idx));
    lastPlaced.current = null;
  }
  function submit() {
    if (solved || !canSubmit) return;
    if (entryToCode(entry) === puzzle.secret) {
      setSolved(true);
      onSolved();
    } else {
      setShake(true);
      window.setTimeout(() => setShake(false), 450);
      onWrong();
    }
  }

  function slotIndexAt(x: number, y: number): number {
    for (let i = 0; i < 4; i++) {
      const el = slotRefs.current[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return i;
    }
    return -1;
  }

  function onDigitPointerDown(e: ReactPointerEvent, digit: number) {
    if (solved) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { digit, x: e.clientX, y: e.clientY, moved: false };
  }
  function onDigitPointerMove(e: ReactPointerEvent) {
    const st = dragStart.current;
    if (!st) return;
    if (!st.moved && Math.hypot(e.clientX - st.x, e.clientY - st.y) > DRAG_THRESHOLD) st.moved = true;
    if (st.moved) setDrag({ digit: st.digit, x: e.clientX, y: e.clientY });
  }
  function onDigitPointerUp(e: ReactPointerEvent) {
    const st = dragStart.current;
    dragStart.current = null;
    setDrag(null);
    if (!st) return;
    if (st.moved) {
      const idx = slotIndexAt(e.clientX, e.clientY);
      if (idx >= 0) dropDigit(idx, st.digit);
    } else {
      tapDigit(st.digit);
    }
  }
  function onDigitPointerCancel() {
    dragStart.current = null;
    setDrag(null);
  }

  const digitKeyStyle: CSSProperties = { height: 54, fontSize: 26, fontWeight: 700, background: '#FFF3D6', color: '#8A551F', border: '3px solid #E9C77E', boxShadow: '0 4px 0 #E9C77E', touchAction: 'none' };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-1">
        <span style={{ fontSize: 56, animation: solved ? 'pop .4s ease' : 'floaty 3.2s ease-in-out infinite' }}>{solved ? scene.opened : scene.locked}</span>
        <p className="fredoka text-base font-semibold text-center" style={{ color: scene.accent }}>{scene.title}</p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <Padlock open={solved} />
        <div className="flex gap-2" style={{ animation: shake ? 'shakey .4s ease' : 'none' }}>
          {[0, 1, 2, 3].map((i) => {
            const d = entry[i];
            const filled = d != null;
            const dropTarget = drag != null && !solved;
            return (
              <div
                key={i}
                ref={(el) => { slotRefs.current[i] = el; }}
                onClick={() => clearSlotAt(i)}
                className="fredoka"
                style={{ width: 46, height: 58, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 700, cursor: filled && !solved ? 'pointer' : 'default', color: solved ? '#fff' : '#4A3826', background: solved ? '#5DBB63' : filled ? '#FFF3D6' : '#FBF6EA', border: `3px solid ${solved ? shade('#5DBB63', -16) : dropTarget ? '#2BB6A3' : filled ? '#F0CE7E' : '#E9DCBF'}`, boxShadow: dropTarget ? '0 0 0 3px rgba(43,182,163,.35)' : 'none', borderRadius: 12, transition: 'border-color .15s, box-shadow .15s', animation: solved ? 'pop .4s ease' : 'none' }}
              >
                {filled ? d : ''}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl p-3 flex flex-col gap-2.5" style={{ background: '#FFFFFF', border: '2.5px solid #F0E2C8' }}>
        {puzzle.rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="flex gap-1.5" style={{ flexShrink: 0 }}>
              {r.g.map((d, j) => (
                <button key={j} onClick={() => toggleMark(`${i}-${j}`)} aria-label={`Markér tallet ${d}`} className="fredoka" style={{ width: 34, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#5A4225', background: '#FFF7E6', border: '2.5px solid #E9D3A4', borderRadius: 9, cursor: 'pointer', ...markStyle(marks[`${i}-${j}`] ?? 'none') }}>{d}</button>
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
            <button
              key={d}
              onPointerDown={(e) => onDigitPointerDown(e, d)}
              onPointerMove={onDigitPointerMove}
              onPointerUp={onDigitPointerUp}
              onPointerCancel={onDigitPointerCancel}
              disabled={hintOn && excluded.has(d)}
              className="fredoka select-none rounded-2xl transition active:translate-y-0.5 disabled:opacity-35"
              style={digitKeyStyle}
            >{d}</button>
          ))}
          <button onClick={backspace} className="fredoka select-none rounded-2xl transition active:translate-y-0.5" style={{ height: 54, fontSize: 24, fontWeight: 700, background: '#FBE6DF', color: '#B5562F', border: '3px solid #EBC3B1', boxShadow: '0 4px 0 #EBC3B1' }}>⌫</button>
          <button
            onPointerDown={(e) => onDigitPointerDown(e, 0)}
            onPointerMove={onDigitPointerMove}
            onPointerUp={onDigitPointerUp}
            onPointerCancel={onDigitPointerCancel}
            disabled={hintOn && excluded.has(0)}
            className="fredoka select-none rounded-2xl transition active:translate-y-0.5 disabled:opacity-35"
            style={digitKeyStyle}
          >0</button>
          <button onClick={submit} disabled={!canSubmit} className="fredoka select-none rounded-2xl transition active:translate-y-0.5 disabled:opacity-50" style={{ height: 54, fontSize: 24, fontWeight: 700, background: canSubmit ? '#5DBB63' : '#E7E2D6', color: canSubmit ? '#fff' : '#A89E8A', border: `3px solid ${canSubmit ? shade('#5DBB63', -16) : '#D8D1C0'}`, boxShadow: `0 4px 0 ${canSubmit ? shade('#5DBB63', -16) : '#D8D1C0'}` }}>🔓</button>
        </div>
      )}

      {!solved && (
        <div className="flex items-center justify-center">
          <button onClick={() => setHintOn((h) => !h)} className="fredoka rounded-full px-4 py-2 text-sm font-semibold transition active:translate-y-0.5" style={{ background: hintOn ? '#FFE39B' : '#FFFDF7', color: '#8A551F', border: `3px solid ${hintOn ? '#E9B23A' : '#EBDCBF'}`, boxShadow: `0 3px 0 ${hintOn ? '#E9B23A' : '#EBDCBF'}` }}>💡 {hintOn ? 'Skjuler tal der ikke er med' : 'Hjælp mig'}</button>
        </div>
      )}

      {drag && (
        <div className="fredoka" style={{ position: 'fixed', left: drag.x, top: drag.y, transform: 'translate(-50%, -60%)', pointerEvents: 'none', zIndex: 50, width: 46, height: 58, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 700, color: '#8A551F', background: '#FFE9B8', border: `3px solid ${shade('#E9C77E', -10)}`, borderRadius: 12, boxShadow: '0 8px 16px rgba(74,56,38,.28)' }}>{drag.digit}</div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + tests + build**

Run: `npm run typecheck` → ingen fejl. `npm test` → alle grønne (ingen unit-tests for komponenten, men intet må knække). `npm run build` → OK.

- [ ] **Step 3: Commit**

```bash
git add src/components/CodeGame.tsx
git commit -m "feat(kode): drag digits onto any slot (touch-friendly pointer drag)"
```

---

### Task 4: Version, CHANGELOG, README

**Files:**
- Modify: `package.json`, `CHANGELOG.md`, `README.md`

- [ ] **Step 1: Bump version**

I `package.json`: `"version": "0.11.1"` → `"version": "0.12.0"`.

- [ ] **Step 2: CHANGELOG-indgang**

Indsæt øverst (over den nuværende `## [0.11.1] ...`):

```markdown
## [0.12.0] - 2026-06-16

### Added
- Kodespil: tallene kan nu **trækkes** ned i et vilkårligt felt (touch-venligt), så koden ikke nødvendigvis skal tastes fra venstre. Tryk på et tal fylder stadig næste tomme felt; tryk på et fyldt felt rydder det.

### Changed
- Kodespil: ledetrådene varieres mere — generatoren spreder typerne (round-robin) og laver højst én „3 rigtige, forkert plads" pr. kode, så den type ikke længere dominerer. Koderne er fortsat garanteret entydigt løselige.
```

- [ ] **Step 3: README-note**

Opdatér README's beskrivelse af „Alfred knækker koden" så træk-på-plads nævnes, og sæt versionen til v0.12.0.

- [ ] **Step 4: Build + tests**

Run: `npm run build` og `npm test` → begge grønne.

- [ ] **Step 5: Commit**

```bash
git add package.json CHANGELOG.md README.md
git commit -m "chore: release v0.12.0 (drag-to-place + clue variety)"
```

---

### Task 5: Endelig verifikation (live preview)

**Files:** ingen (manuel verifikation udført af controlleren)

- [ ] **Step 1: Start preview** (`preview_start` "dev").

- [ ] **Step 2: Verificér i kodespillet:**
  - **Tryk** på et tal → fylder næste tomme felt (som før); fire tryk fylder venstre→højre.
  - **Træk** et tal (pointer/mus) op på et bestemt felt → tallet lander dér; spøgelses-tal følger, felterne fremhæves som drop-zoner. Bekræft at man kan udfylde i vilkårlig rækkefølge (fx fyld felt 3 først).
  - **Tryk på et fyldt felt** → rydder det. **⌫** → rydder sidst lagte.
  - **Løs en kode** (uanset udfyldnings-rækkefølge via `entryToCode`) → hængelås åbner, delt stjerne, scene-skift ved „Ny kode".
  - **Variation:** kig på flere genererede koder → tydeligt flere forskellige ledetråds-typer, sjældent mere end én „3 rigtige, forkert plads".
  - Console uden fejl (`preview_console_logs`).

- [ ] **Step 3:** `npm test` + `npm run typecheck` en sidste gang.

---

## Self-Review (udført af planlæggeren)

**Spec-dækning:** §2.2 felt-hjælpere → Task 1 ✓. §2.3/§2.4 betjening+pointer-træk → Task 3 ✓. §3.2 genPuzzle (round-robin + 0,3-loft + ≥4) → Task 2 ✓. §3.3 garanti + per-niveau-blødgøring → Task 2 Step 4 ✓. §5 tests → Tasks 1+2 (+ live i Task 5) ✓. §4 filer → alle dækket ✓. §6 version → Task 4 ✓.

**Placeholder-scan:** ingen TBD/TODO; al kode fuldt udskrevet (inkl. hele CodeGame.tsx). ✓

**Type-konsistens:** `Slots`, `emptyEntry`, `placeDigit`, `clearSlot`, `firstEmpty`, `entryComplete`, `entryToCode` defineres i Task 1 og bruges 1:1 i Task 3. `genPuzzle(level, Math.random)` uændret signatur. Pointer-handlere bruger `ReactPointerEvent` (importeret som type). `touchAction: 'none'` sikrer touch-træk på iPad. ✓

**Bevidst (matcher spec YAGNI):** ingen felt-til-felt-omrokering; ⌫ rydder sidst lagte (ellers højre-mest); kun tal-tasterne (0-9) er trækbare — ⌫/🔓 ikke.
