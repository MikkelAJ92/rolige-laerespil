interface DinoProps {
  mood?: "idle" | "cheer" | "think";
  size?: number;
}

export default function Dino({ mood = "idle", size = 96 }: DinoProps) {
  const green = "#8FBC6F";
  const dark = "#5E8A57";
  const belly = "#E8F3DC";
  const spike = "#6FA35B";
  const cheer = mood === "cheer";
  const think = mood === "think";
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
      <path d="M14 86 Q2 82 4 70 Q14 76 22 78 Z" fill={green} />
      <ellipse cx="52" cy="84" rx="34" ry="22" fill={green} />
      <ellipse cx="52" cy="90" rx="22" ry="13" fill={belly} />
      <path d="M70 74 Q78 46 72 30 Q70 22 78 20 Q92 18 94 30 Q96 40 86 44 Q80 58 84 72 Z" fill={green} />
      <circle cx="84" cy="29" r="12" fill={green} />
      {cheer ? (
        <path d="M80 27 Q84 22 88 27" stroke="#3A4A33" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      ) : (
        <g>
          <circle cx={think ? 86 : 85} cy="27" r="4" fill="#FFFFFF" />
          <circle cx={think ? 88 : 85.5} cy="27.5" r="2" fill="#3A4A33" />
        </g>
      )}
      <path d={cheer ? "M78 36 Q84 41 90 35" : "M79 36 Q84 38 89 35"} stroke="#3A4A33" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M30 66 l6 -8 6 8 Z" fill={spike} />
      <path d="M44 62 l6 -9 6 9 Z" fill={spike} />
      <path d="M58 62 l6 -8 6 8 Z" fill={spike} />
      <rect x="34" y="100" width="10" height="14" rx="5" fill={dark} />
      <rect x="62" y="100" width="10" height="14" rx="5" fill={dark} />
      {cheer ? (
        <path d="M64 76 Q70 66 66 58" stroke={dark} strokeWidth="6" strokeLinecap="round" fill="none" />
      ) : (
        <path d="M64 80 Q70 84 68 90" stroke={dark} strokeWidth="6" strokeLinecap="round" fill="none" />
      )}
    </svg>
  );
}
