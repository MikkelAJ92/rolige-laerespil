import { shade } from '../lib/colors';

interface PadlockProps {
  open: boolean;
  size?: number;
}

export default function Padlock({ open, size = 74 }: PadlockProps) {
  const body = open ? '#5DBB63' : '#FFC23C';
  return (
    <svg viewBox="0 0 80 100" width={size} height={(size * 100) / 80} aria-hidden="true">
      <g style={{ transformOrigin: '40px 34px', transition: 'transform .55s cubic-bezier(.34,1.5,.5,1)', transform: open ? 'translateX(-12px) translateY(-7px) rotate(-26deg)' : 'none' }}>
        <path d="M24 48 V32 a16 16 0 0 1 32 0 V48" fill="none" stroke="#A98552" strokeWidth="9" strokeLinecap="round" />
      </g>
      <rect x="13" y="44" width="54" height="46" rx="11" fill={body} stroke={shade(body, -18)} strokeWidth="4" />
      <circle cx="40" cy="63" r="6.5" fill="#5A4225" />
      <rect x="37" y="65" width="6" height="15" rx="3" fill="#5A4225" />
    </svg>
  );
}
