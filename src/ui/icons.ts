export function dinoSvg(color = '#9DB89A', size = 56): string {
  return `<svg width="${size}" height="${size * 0.8}" viewBox="0 0 100 80" aria-hidden="true">
    <path d="M22 52 Q8 50 4 62" stroke="${color}" stroke-width="9" fill="none" stroke-linecap="round"/>
    <ellipse cx="50" cy="52" rx="30" ry="16" fill="${color}"/>
    <path d="M68 50 Q80 44 80 26 Q80 14 73 12" stroke="${color}" stroke-width="12" fill="none" stroke-linecap="round"/>
    <circle cx="74" cy="14" r="8" fill="${color}"/>
    <circle cx="77" cy="12" r="1.6" fill="#4A4A45"/>
    <rect x="36" y="62" width="8" height="14" rx="4" fill="${color}"/>
    <rect x="58" y="62" width="8" height="14" rx="4" fill="${color}"/>
  </svg>`;
}

export function bikeSvg(color = '#9AB0C4', frame = '#C99A78', size = 56): string {
  return `<svg width="${size}" height="${size * 0.7}" viewBox="0 0 100 70" aria-hidden="true">
    <circle cx="24" cy="48" r="16" fill="none" stroke="${color}" stroke-width="4"/>
    <circle cx="76" cy="48" r="16" fill="none" stroke="${color}" stroke-width="4"/>
    <path d="M24 48 L46 48 L60 26 L40 26 M46 48 L60 26 M60 26 L76 48" stroke="${frame}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M36 26 l8 0" stroke="#4A4A45" stroke-width="3" stroke-linecap="round"/>
    <path d="M58 22 l8 0" stroke="#4A4A45" stroke-width="3" stroke-linecap="round"/>
    <circle cx="46" cy="48" r="3" fill="#4A4A45"/>
  </svg>`;
}

export function trophySvg(color = '#CBA15A', size = 28): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8 4 h8 v4 a4 4 0 0 1 -8 0 z" fill="${color}"/>
    <path d="M8 5.2 h-2.6 a2.4 2.4 0 0 0 2.6 4" stroke="${color}" stroke-width="1.4" fill="none"/>
    <path d="M16 5.2 h2.6 a2.4 2.4 0 0 1 -2.6 4" stroke="${color}" stroke-width="1.4" fill="none"/>
    <rect x="11" y="12" width="2" height="4" fill="${color}"/>
    <rect x="8" y="16" width="8" height="2.4" rx="1" fill="${color}"/>
  </svg>`;
}
