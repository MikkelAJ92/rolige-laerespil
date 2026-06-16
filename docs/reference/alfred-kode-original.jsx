import React, { useState, useEffect, useRef } from "react";
/* ============================================================
  Alfred knækker koden — et lille børnespil om kodelåse
  Læs ledetrådene, regn den hemmelige 4-cifrede kode ud,
  og lås hængelåsen op. Frisk, garanteret-løselig kode hver gang.
  Samme stil og maskot (Ugo 🦉) som "Alfred lærer klokken".
  ============================================================ */

// ---------- Hjælpere ----------
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

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

// ---------- Kode-logik (ledetråde) ----------
// clue(g, code) -> [rette plads, rigtig men forkert plads]
function clue(g, code) {
  let bulls = 0;
  for (let i = 0; i < 4; i++) if (g[i] === code[i]) bulls++;
  const s = new Set(code);
  let total = 0;
  for (const x of g) if (s.has(x)) total++;
  return [bulls, total - bulls];
}
const CLEAN = new Set(["0,0", "1,0", "2,0", "3,0", "0,1", "0,2", "0,3"]);
const isClean = (b, c) => CLEAN.has(b + "," + c);

const NUM = { 1: "ét", 2: "to", 3: "tre" };
function clueText(b, c) {
  if (b === 0 && c === 0) return "Intet tal er rigtigt";
  if (b > 0) return `${cap(NUM[b])} tal er rigtig${b > 1 ? "e" : "t"} og på ${b > 1 ? "rette pladser" : "rette plads"}`;
  return `${cap(NUM[c])} tal er rigtig${c > 1 ? "e" : "t"}, men på ${c > 1 ? "forkerte pladser" : "forkert plads"}`;
}

// Alle 5040 koder med 4 forskellige cifre
function buildAll() {
  const out = [];
  for (let a = 0; a < 10; a++)
    for (let b = 0; b < 10; b++) {
      if (b === a) continue;
      for (let c = 0; c < 10; c++) {
        if (c === a || c === b) continue;
        for (let d = 0; d < 10; d++) {
          if (d === a || d === b || d === c) continue;
          out.push([a, b, c, d]);
        }
      }
    }
  return out;
}
const ALL = buildAll();

function sample4() {
  const p = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = p.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  return p.slice(0, 4);
}
const same = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];

// Faste, dobbelt-tjekkede koder som sikkerhedsnet
function fb(secret, guesses) {
  const code = secret.split("").map(Number);
  return {
    secret,
    rows: guesses.map((s) => {
      const g = s.split("").map(Number);
      const [b, c] = clue(g, code);
      return { g, b, c };
    }),
  };
}
const FALLBACK = {
  nem: fb("5283", ["9714", "5643", "5217", "7984", "9432"]),
  mellem: fb("7402", ["3815", "9308", "1624", "7805", "3182"]),
  svaer: fb("3916", ["2578", "0518", "1873", "8301", "1692"]),
  ekspert: fb("5183", ["6709", "2197", "3591", "7852", "4937"]),
};

// Hver kode skal have VARIEREDE ledetråde — ikke samme type igen og igen.
// Måltyper pr. sværhedsgrad som [rette plads, forkert plads].
// Sværhedsgraden styres af antallet af "rette plads"-ankre:
// nem = 2 ankre, mellem/svær = 1, ekspert = 0 (alt skal regnes ud).
const TARGETS = {
  nem:     [[0, 0], [2, 0], [1, 0], [0, 1], [0, 2]],
  mellem:  [[0, 0], [2, 0], [0, 1], [0, 2], [0, 3]],
  svaer:   [[0, 0], [1, 0], [0, 1], [0, 2], [0, 3]],
  ekspert: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 2]],
};

// Hvordan "udfyldnings"-rækker vælges pr. sværhedsgrad, så sværhedstrappen holder:
// flere "rette plads"-ankre = lettere. bullCap = max antal "rette plads"-rækker.
const DIFF_FILL = {
  nem:     { bullCap: 99, prefer: "place" },
  mellem:  { bullCap: 1, prefer: "none" },
  svaer:   { bullCap: 1, prefer: "wrong" },
  ekspert: { bullCap: 1, prefer: "wrong" },
};

