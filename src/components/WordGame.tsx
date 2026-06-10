import { useEffect, useMemo, useRef, useState } from "react";
import { makePuzzle, pickWord, gapForLetter, type WordLevel } from "../domain/words";
import type { Audio } from "../lib/audio";
import Dino from "./Dino";

interface WordGameProps {
  level: WordLevel;
  round: number;
  feedback: "idle" | "correct";
  audio: Audio;
  onComplete: (word: string) => void;
  onWrong: () => void;
}

export default function WordGame({ level, round, feedback, audio, onComplete, onWrong }: WordGameProps) {
  const lastWord = useRef<string | undefined>(undefined);
  const puzzle = useMemo(() => {
    const entry = pickWord(level, Math.random, lastWord.current);
    lastWord.current = entry.word;
    return makePuzzle(entry, level, Math.random);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, round]);

  const [filledIdx, setFilledIdx] = useState<number[]>([]);
  const [usedTiles, setUsedTiles] = useState<number[]>([]);
  const [wrongTile, setWrongTile] = useState<number | null>(null);
  const [dinoThink, setDinoThink] = useState(false);
  const thinkTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    setFilledIdx([]);
    setUsedTiles([]);
    setWrongTile(null);
    audio.speak(`Dino har gemt bogstaver i ordet ${puzzle.entry.word}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle]);

  function tapTile(i: number) {
    if (feedback === "correct" || usedTiles.includes(i)) return;
    const letter = puzzle.tray[i];
    const gap = gapForLetter(puzzle, filledIdx, letter);
    if (gap >= 0) {
      const nextFilled = [...filledIdx, gap];
      setFilledIdx(nextFilled);
      setUsedTiles([...usedTiles, i]);
      if (nextFilled.length === puzzle.hiddenIdx.length) {
        onComplete(puzzle.entry.word);
      }
    } else {
      setWrongTile(i);
      if (thinkTimer.current) window.clearTimeout(thinkTimer.current);
      setDinoThink(true);
      thinkTimer.current = window.setTimeout(() => setDinoThink(false), 900);
      onWrong();
    }
  }

  const word = puzzle.entry.word;
  const dinoMood = feedback === "correct" ? "cheer" : dinoThink ? "think" : "idle";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <Dino mood={dinoMood} size={92} />
        <span style={{ fontSize: 54 }}>{puzzle.entry.emoji}</span>
        <button
          onClick={() => audio.speak(word)}
          aria-label="Hør ordet"
          className="fredoka rounded-full transition active:translate-y-0.5"
          style={{ width: 44, height: 44, fontSize: 18, background: "#FFF3D6", border: "3px solid #E9C77E", boxShadow: "0 3px 0 #E9C77E" }}
        >
          🔊
        </button>
      </div>

      <div className="flex gap-2 justify-center flex-wrap">
        {word.split("").map((ch, idx) => {
          const isHidden = puzzle.hiddenIdx.includes(idx);
          const isFilled = filledIdx.includes(idx);
          if (!isHidden) {
            return (
              <div key={idx} className="fredoka flex items-center justify-center font-bold" style={{ width: 46, height: 54, fontSize: 28, color: "#4A3826", background: "#FFFDF7", border: "3px solid #EBDCBF", borderRadius: 12, boxShadow: "0 3px 0 #EBDCBF" }}>
                {ch}
              </div>
            );
          }
          return (
            <div key={idx} className="fredoka flex items-center justify-center font-bold" style={{ width: 46, height: 54, fontSize: 28, color: "#1F8C7E", background: isFilled ? "#D9F4EE" : "#FFF9EC", border: `3px ${isFilled ? "solid #2BB6A3" : "dashed #E9C77E"}`, borderRadius: 12, boxShadow: isFilled ? "0 3px 0 #1F8C7E" : "none", animation: isFilled ? "pop .3s ease" : "none" }}>
              {isFilled ? ch : ""}
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 justify-center flex-wrap">
        {puzzle.tray.map((letter, i) => {
          const used = usedTiles.includes(i);
          return (
            <button
              key={i}
              disabled={used || feedback === "correct"}
              onClick={() => tapTile(i)}
              onAnimationEnd={() => setWrongTile((w) => (w === i ? null : w))}
              className="fredoka font-semibold transition active:translate-y-0.5"
              style={{ width: 52, height: 52, fontSize: 24, color: "#4A3826", background: used ? "#F3EDE0" : "#FFFFFF", border: "3px solid #EBDCBF", borderRadius: 14, boxShadow: used ? "none" : "0 4px 0 #EBDCBF", opacity: used ? 0.35 : 1, animation: wrongTile === i ? "shakey .4s ease" : "none" }}
            >
              {letter}
            </button>
          );
        })}
      </div>
    </div>
  );
}
