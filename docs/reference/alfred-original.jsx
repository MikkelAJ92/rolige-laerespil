import React, { useState, useRef, useEffect, useCallback } from "react";

/* ============================================================
   Alfred lærer klokken — et lille børnespil om analoge ure
   To spil: "Hvad er klokken?" (læs uret) og "Sæt viserne"
   ============================================================ */

// ---------- Danske klokke-hjælpere ----------
const HOUR_NAMES = ["tolv", "et", "to", "tre", "fire", "fem", "seks", "syv", "otte", "ni", "ti", "elleve"];
const hourName = (h) => HOUR_NAMES[h % 12];
const nextHourName = (h) => HOUR_NAMES[(h + 1) % 12];

const LEVELS = {
  timer: { label: "Hele timer", minutes: [0], stars: 1, desc: "fx „klokken tre“" },
  halve: { label: "Halve timer", minutes: [0, 30], stars: 2, desc: "hel og „halv“" },
  kvarter: { label: "Kvarter", minutes: [0, 15, 30, 45], stars: 3, desc: "„kvart over / i“" },
  minutter: { label: "Fem minutter", minutes: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55], stars: 4, desc: "alle fem minutter" },
};

function danishTime(h, m) {
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

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const digital = (h, m) => `${h}.${String(m).padStart(2, "0")}`;
const tKey = (t) => `${t.h}:${t.m}`;
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (n) => Math.floor(Math.random() * n);

function shuffle(a) {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

function randomTime(level) {
  const mins = LEVELS[level].minutes;
  return { h: 1 + randInt(12), m: mins[randInt(mins.length)] };
}

function makeOptions(answer, level) {
  const map = new Map();
  map.set(tKey(answer), answer);
  let guard = 0;
  while (map.size < 4 && guard < 300) {
    guard++;
    const c = randomTime(level);
    map.set(tKey(c), c);
  }
  return shuffle([...map.values()]);
}

function snapMinute(m, level) {
  const opts = LEVELS[level].minutes;
  let best = opts[0], bd = 999;
  for (const o of opts) {
    const raw = Math.abs(m - o);
    const d = Math.min(raw, 60 - raw);
    if (d < bd) { bd = d; best = o; }
  }
  return best;
}

// darken/lighten a hex color (amt -100..100)
function shade(hex, amt) {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + (amt / 100) * 255)));
  const r = f((num >> 16) & 255);
  const g = f((num >> 8) & 255);
  const b = f(num & 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

const polar = (r, deg) => {
  const rad = (deg * Math.PI) / 180;
  return { x: 100 + r * Math.sin(rad), y: 100 - r * Math.cos(rad) };
};

const CORRECT = ["Flot, Alfred! 🌟", "Sådan! 🎉", "Du er en klokke-mester! ⭐", "Helt rigtigt! 👏", "Super, Alfred! 💫", "Wow — du kan det! 🚀"];
const WRONG = ["Ikke helt — prøv igen! 💪", "Tæt på! Kig en gang til 👀", "Hov, prøv igen, Alfred 🙂", "Prøv lige igen — du kan godt! ✨"];

// ---------- Ugle-maskotten Ugo ----------
function Owl({ mood = "idle", size = 96 }) {
  const brown = "#B5732E", brownDark = "#8A551F", belly = "#FCEFD3", orange = "#F2A03D", pupil = "#3A2A1A", cheek = "#F6A6A0", white = "#FFFFFF";
  const happy = mood === "happy" || mood === "cheer";
  const sad = mood === "sad";
  const gaze = mood === "think" ? { dx: 4, dy: -3 } : { dx: 0, dy: 0 };

  const Eye = ({ cx }) => {
    if (happy) {
      return <path d={`M ${cx - 11} 60 Q ${cx} 49 ${cx + 11} 60`} stroke={brownDark} strokeWidth="4" fill="none" strokeLinecap="round" />;
    }
    const pr = sad ? 5 : 7;
    return (
      <g>
        <circle cx={cx} cy="58" r="15" fill={white} stroke={brownDark} strokeWidth="1.5" />
        <circle cx={cx + gaze.dx} cy={58 + gaze.dy + (sad ? 2 : 0)} r={pr} fill={pupil} />
        <circle cx={cx + gaze.dx - 2} cy={56 + gaze.dy} r="2.2" fill={white} />
      </g>
    );
  };

  return (
    <svg viewBox="0 0 120 130" width={size} height={(size * 130) / 120} aria-hidden="true">
      <g stroke={orange} strokeWidth="3.5" fill="none" strokeLinecap="round">
        <path d="M50 112 l-5 8 M50 112 l0 9 M50 112 l5 8" />
        <path d="M70 112 l-5 8 M70 112 l0 9 M70 112 l5 8" />
      </g>
      <path d="M40 30 L31 12 L53 26 Z" fill={brown} />
      <path d="M80 30 L89 12 L67 26 Z" fill={brown} />
      <ellipse cx="60" cy="68" rx="41" ry="46" fill={brown} />
      <ellipse cx="23" cy="72" rx="10" ry="24" fill={brownDark} transform={mood === "cheer" ? "rotate(-30 23 72)" : ""} />
      <ellipse cx="97" cy="72" rx="10" ry="24" fill={brownDark} transform={mood === "cheer" ? "rotate(30 97 72)" : ""} />
      <ellipse cx="60" cy="78" rx="27" ry="32" fill={belly} />
      <ellipse cx="60" cy="55" rx="33" ry="25" fill={belly} opacity="0.5" />
      <Eye cx={45} />
      <Eye cx={75} />
      {happy && (
        <g>
          <ellipse cx="33" cy="72" rx="6" ry="4" fill={cheek} opacity="0.85" />
          <ellipse cx="87" cy="72" rx="6" ry="4" fill={cheek} opacity="0.85" />
        </g>
      )}
      <path d="M60 66 L53 73 L67 73 Z" fill={orange} stroke={brownDark} strokeWidth="0.8" />
      {sad && <path d="M52 92 Q60 86 68 92" stroke={brownDark} strokeWidth="2.5" fill="none" strokeLinecap="round" />}
    </svg>
  );
}

// ---------- Uret ----------
function Clock({ h, m, interactive = false, level = "timer", onChange }) {
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const [hourDrag, setHourDrag] = useState(null);

  const minuteAngle = (m % 60) * 6;
  const hourAngle = hourDrag != null ? hourDrag : ((h % 12) + (m % 60) / 60) * 30;

  const getAngle = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 200;
    const y = ((e.clientY - rect.top) / rect.height) * 200;
    let a = (Math.atan2(x - 100, -(y - 100)) * 180) / Math.PI;
    if (a < 0) a += 360;
    return { a, r: Math.hypot(x - 100, y - 100) };
  };
  const angGap = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

  const applyDrag = (a) => {
    if (dragRef.current === "minute") onChange?.({ h, m: Math.round(a / 6) % 60 });
    else if (dragRef.current === "hour") setHourDrag(a);
  };

  const handleDown = (e) => {
    if (!interactive) return;
    if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
    const { a, r } = getAngle(e);
    if (r > 58) dragRef.current = "minute";
    else dragRef.current = angGap(a, minuteAngle) <= angGap(a, hourAngle) ? "minute" : "hour";
    applyDrag(a);
  };
  const handleMove = (e) => {
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

// ---------- Små UI-byggeklodser ----------
function Btn({ children, onClick, color = "#FFC23C", textColor = "#4A3826", disabled, className = "", style = {} }) {
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

function RoundBtn({ children, onClick, disabled }) {
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

function Pill({ children }) {
  return (
    <span className="fredoka rounded-full px-3 py-1 text-sm font-semibold" style={{ background: "#FFFDF7", color: "#7A6650", border: "3px solid #EBDCBF" }}>
      {children}
    </span>
  );
}

function StarRow({ filled }) {
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

function Cloud({ style }) {
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

function Confetti({ big }) {
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

// ---------- Hovedkomponent ----------
export default function App() {
  const [screen, setScreen] = useState("menu");
  const [mode, setMode] = useState("read"); // read | set
  const [level, setLevel] = useState("timer");

  const [q, setQ] = useState({ h: 3, m: 0 });
  const [options, setOptions] = useState([]);
  const [feedback, setFeedback] = useState("idle"); // idle | correct
  const [revealed, setRevealed] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [wrongPicks, setWrongPicks] = useState([]);
  const [msg, setMsg] = useState("");
  const [mood, setMood] = useState("idle");

  const [setH, setSetH] = useState(12);
  const [setM, setSetM] = useState(0);

  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(0);
  const [starRow, setStarRow] = useState(0);
  const [trophies, setTrophies] = useState(0);

  const [burst, setBurst] = useState(0);
  const burstBig = useRef(false);
  const [showBurst, setShowBurst] = useState(false);

  useEffect(() => {
    if (burst === 0) return;
    setShowBurst(true);
    const t = setTimeout(() => setShowBurst(false), burstBig.current ? 1900 : 1300);
    return () => clearTimeout(t);
  }, [burst]);

  const newQuestion = useCallback(() => {
    const q2 = randomTime(level);
    setQ(q2);
    setOptions(makeOptions(q2, level));
    setFeedback("idle");
    setRevealed(false);
    setAttempts(0);
    setWrongPicks([]);
    setMsg("");
    setMood("idle");
    setSetH(12);
    setSetM(0);
  }, [level]);

  useEffect(() => {
    if (screen === "play") newQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, mode, level]);

  function handleCorrect() {
    setFeedback("correct");
    setMood("cheer");
    setStars((s) => s + 1);
    setStreak((s) => s + 1);
    const next = starRow + 1;
    if (next >= 5) {
      setStarRow(0);
      setTrophies((t) => t + 1);
      burstBig.current = true;
      setBurst((b) => b + 1);
      setMsg("🏆 Pokal! Du samlede 5 stjerner!");
    } else {
      setStarRow(next);
      burstBig.current = false;
      setBurst((b) => b + 1);
      setMsg(rand(CORRECT));
    }
  }

  function chooseOption(opt) {
    if (feedback === "correct" || revealed) return;
    if (opt.h === q.h && opt.m === q.m) {
      handleCorrect();
      return;
    }
    setWrongPicks((p) => (p.includes(tKey(opt)) ? p : [...p, tKey(opt)]));
    setStreak(0);
    setAttempts((prev) => {
      const nn = prev + 1;
      if (nn >= 2) {
        setRevealed(true);
        setMood("sad");
        setMsg(`Den rigtige er: ${cap(danishTime(q.h, q.m))} 🕐`);
      } else {
        setMood("think");
        setMsg(rand(WRONG));
      }
      return nn;
    });
  }

  const clearFb = () => {
    if (feedback !== "correct") {
      setMsg("");
      setMood("idle");
    }
  };
  const mins = LEVELS[level].minutes;
  const incHour = () => { clearFb(); setSetH((h) => (h % 12) + 1); };
  const decHour = () => { clearFb(); setSetH((h) => ((h + 10) % 12) + 1); };
  const incMin = () => { clearFb(); setSetM((m) => mins[(mins.indexOf(snapMinute(m, level)) + 1) % mins.length]); };
  const decMin = () => { clearFb(); setSetM((m) => mins[(mins.indexOf(snapMinute(m, level)) - 1 + mins.length) % mins.length]); };

  function checkSet() {
    if (feedback === "correct") return;
    if (setH === q.h && setM === q.m) {
      handleCorrect();
    } else {
      setStreak(0);
      if (setH !== q.h) { setMood("think"); setMsg("Den lille viser (timer) passer ikke helt 🕐"); }
      else { setMood("think"); setMsg("Den store viser (minutter) passer ikke helt ⏱️"); }
    }
  }

  const styleBlock = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap');
.fredoka{font-family:'Fredoka',ui-rounded,system-ui,sans-serif;}
.nunito{font-family:'Nunito',ui-rounded,system-ui,sans-serif;}
@keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
@keyframes drift{from{transform:translateX(0)}to{transform:translateX(36px)}}
@keyframes pop{0%{transform:scale(.8)}60%{transform:scale(1.08)}100%{transform:scale(1)}}
@keyframes shakey{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
@keyframes fall{0%{transform:translateY(-10px) rotate(0);opacity:0}10%{opacity:1}100%{transform:translateY(420px) rotate(380deg);opacity:0}}
@keyframes softpulse{0%,100%{opacity:1}50%{opacity:.5}}
`;

  const modeLabel = mode === "read" ? "Hvad er klokken?" : "Sæt viserne";

  // ----- MENU -----
  const Menu = (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-3">
        <div style={{ animation: "floaty 3s ease-in-out infinite" }}>
          <Owl mood="happy" size={96} />
        </div>
        <div>
          <h1 className="fredoka text-4xl sm:text-5xl font-bold leading-tight" style={{ color: "#4A3826", textShadow: "0 2px 0 #fff" }}>
            Alfred lærer klokken
          </h1>
          <p className="nunito text-base font-semibold" style={{ color: "#6E5A43" }}>
            Hej Alfred! Jeg hedder Ugo 🦉 Skal vi øve klokken sammen?
          </p>
        </div>
      </div>

      <div className="w-full rounded-3xl p-5 flex flex-col gap-4" style={{ background: "#FFFDF7", border: "3px solid #F0E2C8", boxShadow: "0 12px 30px rgba(74,56,38,.14)" }}>
        <div>
          <p className="fredoka text-lg font-semibold mb-2" style={{ color: "#4A3826" }}>1. Vælg spil</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setMode("read")} className="fredoka rounded-2xl p-4 text-left transition active:translate-y-0.5" style={{ background: mode === "read" ? "#FFF3D6" : "#FFFDF7", border: `3px solid ${mode === "read" ? "#FFC23C" : "#EBDCBF"}`, boxShadow: `0 4px 0 ${mode === "read" ? "#E9B23A" : "#EBDCBF"}` }}>
              <div className="text-3xl">🕐</div>
              <div className="text-lg font-bold" style={{ color: "#4A3826" }}>Hvad er klokken?</div>
              <div className="nunito text-sm font-semibold" style={{ color: "#7A6650" }}>Læs uret og vælg svaret</div>
            </button>
            <button onClick={() => setMode("set")} className="fredoka rounded-2xl p-4 text-left transition active:translate-y-0.5" style={{ background: mode === "set" ? "#D9F4EE" : "#FFFDF7", border: `3px solid ${mode === "set" ? "#2BB6A3" : "#EBDCBF"}`, boxShadow: `0 4px 0 ${mode === "set" ? "#1F8C7E" : "#EBDCBF"}` }}>
              <div className="text-3xl">🎯</div>
              <div className="text-lg font-bold" style={{ color: "#4A3826" }}>Sæt viserne</div>
              <div className="nunito text-sm font-semibold" style={{ color: "#7A6650" }}>Stil uret på det rigtige</div>
            </button>
          </div>
        </div>

        <div>
          <p className="fredoka text-lg font-semibold mb-2" style={{ color: "#4A3826" }}>2. Hvor svært?</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(LEVELS).map(([k, v]) => (
              <button key={k} onClick={() => setLevel(k)} className="fredoka rounded-full px-4 py-2 text-sm font-semibold transition active:translate-y-0.5" style={{ background: level === k ? "#2BB6A3" : "#FFFDF7", color: level === k ? "#fff" : "#4A3826", border: `3px solid ${level === k ? shade("#2BB6A3", -14) : "#EBDCBF"}`, boxShadow: `0 4px 0 ${level === k ? shade("#2BB6A3", -14) : "#EBDCBF"}` }}>
                {v.label} <span style={{ color: level === k ? "#FFE39B" : "#E9B23A" }}>{"★".repeat(v.stars)}</span>
              </button>
            ))}
          </div>
          <p className="nunito text-sm mt-2" style={{ color: "#9A856C" }}>{LEVELS[level].desc}</p>
        </div>

        <Btn color="#F2715B" textColor="#fff" className="mt-1 text-xl" onClick={() => setScreen("play")}>
          Spil! ▶
        </Btn>
        <p className="nunito text-xs text-center" style={{ color: "#9A856C" }}>
          Tip: I „Sæt viserne“ kan du både trække viserne og bruge knapperne ＋ og −.
        </p>
      </div>
    </div>
  );

  // ----- PLAY -----
  const Play = (
    <div className="relative w-full rounded-3xl p-4 sm:p-5 flex flex-col gap-4" style={{ background: "#FFFDF7", border: "3px solid #F0E2C8", boxShadow: "0 12px 30px rgba(74,56,38,.14)" }}>
      {showBurst && <Confetti big={burstBig.current} />}

      <div className="flex items-center justify-between gap-2">
        <button onClick={() => setScreen("menu")} className="fredoka rounded-full px-3 py-2 text-sm font-semibold transition active:translate-y-0.5" style={{ background: "#FFFDF7", color: "#7A6650", border: "3px solid #EBDCBF", boxShadow: "0 3px 0 #EBDCBF" }}>
          ← Menu
        </button>
        <div className="text-center">
          <div className="fredoka text-base font-bold leading-none" style={{ color: "#4A3826" }}>{modeLabel}</div>
          <div className="nunito text-xs font-semibold" style={{ color: "#9A856C" }}>{LEVELS[level].label}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <Pill>🌟 {stars}</Pill>
          <Pill>🏆 {trophies}</Pill>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <StarRow filled={starRow} />
        {streak >= 2 && <span className="fredoka text-sm font-bold" style={{ color: "#F2715B" }}>🔥 {streak} i træk!</span>}
      </div>

      {mode === "read" ? (
        <p className="fredoka text-center text-2xl font-bold" style={{ color: "#4A3826" }}>Hvad er klokken? 🤔</p>
      ) : (
        <div className="text-center">
          <p className="fredoka text-base font-semibold" style={{ color: "#7A6650" }}>Sæt uret til:</p>
          <p className="fredoka text-2xl font-bold" style={{ color: "#1F8C7E" }}>
            {cap(danishTime(q.h, q.m))} <span className="text-lg" style={{ color: "#9A856C" }}>({digital(q.h, q.m)})</span>
          </p>
        </div>
      )}

      <div className="w-full mx-auto" style={{ maxWidth: 300 }}>
        {mode === "read" ? (
          <Clock h={q.h} m={q.m} />
        ) : (
          <Clock h={setH} m={setM} level={level} interactive={feedback !== "correct"} onChange={({ h, m }) => { if (feedback === "correct") return; setSetH(h); setSetM(m); clearFb(); }} />
        )}
      </div>

      {mode === "read" ? (
        <div className="grid grid-cols-2 gap-3">
          {options.map((opt) => {
            const isCorrect = opt.h === q.h && opt.m === q.m;
            const picked = wrongPicks.includes(tKey(opt));
            const green = (feedback === "correct" && isCorrect) || (revealed && isCorrect);
            const red = picked;
            let bg = "#FFFFFF", tc = "#4A3826", bd = "#EBDCBF";
            if (green) { bg = "#5DBB63"; tc = "#fff"; bd = shade("#5DBB63", -16); }
            else if (red) { bg = "#E8654E"; tc = "#fff"; bd = shade("#E8654E", -16); }
            const disabled = feedback === "correct" || revealed || picked;
            return (
              <button key={tKey(opt)} disabled={disabled} onClick={() => chooseOption(opt)} className="fredoka rounded-2xl px-3 py-4 text-lg sm:text-xl font-semibold transition" style={{ background: bg, color: tc, border: `3px solid ${bd}`, boxShadow: `0 4px 0 ${bd}`, animation: green ? "pop .4s ease" : red ? "shakey .4s ease" : "none" }}>
                {cap(danishTime(opt.h, opt.m))}
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <div className="flex items-end justify-center gap-6">
            <div className="flex flex-col items-center gap-1">
              <span className="nunito text-sm font-bold" style={{ color: "#7A6650" }}>Timer</span>
              <div className="flex items-center gap-2">
                <RoundBtn onClick={decHour} disabled={feedback === "correct"}>−</RoundBtn>
                <span className="fredoka text-2xl font-bold" style={{ color: "#F2715B", width: 30, textAlign: "center" }}>{setH}</span>
                <RoundBtn onClick={incHour} disabled={feedback === "correct"}>＋</RoundBtn>
              </div>
            </div>
            {level !== "timer" && (
              <div className="flex flex-col items-center gap-1">
                <span className="nunito text-sm font-bold" style={{ color: "#7A6650" }}>Minutter</span>
                <div className="flex items-center gap-2">
                  <RoundBtn onClick={decMin} disabled={feedback === "correct"}>−</RoundBtn>
                  <span className="fredoka text-2xl font-bold" style={{ color: "#2BB6A3", width: 40, textAlign: "center" }}>{String(setM).padStart(2, "0")}</span>
                  <RoundBtn onClick={incMin} disabled={feedback === "correct"}>＋</RoundBtn>
                </div>
              </div>
            )}
          </div>
          {feedback !== "correct" && (
            <Btn color="#FFC23C" className="text-xl" onClick={checkSet}>Er det rigtigt? ✓</Btn>
          )}
        </>
      )}

      <div className="flex items-center gap-3 rounded-2xl p-3" style={{ background: "#FFF7E6", border: "2px dashed #EAD7B0" }}>
        <div className={mood === "cheer" ? "animate-bounce" : ""} style={mood === "cheer" ? { flexShrink: 0 } : { flexShrink: 0, animation: "floaty 3.2s ease-in-out infinite" }}>
          <Owl mood={mood} size={64} />
        </div>
        <p className="fredoka text-base sm:text-lg font-semibold" style={{ color: "#5A4225" }}>
          {msg || (mode === "read" ? "Kig godt på uret 👀" : "Flyt viserne på plads! ✋")}
        </p>
      </div>

      {(feedback === "correct" || revealed) && (
        <Btn color="#2BB6A3" textColor="#fff" className="text-xl" onClick={newQuestion}>Næste opgave ➜</Btn>
      )}
    </div>
  );

  return (
    <div className="nunito min-h-screen relative w-full overflow-hidden" style={{ background: "linear-gradient(180deg,#BFE6F7 0%, #DDF1FB 45%, #FBF3DF 100%)" }}>
      <style>{styleBlock}</style>
      <div className="absolute" style={{ top: -40, right: -40, width: 170, height: 170, borderRadius: 9999, background: "radial-gradient(circle at 50% 50%, #FFE39B, #FFD15C 60%, rgba(255,209,92,0) 72%)", zIndex: 1 }} />
      <Cloud style={{ top: 50, left: "6%", zIndex: 1, animation: "drift 9s ease-in-out infinite alternate" }} />
      <Cloud style={{ top: 120, right: "8%", zIndex: 1, transform: "scale(.8)", animation: "drift 12s ease-in-out infinite alternate" }} />
      <Cloud style={{ top: 240, left: "12%", zIndex: 1, transform: "scale(.65)", opacity: 0.85, animation: "drift 11s ease-in-out infinite alternate-reverse" }} />
      <svg className="absolute bottom-0 left-0 w-full" height="140" viewBox="0 0 400 140" preserveAspectRatio="none" aria-hidden="true" style={{ zIndex: 0 }}>
        <path d="M0 80 Q100 40 200 70 T400 60 L400 140 L0 140 Z" fill="#9BD17A" />
        <path d="M0 105 Q120 80 240 100 T400 95 L400 140 L0 140 Z" fill="#7DBE5E" />
      </svg>
      <div className="relative mx-auto px-4 py-6 sm:py-8 flex flex-col gap-5" style={{ maxWidth: 560, zIndex: 5 }}>
        {screen === "menu" ? Menu : Play}
      </div>
    </div>
  );
}