// Lav en frisk, entydig kode med varierede ledetråde
function genPuzzle(diff) {
  const target = TARGETS[diff] || TARGETS.nem;
  const cfg = DIFF_FILL[diff] || DIFF_FILL.nem;
  const isBull = (k) => k.charCodeAt(0) !== 48; // "2,0" -> true, "0,3" -> false
  for (let attempt = 0; attempt < 200; attempt++) {
    const secret = sample4();

    // sortér alle rene gæt i "spande" efter ledetråds-type
    const buckets = new Map();
    for (const g of ALL) {
      if (same(g, secret)) continue;
      const [b, c] = clue(g, secret);
      if (!isClean(b, c)) continue;
      const k = b + "," + c;
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k).push(g);
    }

    let rows = [];
    let cands = ALL;
    let bulls = 0;
    const used = new Set();
    const count = {};
    const addType = (k) => {
      const arr = buckets.get(k);
      if (!arr || !arr.length) return false;
      for (let t = 0; t < 10; t++) {
        const g = arr[Math.floor(Math.random() * arr.length)];
        const key = g.join("");
        if (used.has(key)) continue;
        used.add(key);
        const [b, c] = k.split(",").map(Number);
        rows.push({ g, b, c });
        count[k] = (count[k] || 0) + 1;
        if (b > 0) bulls++;
        cands = cands.filter((code) => { const [bb, cc] = clue(g, code); return bb === b && cc === c; });
        return true;
      }
      return false;
    };

    // 1) læg de ønskede, varierede typer
    for (const [b, c] of target) addType(b + "," + c);

    // 2) fyld op til entydighed — bevar variation OG sværhedsgrad (maks 2 ens)
    const types = [...buckets.keys()].filter((k) => k !== "0,0");
    let guard = 0;
    while (cands.length > 1 && guard++ < 40) {
      const pool = types.filter((k) => (count[k] || 0) < 2 && !(isBull(k) && bulls >= cfg.bullCap));
      pool.sort((a, b) => {
        if (cfg.prefer === "place") { const d = (isBull(a) ? 0 : 1) - (isBull(b) ? 0 : 1); if (d) return d; }
        if (cfg.prefer === "wrong") { const d = (isBull(a) ? 1 : 0) - (isBull(b) ? 1 : 0); if (d) return d; }
        return (count[a] || 0) - (count[b] || 0);
      });
      let added = false;
      for (const k of pool) if (addType(k)) { added = true; break; }
      if (!added) for (const k of types.filter((k) => (count[k] || 0) < 2)) if (addType(k)) { added = true; break; }
      if (!added) for (const k of types) if (addType(k)) { added = true; break; }
      if (!added) break;
    }

    // kræv at koden har mindst 3 forskellige typer ledetråde
    const distinct = Object.keys(count).length;
    if (cands.length === 1 && rows.length <= 7 && distinct >= 3) {
      for (let i = rows.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [rows[i], rows[j]] = [rows[j], rows[i]]; }
      return { secret: secret.join(""), rows };
    }
  }
  return FALLBACK[diff];
}

const LEVELS = {
  nem: { label: "Nem", stars: 1, desc: "Mange tal sidder på rette plads" },
  mellem: { label: "Mellem", stars: 2, desc: "Lidt mere at regne ud" },
  svaer: { label: "Svær", stars: 3, desc: "Tallene er ofte flyttet" },
  ekspert: { label: "Ekspert", stars: 4, desc: "Kun for kode-mestre" },
};
const LEVEL_COLOR = { nem: "#5DBB63", mellem: "#3FA0DE", svaer: "#F2A03D", ekspert: "#F2715B" };

const CORRECT = ["Du knækkede koden, Alfred! 🔓", "Låsen er åben! 🎉", "Kode-mester! ⭐", "Sådan — helt rigtig kode! 👏", "Wow, du klarede det! 💫"];
const WRONG = ["Ikke helt — kig på ledetrådene 👀", "Prøv igen, Alfred — du kan godt! 💪", "Tæt på! Læs ledetrådene en gang til 🧐", "Hov, prøv en anden kode 🙂"];

