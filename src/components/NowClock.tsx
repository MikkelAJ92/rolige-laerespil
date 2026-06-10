import { useEffect, useState } from "react";
import Clock from "./Clock";
import { danishTime, cap, type Time } from "../domain/time";
import { roundTimeTo5 } from "../domain/mastery";

interface NowClockProps {
  onAsk: (t: Time) => void;
}

export default function NowClock({ onAsk }: NowClockProps) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 10000);
    return () => window.clearInterval(id);
  }, []);
  const t = roundTimeTo5(now.getHours(), now.getMinutes());
  return (
    <div className="w-full rounded-3xl p-4 flex items-center gap-4" style={{ background: "#FFFDF7", border: "3px solid #F0E2C8", boxShadow: "0 12px 30px rgba(74,56,38,.14)" }}>
      <div style={{ width: 86, flexShrink: 0 }}>
        <Clock h={t.h} m={t.m} />
      </div>
      <div className="flex flex-col items-start gap-1">
        <span className="nunito text-xs font-bold uppercase" style={{ color: "#9A856C", letterSpacing: "0.06em" }}>Lige nu</span>
        <span className="fredoka text-xl font-semibold" style={{ color: "#4A3826" }}>{cap(danishTime(t.h, t.m))}</span>
        <button onClick={() => onAsk(t)} className="fredoka rounded-full px-4 py-2 text-sm font-semibold transition active:translate-y-0.5" style={{ background: "#FFF3D6", color: "#8A551F", border: "3px solid #E9C77E", boxShadow: "0 3px 0 #E9C77E" }}>
          Spørg mig om den! 🕐
        </button>
      </div>
    </div>
  );
}
