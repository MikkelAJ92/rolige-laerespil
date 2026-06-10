import { polar } from "../domain/time";
import { bucketState, type Stats } from "../domain/mastery";

const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

interface MasteryClockProps {
  stats: Stats;
}

export default function MasteryClock({ stats }: MasteryClockProps) {
  return (
    <svg viewBox="0 0 200 200" style={{ width: "100%", height: "auto", display: "block" }} aria-label="mestringskort">
      <circle cx="100" cy="100" r="98" fill="#B5732E" />
      <circle cx="100" cy="100" r="92" fill="#8A551F" />
      <circle cx="100" cy="100" r="88" fill="#FFFDF6" stroke="#EAD3A6" strokeWidth="1" />
      {Array.from({ length: 12 }).map((_, i) => {
        const n = i + 1;
        const p = polar(62, n * 30);
        return (
          <text key={n} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" className="fredoka" style={{ fontSize: 14, fontWeight: 600, fill: "#5A4225" }}>
            {n}
          </text>
        );
      })}
      {MINUTES.map((m) => {
        const p = polar(80, m * 6);
        const state = bucketState(stats[m]);
        if (state === "mestret") {
          return <circle key={m} cx={p.x} cy={p.y} r="7" fill="#FFC23C" stroke="#E9B23A" strokeWidth="2" />;
        }
        if (state === "øver") {
          return <circle key={m} cx={p.x} cy={p.y} r="7" fill="none" stroke="#E9B23A" strokeWidth="2.5" />;
        }
        return <circle key={m} cx={p.x} cy={p.y} r="7" fill="none" stroke="#DCCBA8" strokeWidth="2" opacity="0.45" />;
      })}
      <circle cx="100" cy="100" r="6" fill="#4A3826" />
    </svg>
  );
}