// ---------- Ugle-maskotten Ugo ----------
function Owl({ mood = "idle", size = 96 }) {
  const brown = "#B5732E", brownDark = "#8A551F", belly = "#FCEFD3", orange = "#F2A03D", pupil = "#3A2A1A", cheek = "#F6A6A0", white = "#FFFFFF";
  const happy = mood === "happy" || mood === "cheer";
  const sad = mood === "sad";
  const gaze = mood === "think" ? { dx: 4, dy: -3 } : { dx: 0, dy: 0 };
  const Eye = ({ cx }) => {
    if (happy) return <path d={`M ${cx - 11} 60 Q ${cx} 49 ${cx + 11} 60`} stroke={brownDark} strokeWidth="4" fill="none" strokeLinecap="round" />;
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

// ---------- Hængelås ----------
function Padlock({ open, size = 74 }) {
  const body = open ? "#5DBB63" : "#FFC23C";
  return (
    <svg viewBox="0 0 80 100" width={size} height={(size * 100) / 80} aria-hidden="true">
      <g style={{ transformOrigin: "40px 34px", transition: "transform .55s cubic-bezier(.34,1.5,.5,1)", transform: open ? "translateX(-12px) translateY(-7px) rotate(-26deg)" : "none" }}>
        <path d="M24 48 V32 a16 16 0 0 1 32 0 V48" fill="none" stroke="#A98552" strokeWidth="9" strokeLinecap="round" />
      </g>
      <rect x="13" y="44" width="54" height="46" rx="11" fill={body} stroke={shade(body, -18)} strokeWidth="4" />
      <circle cx="40" cy="63" r="6.5" fill="#5A4225" />
      <rect x="37" y="65" width="6" height="15" rx="3" fill="#5A4225" />
    </svg>
  );
}

// ---------- Små UI-byggeklodser ----------
function Btn({ children, onClick, color = "#FFC23C", textColor = "#4A3826", disabled, className = "", style = {} }) {
  const dark = shade(color, -18);
  return (
    <button onClick={onClick} disabled={disabled} className={`fredoka select-none rounded-2xl px-5 py-3 text-lg font-semibold transition active:translate-y-0.5 disabled:opacity-50 ${className}`}
      style={{ background: color, color: textColor, border: `3px solid ${dark}`, boxShadow: `0 5px 0 ${dark}, 0 8px 16px rgba(74,56,38,.16)`, ...style }}>
      {children}
    </button>
  );
}
function Pill({ children }) {
  return <span className="fredoka rounded-full px-3 py-1 text-sm font-semibold" style={{ background: "#FFFDF7", color: "#7A6650", border: "3px solid #EBDCBF" }}>{children}</span>;
}
function StarRow({ filled }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ fontSize: 22, filter: i < filled ? "none" : "grayscale(1)", opacity: i < filled ? 1 : 0.35, transition: "all .3s" }}>⭐</span>
      ))}
    </div>
  );
}
function Dot({ kind }) {
  // kind: "place" (rette plads, grøn) | "wrong" (forkert plads, orange)
  const c = kind === "place" ? "#5DBB63" : "#F2A03D";
  return <span style={{ display: "inline-block", width: 13, height: 13, borderRadius: 999, background: c, border: `2px solid ${shade(c, -20)}` }} />;
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
        const left = Math.random() * 100, delay = Math.random() * 0.3, dur = 1 + Math.random() * 0.9, sz = 16 + Math.random() * 16;
        return <span key={i} style={{ position: "absolute", left: `${left}%`, top: -10, fontSize: sz, animation: `fall ${dur}s ${delay}s ease-in forwards` }}>{emojis[i % emojis.length]}</span>;
      })}
    </div>
  );
}

