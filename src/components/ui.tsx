import React from 'react';
import { shade } from '../lib/colors';

interface BtnProps { children: React.ReactNode; onClick?: () => void; color?: string; textColor?: string; disabled?: boolean; className?: string; style?: React.CSSProperties }
interface RoundBtnProps { children: React.ReactNode; onClick?: () => void; disabled?: boolean }
interface PillProps { children: React.ReactNode }
interface StarRowProps { filled: number }
interface CloudProps { style?: React.CSSProperties }
interface ConfettiProps { big: boolean }

function Btn({ children, onClick, color = "#FFC23C", textColor = "#4A3826", disabled, className = "", style = {} }: BtnProps) {
  const dark = shade(color, -18);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`fredoka select-none rounded-2xl px-5 py-3 text-lg font-semibold transition active:translate-y-0.5 disabled:opacity-50 ${className}`}
      style={{ background: color, color: textColor, border: `3px solid ${dark}`, boxShadow: `0 5px 0 ${dark}, 0 8px 16px rgba(74,56,38,.16)`, ...style }}
    >
      {children}
    </button>
  );
}

function RoundBtn({ children, onClick, disabled }: RoundBtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="fredoka select-none rounded-full transition active:translate-y-0.5 disabled:opacity-40"
      style={{ width: 46, height: 46, fontSize: 26, lineHeight: "40px", background: "#FFF3D6", color: "#8A551F", border: "3px solid #E9C77E", boxShadow: "0 4px 0 #E9C77E" }}
    >
      {children}
    </button>
  );
}

function Pill({ children }: PillProps) {
  return (
    <span className="fredoka rounded-full px-3 py-1 text-sm font-semibold" style={{ background: "#FFFDF7", color: "#7A6650", border: "3px solid #EBDCBF" }}>
      {children}
    </span>
  );
}

function StarRow({ filled }: StarRowProps) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ fontSize: 22, filter: i < filled ? "none" : "grayscale(1)", opacity: i < filled ? 1 : 0.35, transition: "all .3s" }}>
          ⭐
        </span>
      ))}
    </div>
  );
}

function Cloud({ style }: CloudProps) {
  return (
    <svg width="120" height="60" viewBox="0 0 120 60" className="absolute" style={style} aria-hidden="true">
      <g fill="#FFFFFF" opacity="0.96">
        <ellipse cx="40" cy="38" rx="26" ry="18" />
        <ellipse cx="66" cy="32" rx="24" ry="20" />
        <ellipse cx="86" cy="40" rx="20" ry="15" />
        <rect x="24" y="38" width="74" height="16" rx="8" />
      </g>
    </svg>
  );
}

function Confetti({ big }: ConfettiProps) {
  const emojis = big ? ["🏆", "🌟", "⭐", "🎉", "✨", "🥳", "🟡", "🔵", "🟢", "🟠"] : ["🌟", "⭐", "✨", "🎉", "💫"];
  const n = big ? 26 : 12;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 30 }}>
      {Array.from({ length: n }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.3;
        const dur = 1 + Math.random() * 0.9;
        const sz = 16 + Math.random() * 16;
        return (
          <span key={i} style={{ position: "absolute", left: `${left}%`, top: -10, fontSize: sz, animation: `fall ${dur}s ${delay}s ease-in forwards` }}>
            {emojis[i % emojis.length]}
          </span>
        );
      })}
    </div>
  );
}

export { Btn, RoundBtn, Pill, StarRow, Cloud, Confetti };
