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