// ---------- Ledetråds-række ----------
function ClueRow({ g, b, c, faded }) {
  return (
    <div className="flex items-center gap-2.5" style={{ opacity: faded ? 0.45 : 1, transition: "opacity .3s" }}>
      <div className="flex gap-1.5" style={{ flexShrink: 0 }}>
        {g.map((d, i) => (
          <div key={i} className="fredoka" style={{ width: 30, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#5A4225", background: "#FFF7E6", border: "2.5px solid #E9D3A4", borderRadius: 9 }}>{d}</div>
        ))}
      </div>
      <span className="nunito" style={{ fontSize: 13.5, fontWeight: 700, color: "#6E5A43", lineHeight: 1.25, flex: 1 }}>{clueText(b, c)}</span>
      <div className="flex gap-1" style={{ flexShrink: 0 }}>
        {b === 0 && c === 0 ? (
          <span style={{ fontSize: 16, color: "#C2B49A" }}>✕</span>
        ) : (
          <>
            {Array.from({ length: b }).map((_, i) => <Dot key={"p" + i} kind="place" />)}
            {Array.from({ length: c }).map((_, i) => <Dot key={"w" + i} kind="wrong" />)}
          </>
        )}
      </div>
    </div>
  );
}

// ---------- Taltastatur ----------
function Keypad({ onDigit, onBack, onSubmit, canSubmit, disabledSet, locked }) {
  const Key = ({ label, onClick, variant, disabled }) => {
    let bg = "#FFF3D6", tc = "#8A551F", bd = "#E9C77E";
    if (variant === "back") { bg = "#FBE6DF"; tc = "#B5562F"; bd = "#EBC3B1"; }
    if (variant === "ok") { bg = canSubmit ? "#5DBB63" : "#E7E2D6"; tc = canSubmit ? "#fff" : "#A89E8A"; bd = canSubmit ? shade("#5DBB63", -16) : "#D8D1C0"; }
    return (
      <button onClick={onClick} disabled={disabled} className="fredoka select-none rounded-2xl transition active:translate-y-0.5 disabled:opacity-35"
        style={{ height: 54, fontSize: variant ? 24 : 26, fontWeight: 700, background: bg, color: tc, border: `3px solid ${bd}`, boxShadow: `0 4px 0 ${bd}` }}>
        {label}
      </button>
    );
  };
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
        <Key key={d} label={d} onClick={() => onDigit(d)} disabled={locked || disabledSet.has(d)} />
      ))}
      <Key label="⌫" variant="back" onClick={onBack} disabled={locked} />
      <Key label={0} onClick={() => onDigit(0)} disabled={locked || disabledSet.has(0)} />
      <Key label="🔓" variant="ok" onClick={onSubmit} disabled={locked || !canSubmit} />
    </div>
  );
}

