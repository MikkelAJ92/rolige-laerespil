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
