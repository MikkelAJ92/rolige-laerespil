interface OwlProps { mood?: 'idle' | 'happy' | 'cheer' | 'sad' | 'think'; size?: number }

function Owl({ mood = 'idle', size = 96 }: OwlProps) {
  const brown = "#B5732E", brownDark = "#8A551F", belly = "#FCEFD3", orange = "#F2A03D", pupil = "#3A2A1A", cheek = "#F6A6A0", white = "#FFFFFF";
  const happy = mood === "happy" || mood === "cheer";
  const sad = mood === "sad";
  const gaze = mood === "think" ? { dx: 4, dy: -3 } : { dx: 0, dy: 0 };

  const Eye = ({ cx }: { cx: number }) => {
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

export default Owl;
