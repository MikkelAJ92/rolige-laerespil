import React, { useRef, useState } from 'react';
import { polar, snapMinute, type LevelKey, type Time } from '../domain/time';

interface ClockProps { h: number; m: number; interactive?: boolean; level?: LevelKey; onChange?: (t: Time) => void }

function Clock({ h, m, interactive = false, level = 'timer', onChange }: ClockProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<'minute' | 'hour' | null>(null);
  const [hourDrag, setHourDrag] = useState<number | null>(null);

  const minuteAngle = (m % 60) * 6;
  const hourAngle = hourDrag != null ? hourDrag : ((h % 12) + (m % 60) / 60) * 30;

  const getAngle = (e: React.PointerEvent<SVGSVGElement>): { a: number; r: number } => {
    const rect = svgRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 200;
    const y = ((e.clientY - rect.top) / rect.height) * 200;
    let a = (Math.atan2(x - 100, -(y - 100)) * 180) / Math.PI;
    if (a < 0) a += 360;
    return { a, r: Math.hypot(x - 100, y - 100) };
  };
  const angGap = (a: number, b: number) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

  const applyDrag = (a: number) => {
    if (dragRef.current === "minute") onChange?.({ h, m: Math.round(a / 6) % 60 });
    else if (dragRef.current === "hour") setHourDrag(a);
  };

  const handleDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!interactive) return;
    if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
    const { a, r } = getAngle(e);
    if (r > 58) dragRef.current = "minute";
    else dragRef.current = angGap(a, minuteAngle) <= angGap(a, hourAngle) ? "minute" : "hour";
    applyDrag(a);
  };
  const handleMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!interactive || !dragRef.current) return;
    applyDrag(getAngle(e).a);
  };
  const handleUp = () => {
    if (!interactive || !dragRef.current) return;
    if (dragRef.current === "minute") {
      onChange?.({ h, m: snapMinute(m, level) });
    } else if (hourDrag != null) {
      let hh = Math.floor(hourDrag / 30) % 12;
      if (hh === 0) hh = 12;
      onChange?.({ h: hh, m });
    }
    setHourDrag(null);
    dragRef.current = null;
  };

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 200 200"
      style={{ width: "100%", height: "auto", display: "block", touchAction: interactive ? "none" : "auto", cursor: interactive ? "grab" : "default" }}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
    >
      <defs>
        <radialGradient id="clockface" cx="50%" cy="42%" r="65%">
          <stop offset="0%" stopColor="#FFFDF6" />
          <stop offset="100%" stopColor="#FBEFD2" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="98" fill="#B5732E" />
      <circle cx="100" cy="100" r="92" fill="#8A551F" />
      <circle cx="100" cy="100" r="88" fill="url(#clockface)" stroke="#EAD3A6" strokeWidth="1" />
      {Array.from({ length: 60 }).map((_, i) => {
        const major = i % 5 === 0;
        const a = i * 6;
        const out = polar(84, a);
        const inn = polar(major ? 75 : 80, a);
        return <line key={i} x1={inn.x} y1={inn.y} x2={out.x} y2={out.y} stroke={major ? "#C99A5B" : "#E2CB9C"} strokeWidth={major ? 2.4 : 1.1} strokeLinecap="round" />;
      })}
      {Array.from({ length: 12 }).map((_, i) => {
        const n = i + 1;
        const p = polar(66, n * 30);
        return (
          <text key={n} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" className="fredoka" style={{ fontSize: 15, fontWeight: 600, fill: "#5A4225" }}>
            {n}
          </text>
        );
      })}
      {(() => {
        const tip = polar(46, hourAngle);
        const tail = polar(14, hourAngle + 180);
        return <line x1={tail.x} y1={tail.y} x2={tip.x} y2={tip.y} stroke="#F2715B" strokeWidth="7.5" strokeLinecap="round" />;
      })()}
      {(() => {
        const tip = polar(70, minuteAngle);
        const tail = polar(16, minuteAngle + 180);
        return <line x1={tail.x} y1={tail.y} x2={tip.x} y2={tip.y} stroke="#2BB6A3" strokeWidth="5" strokeLinecap="round" />;
      })()}
      {interactive &&
        (() => {
          const mt = polar(70, minuteAngle);
          const ht = polar(46, hourAngle);
          return (
            <g>
              <circle cx={mt.x} cy={mt.y} r="7.5" fill="#2BB6A3" stroke="#fff" strokeWidth="2" style={{ animation: "softpulse 1.6s ease-in-out infinite" }} />
              <circle cx={ht.x} cy={ht.y} r="6.5" fill="#F2715B" stroke="#fff" strokeWidth="2" style={{ animation: "softpulse 1.6s ease-in-out infinite" }} />
            </g>
          );
        })()}
      <circle cx="100" cy="100" r="7.5" fill="#4A3826" />
      <circle cx="100" cy="100" r="3.5" fill="#FFF7E8" />
    </svg>
  );
}

export default Clock;
