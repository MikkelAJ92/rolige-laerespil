import { useState, useRef, useEffect, useCallback } from 'react';
import { LEVELS, danishTime, makeOptions, snapMinute, cap, digital, tKey, rand, CORRECT, WRONG, type LevelKey, type Time } from './domain/time';
import { pickTime, recordAnswer, levelMastered, levelBadge, nextLevel, deriveLevel } from './domain/mastery';
import { loadProgress, saveProgress, loadStats, saveStats } from './lib/persistence';
import { audio, speakable } from "./lib/audio";
import { shade } from './lib/colors';
import Owl from './components/Owl';
import Clock from './components/Clock';
import NowClock from './components/NowClock';
import MasteryClock from './components/MasteryClock';
import { Btn, RoundBtn, Pill, StarRow, Cloud, Confetti } from './components/ui';

export default function App() {
  const [initial] = useState(loadProgress);
  const [screen, setScreen] = useState<'menu' | 'play' | 'mitur'>('menu');
  const [mode, setMode] = useState<'read' | 'set'>(initial.mode);
  const [level, setLevel] = useState<LevelKey>(initial.level);

  const [q, setQ] = useState<Time>({ h: 3, m: 0 });
  const [options, setOptions] = useState<Time[]>([]);
  const [feedback, setFeedback] = useState<'idle' | 'correct'>('idle');
  const [revealed, setRevealed] = useState(false);
  const [, setAttempts] = useState(0);
  const [wrongPicks, setWrongPicks] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const [mood, setMood] = useState<'idle' | 'happy' | 'cheer' | 'sad' | 'think'>('idle');

  const [setH, setSetH] = useState(12);
  const [setM, setSetM] = useState(0);

  const [stars, setStars] = useState(initial.stars);
  const [streak, setStreak] = useState(0);
  const [starRow, setStarRow] = useState(initial.starRow);
  const [trophies, setTrophies] = useState(initial.trophies);
  const [sound, setSound] = useState(initial.sound);
  const [stats, setStats] = useState(loadStats);
  const [suggestion, setSuggestion] = useState<LevelKey | null>(null);
  const firstTry = useRef(true);
  const suggestedRef = useRef<Set<LevelKey>>(new Set());
  const skipNext = useRef(false);

  const [burst, setBurst] = useState(0);
  const burstBig = useRef<boolean>(false);
  const [showBurst, setShowBurst] = useState(false);

  useEffect(() => {
    saveProgress({ stars, trophies, starRow, level, mode, sound });
  }, [stars, trophies, starRow, level, mode, sound]);

  useEffect(() => {
    audio.setMuted(!sound);
  }, [sound]);

  useEffect(() => {
    saveStats(stats);
  }, [stats]);

  useEffect(() => {
    if (burst === 0) return;
    setShowBurst(true);
    const t = setTimeout(() => setShowBurst(false), burstBig.current ? 1900 : 1300);
    return () => clearTimeout(t);
  }, [burst]);

  const newQuestion = useCallback(() => {
    const q2 = pickTime(stats, level, Math.random);
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
    firstTry.current = true;
    if (mode === "set") audio.speak("Sæt uret til " + danishTime(q2.h, q2.m));
    const nxt = nextLevel(level);
    if (nxt && levelMastered(stats, level) && !suggestedRef.current.has(level)) {
      suggestedRef.current.add(level);
      setSuggestion(level);
    } else {
      setSuggestion(null);
    }
  }, [level, stats, mode]);

  useEffect(() => {
    if (screen === "play") {
      if (skipNext.current) {
        skipNext.current = false;
        return;
      }
      newQuestion();
    }
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
      audio.trophy();
      audio.speak("Pokal! Du samlede fem stjerner!");
    } else {
      setStarRow(next);
      burstBig.current = false;
      setBurst((b) => b + 1);
      const praise = rand(CORRECT);
      setMsg(praise);
      audio.correct();
      audio.speak(cap(danishTime(q.h, q.m)) + ". " + speakable(praise));
    }
  }

  function chooseOption(opt: Time) {
    if (feedback === "correct" || revealed) return;
    if (opt.h === q.h && opt.m === q.m) {
      if (firstTry.current) {
        firstTry.current = false;
        setStats((s) => recordAnswer(s, q.m, true));
      }
      handleCorrect();
      return;
    }
    if (firstTry.current) {
      firstTry.current = false;
      setStats((s) => recordAnswer(s, q.m, false));
    }
    setWrongPicks((p) => (p.includes(tKey(opt)) ? p : [...p, tKey(opt)]));
    setStreak(0);
    setAttempts((prev) => {
      const nn = prev + 1;
      if (nn >= 2) {
        setRevealed(true);
        setMood("sad");
        setMsg(`Den rigtige er: ${cap(danishTime(q.h, q.m))} 🕐`);
        audio.speak("Den rigtige er " + danishTime(q.h, q.m));
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
      if (firstTry.current) {
        firstTry.current = false;
        setStats((s) => recordAnswer(s, q.m, true));
      }
      handleCorrect();
    } else {
      if (firstTry.current) {
        firstTry.current = false;
        setStats((s) => recordAnswer(s, q.m, false));
      }
      setStreak(0);
      if (setH !== q.h) { setMood("think"); setMsg("Den lille viser (timer) passer ikke helt 🕐"); }
      else { setMood("think"); setMsg("Den store viser (minutter) passer ikke helt ⏱️"); }
    }
  }

  function askNow(t: Time) {
    skipNext.current = true;
    setScreen("play");
    setQ(t);
    setOptions(makeOptions(t, deriveLevel(t.m)));
    setFeedback("idle");
    setRevealed(false);
    setAttempts(0);
    setWrongPicks([]);
    setMsg("");
    setMood("idle");
    setSetH(12);
    setSetM(0);
    setSuggestion(null);
    firstTry.current = true;
    audio.speak(mode === "set" ? "Sæt uret til " + danishTime(t.h, t.m) : "Hvad er klokken lige nu?");
  }

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
              <button key={k} onClick={() => setLevel(k as LevelKey)} className="fredoka rounded-full px-4 py-2 text-sm font-semibold transition active:translate-y-0.5" style={{ background: level === k ? "#2BB6A3" : "#FFFDF7", color: level === k ? "#fff" : "#4A3826", border: `3px solid ${level === k ? shade("#2BB6A3", -14) : "#EBDCBF"}`, boxShadow: `0 4px 0 ${level === k ? shade("#2BB6A3", -14) : "#EBDCBF"}` }}>
                {v.label} <span style={{ color: level === k ? "#FFE39B" : "#E9B23A" }}>{"★".repeat(v.stars)}</span>
                {levelBadge(stats, k as LevelKey) && (
                  <span style={{ marginLeft: 6, color: level === k ? "#FFE39B" : "#5DBB63" }}>{levelBadge(stats, k as LevelKey)}</span>
                )}
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
      <div className="flex gap-3">
        <button
          onClick={() => setScreen("mitur")}
          className="fredoka rounded-full px-5 py-2 text-base font-semibold transition active:translate-y-0.5"
          style={{ background: "#FFFDF7", color: "#4A3826", border: "3px solid #EBDCBF", boxShadow: "0 4px 0 #EBDCBF" }}
        >
          Mit ur 🕐
        </button>
        <button
          onClick={() => setSound((s) => !s)}
          className="fredoka rounded-full px-5 py-2 text-base font-semibold transition active:translate-y-0.5"
          style={{ background: "#FFFDF7", color: "#4A3826", border: "3px solid #EBDCBF", boxShadow: "0 4px 0 #EBDCBF" }}
        >
          {sound ? "🔊 Lyd til" : "🔇 Lyd fra"}
        </button>
      </div>
      <NowClock onAsk={askNow} />
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
          <button
            onClick={() => setSound((s) => !s)}
            className="fredoka rounded-full transition active:translate-y-0.5"
            style={{ width: 38, height: 38, fontSize: 16, background: "#FFFDF7", border: "3px solid #EBDCBF", boxShadow: "0 3px 0 #EBDCBF" }}
          >
            {sound ? "🔊" : "🔇"}
          </button>
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
        {suggestion && !msg && feedback !== "correct" ? (
          <div className="flex flex-col gap-2">
            <p className="fredoka text-base sm:text-lg font-semibold" style={{ color: "#5A4225" }}>
              Du kan {LEVELS[suggestion].label.toLowerCase()} nu! Skal vi prøve {LEVELS[nextLevel(suggestion)!].label.toLowerCase()}? 🦉
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const nxt = nextLevel(suggestion);
                  setSuggestion(null);
                  if (nxt) setLevel(nxt);
                }}
                className="fredoka rounded-full px-4 py-1.5 text-sm font-semibold transition active:translate-y-0.5"
                style={{ background: "#2BB6A3", color: "#fff", border: "3px solid #1F8C7E", boxShadow: "0 3px 0 #1F8C7E" }}
              >
                Ja!
              </button>
              <button
                onClick={() => setSuggestion(null)}
                className="fredoka rounded-full px-4 py-1.5 text-sm font-semibold transition active:translate-y-0.5"
                style={{ background: "#FFFDF7", color: "#7A6650", border: "3px solid #EBDCBF", boxShadow: "0 3px 0 #EBDCBF" }}
              >
                Ikke nu
              </button>
            </div>
          </div>
        ) : (
          <p className="fredoka text-base sm:text-lg font-semibold" style={{ color: "#5A4225" }}>
            {msg || (mode === "read" ? "Kig godt på uret 👀" : "Flyt viserne på plads! ✋")}
          </p>
        )}
      </div>

      {(feedback === "correct" || revealed) && (
        <Btn color="#2BB6A3" textColor="#fff" className="text-xl" onClick={newQuestion}>Næste opgave ➜</Btn>
      )}
    </div>
  );

  const MitUr = (
    <div className="w-full rounded-3xl p-4 sm:p-5 flex flex-col gap-4" style={{ background: "#FFFDF7", border: "3px solid #F0E2C8", boxShadow: "0 12px 30px rgba(74,56,38,.14)" }}>
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setScreen("menu")}
          className="fredoka rounded-full px-3 py-2 text-sm font-semibold transition active:translate-y-0.5"
          style={{ background: "#FFFDF7", color: "#7A6650", border: "3px solid #EBDCBF", boxShadow: "0 3px 0 #EBDCBF" }}
        >
          ← Menu
        </button>
        <div className="fredoka text-base font-bold" style={{ color: "#4A3826" }}>Mit ur 🕐</div>
        <div style={{ width: 64 }} />
      </div>
      <div className="w-full mx-auto" style={{ maxWidth: 280 }}>
        <MasteryClock stats={stats} />
      </div>
      <p className="nunito text-sm text-center font-semibold" style={{ color: "#7A6650" }}>
        Guld = du kan den ⭐ · Ring = du øver · Svag = ny
      </p>
    </div>
  );

  return (
    <div className="nunito min-h-screen relative w-full overflow-hidden" style={{ background: "linear-gradient(180deg,#BFE6F7 0%, #DDF1FB 45%, #FBF3DF 100%)" }}>
      <div className="absolute" style={{ top: -40, right: -40, width: 170, height: 170, borderRadius: 9999, background: "radial-gradient(circle at 50% 50%, #FFE39B, #FFD15C 60%, rgba(255,209,92,0) 72%)", zIndex: 1 }} />
      <Cloud style={{ top: 50, left: "6%", zIndex: 1, animation: "drift 9s ease-in-out infinite alternate" }} />
      <Cloud style={{ top: 120, right: "8%", zIndex: 1, transform: "scale(.8)", animation: "drift 12s ease-in-out infinite alternate" }} />
      <Cloud style={{ top: 240, left: "12%", zIndex: 1, transform: "scale(.65)", opacity: 0.85, animation: "drift 11s ease-in-out infinite alternate-reverse" }} />
      <svg className="absolute bottom-0 left-0 w-full" height="140" viewBox="0 0 400 140" preserveAspectRatio="none" aria-hidden="true" style={{ zIndex: 0 }}>
        <path d="M0 80 Q100 40 200 70 T400 60 L400 140 L0 140 Z" fill="#9BD17A" />
        <path d="M0 105 Q120 80 240 100 T400 95 L400 140 L0 140 Z" fill="#7DBE5E" />
      </svg>
      <div className="relative mx-auto px-4 py-6 sm:py-8 flex flex-col gap-5" style={{ maxWidth: 560, zIndex: 5 }}>
        {screen === "menu" ? Menu : screen === "play" ? Play : MitUr}
      </div>
    </div>
  );
}