// ---------- Hovedkomponent ----------
export default function App() {
  const [screen, setScreen] = useState("menu");
  const [diff, setDiff] = useState("nem");
  const [puzzle, setPuzzle] = useState(FALLBACK.nem);
  const [entry, setEntry] = useState([]); // tal som tastes ind
  const [solved, setSolved] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [shake, setShake] = useState(false);
  const [hintOn, setHintOn] = useState(false);
  const [msg, setMsg] = useState("");
  const [mood, setMood] = useState("idle");

  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(0);
  const [starRow, setStarRow] = useState(0);
  const [trophies, setTrophies] = useState(0);
  const [done, setDone] = useState({}); // hvilke sværhedsgrader er klaret

  const [burst, setBurst] = useState(0);
  const burstBig = useRef(false);
  const [showBurst, setShowBurst] = useState(false);
  useEffect(() => {
    if (burst === 0) return;
    setShowBurst(true);
    const t = setTimeout(() => setShowBurst(false), burstBig.current ? 1900 : 1300);
    return () => clearTimeout(t);
  }, [burst]);

  const secretArr = puzzle.secret.split("").map(Number);
  const excluded = new Set(); // tal der IKKE er med (fra "intet rigtigt"-rækken)
  puzzle.rows.forEach((r) => { if (r.b === 0 && r.c === 0) r.g.forEach((d) => excluded.add(d)); });

  function startLevel(d) {
    setDiff(d);
    setPuzzle(genPuzzle(d));
    setEntry([]);
    setSolved(false);
    setRevealed(false);
    setHintOn(false);
    setMsg("");
    setMood("idle");
    setScreen("play");
  }
  function newPuzzle() {
    setPuzzle(genPuzzle(diff));
    setEntry([]);
    setSolved(false);
    setRevealed(false);
    setHintOn(false);
    setMsg("");
    setMood("idle");
  }

  function handleCorrect() {
    setSolved(true);
    setMood("cheer");
    setStars((s) => s + 1);
    setStreak((s) => s + 1);
    setDone((d) => ({ ...d, [diff]: true }));
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

  function pushDigit(d) {
    if (solved || revealed) return;
    if (entry.length >= 4) return;
    setEntry((e) => [...e, d]);
    if (mood !== "cheer") { setMood("idle"); setMsg(""); }
  }
  function backspace() {
    if (solved || revealed) return;
    setEntry((e) => e.slice(0, -1));
  }
  function submit() {
    if (solved || revealed || entry.length < 4) return;
    if (entry.join("") === puzzle.secret) {
      handleCorrect();
    } else {
      setStreak(0);
      setShake(true);
      setMood("think");
      setMsg(rand(WRONG));
      setTimeout(() => setShake(false), 450);
    }
  }
  function reveal() {
    setRevealed(true);
    setStreak(0);
    setEntry(secretArr);
    setMood("sad");
    setMsg(`Koden var ${puzzle.secret.split("").join(" ")} 🔓`);
  }

  const styleBlock = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap');
.fredoka{font-family:'Fredoka',ui-rounded,system-ui,sans-serif;}
.nunito{font-family:'Nunito',ui-rounded,system-ui,sans-serif;}
@keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
@keyframes drift{from{transform:translateX(0)}to{transform:translateX(36px)}}
@keyframes pop{0%{transform:scale(.8)}60%{transform:scale(1.08)}100%{transform:scale(1)}}
@keyframes shakey{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
@keyframes fall{0%{transform:translateY(-10px) rotate(0);opacity:0}10%{opacity:1}100%{transform:translateY(440px) rotate(380deg);opacity:0}}
`;

  // ----- MENU -----
  const Menu = (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-3">
        <div style={{ animation: "floaty 3s ease-in-out infinite" }}><Owl mood="happy" size={92} /></div>
        <div>
          <h1 className="fredoka text-4xl sm:text-5xl font-bold leading-tight" style={{ color: "#4A3826", textShadow: "0 2px 0 #fff" }}>Alfred knækker koden</h1>
          <p className="nunito text-base font-semibold" style={{ color: "#6E5A43" }}>Hej Alfred! Det er Ugo 🦉 Kan du regne den hemmelige kode ud?</p>
        </div>
      </div>

      <div className="w-full rounded-3xl p-5 flex flex-col gap-4" style={{ background: "#FFFDF7", border: "3px solid #F0E2C8", boxShadow: "0 12px 30px rgba(74,56,38,.14)" }}>
        <div className="flex items-center justify-between">
          <p className="fredoka text-lg font-semibold" style={{ color: "#4A3826" }}>Vælg sværhedsgrad</p>
          <div className="flex items-center gap-1.5"><Pill>🌟 {stars}</Pill><Pill>🏆 {trophies}</Pill></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(LEVELS).map(([k, v]) => {
            const col = LEVEL_COLOR[k];
            return (
              <button key={k} onClick={() => startLevel(k)} className="fredoka rounded-2xl p-4 text-left transition active:translate-y-0.5"
                style={{ background: "#FFFDF7", border: `3px solid ${shade(col, 30)}`, boxShadow: `0 5px 0 ${shade(col, 30)}` }}>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold" style={{ color: "#4A3826" }}>{v.label}</span>
                  {done[k] && <span style={{ fontSize: 18 }}>✅</span>}
                </div>
                <div style={{ color: col, fontSize: 15 }}>{"★".repeat(v.stars)}<span style={{ color: "#E2D2B4" }}>{"★".repeat(4 - v.stars)}</span></div>
                <div className="nunito text-sm font-semibold" style={{ color: "#7A6650" }}>{v.desc}</div>
              </button>
            );
          })}
        </div>
        <div className="rounded-2xl p-3 flex items-start gap-2" style={{ background: "#FFF7E6", border: "2px dashed #EAD7B0" }}>
          <span style={{ fontSize: 20 }}>💡</span>
          <p className="nunito text-sm font-semibold" style={{ color: "#6E5A43" }}>Find den hemmelige 4-cifrede kode med ledetrådene. Alle fire tal er forskellige. Start med rækken „intet tal er rigtigt“ — så ved du hvilke tal der <b>ikke</b> er med.</p>
        </div>
      </div>
    </div>
  );

  // ----- PLAY -----
  const col = LEVEL_COLOR[diff];
  const Play = (
    <div className="relative w-full rounded-3xl p-4 sm:p-5 flex flex-col gap-4" style={{ background: "#FFFDF7", border: "3px solid #F0E2C8", boxShadow: "0 12px 30px rgba(74,56,38,.14)" }}>
      {showBurst && <Confetti big={burstBig.current} />}

      <div className="flex items-center justify-between gap-2">
        <button onClick={() => setScreen("menu")} className="fredoka rounded-full px-3 py-2 text-sm font-semibold transition active:translate-y-0.5" style={{ background: "#FFFDF7", color: "#7A6650", border: "3px solid #EBDCBF", boxShadow: "0 3px 0 #EBDCBF" }}>← Menu</button>
        <div className="text-center">
          <div className="fredoka text-base font-bold leading-none" style={{ color: "#4A3826" }}>Knæk koden</div>
          <div className="nunito text-xs font-semibold" style={{ color: col }}>{LEVELS[diff].label} {"★".repeat(LEVELS[diff].stars)}</div>
        </div>
        <div className="flex items-center gap-1.5"><Pill>🌟 {stars}</Pill><Pill>🏆 {trophies}</Pill></div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <StarRow filled={starRow} />
        {streak >= 2 && <span className="fredoka text-sm font-bold" style={{ color: "#F2715B" }}>🔥 {streak} i træk!</span>}
      </div>

      {/* Hængelås + indtastede tal */}
      <div className="flex items-center justify-center gap-3">
        <Padlock open={solved} />
        <div className="flex gap-2" style={{ animation: shake ? "shakey .4s ease" : "none" }}>
          {[0, 1, 2, 3].map((i) => {
            const d = entry[i];
            const filled = d != null;
            return (
              <div key={i} className="fredoka" style={{ width: 46, height: 58, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 700, color: solved ? "#fff" : "#4A3826", background: solved ? "#5DBB63" : filled ? "#FFF3D6" : "#FBF6EA", border: `3px solid ${solved ? shade("#5DBB63", -16) : filled ? "#F0CE7E" : "#E9DCBF"}`, borderRadius: 12, transition: "all .2s", animation: solved ? "pop .4s ease" : "none" }}>{filled ? d : ""}</div>
            );
          })}
        </div>
      </div>

      {/* Ledetråde */}
      <div className="rounded-2xl p-3 flex flex-col gap-2.5" style={{ background: "#FFFFFF", border: "2.5px solid #F0E2C8" }}>
        {puzzle.rows.map((r, i) => (
          <ClueRow key={i} g={r.g} b={r.b} c={r.c} faded={hintOn && r.b === 0 && r.c === 0} />
        ))}
      </div>

      {/* Tastatur */}
      {!solved && !revealed && (
        <Keypad onDigit={pushDigit} onBack={backspace} onSubmit={submit} canSubmit={entry.length === 4} disabledSet={hintOn ? excluded : new Set()} locked={false} />
      )}

      {/* Hjælpe-knapper */}
      {!solved && !revealed && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setHintOn((h) => !h)} className="fredoka rounded-full px-4 py-2 text-sm font-semibold transition active:translate-y-0.5"
            style={{ background: hintOn ? "#FFE39B" : "#FFFDF7", color: "#8A551F", border: `3px solid ${hintOn ? "#E9B23A" : "#EBDCBF"}`, boxShadow: `0 3px 0 ${hintOn ? "#E9B23A" : "#EBDCBF"}` }}>
            💡 {hintOn ? "Skjuler tal der ikke er med" : "Hjælp mig"}
          </button>
          <button onClick={reveal} className="fredoka rounded-full px-4 py-2 text-sm font-semibold transition active:translate-y-0.5" style={{ background: "#FFFDF7", color: "#9A856C", border: "3px solid #EBDCBF", boxShadow: "0 3px 0 #EBDCBF" }}>Vis facit</button>
        </div>
      )}

      {/* Ugo-besked */}
      <div className="flex items-center gap-3 rounded-2xl p-3" style={{ background: "#FFF7E6", border: "2px dashed #EAD7B0" }}>
        <div className={mood === "cheer" ? "animate-bounce" : ""} style={mood === "cheer" ? { flexShrink: 0 } : { flexShrink: 0, animation: "floaty 3.2s ease-in-out infinite" }}>
          <Owl mood={mood} size={62} />
        </div>
        <p className="fredoka text-base sm:text-lg font-semibold" style={{ color: "#5A4225" }}>{msg || "Tast den kode du tror er rigtig — og tryk på 🔓"}</p>
      </div>

      {(solved || revealed) && (
        <div className="flex gap-2">
          <Btn color={col} textColor="#fff" className="text-lg" style={{ flex: 1 }} onClick={newPuzzle}>Ny kode ➜</Btn>
          <Btn color="#FFFDF7" textColor="#7A6650" className="text-lg" onClick={() => setScreen("menu")}>Skift</Btn>
        </div>
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
