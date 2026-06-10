// src/ui/icons.ts
import { uid } from './uid';

export function dinoSvg(color = '#9DB89A', size = 56): string {
  const sh = uid('dino-sh');
  return `<svg width="${size}" height="${size * 0.8}" viewBox="0 0 100 80" aria-hidden="true">
    <defs><filter id="${sh}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#3d5142" flood-opacity="0.2"/></filter></defs>
    <g filter="url(#${sh})">
      <path d="M22 52 Q8 50 4 62" stroke="${color}" stroke-width="9" fill="none" stroke-linecap="round"/>
      <ellipse cx="50" cy="52" rx="30" ry="16" fill="${color}"/>
      <path d="M68 50 Q80 44 80 26 Q80 14 73 12" stroke="${color}" stroke-width="12" fill="none" stroke-linecap="round"/>
      <circle cx="74" cy="14" r="8" fill="${color}"/>
      <rect x="36" y="62" width="8" height="14" rx="4" fill="${color}"/>
      <rect x="58" y="62" width="8" height="14" rx="4" fill="${color}"/>
    </g>
    <ellipse cx="44" cy="46" rx="16" ry="6" fill="#FFFFFF" opacity="0.18"/>
    <circle cx="77" cy="12" r="1.6" fill="#4A4A45"/>
  </svg>`;
}

export function bikeSvg(color = '#9AB0C4', frame = '#C99A78', size = 56): string {
  const sh = uid('bike-sh');
  return `<svg width="${size}" height="${size * 0.7}" viewBox="0 0 100 70" aria-hidden="true">
    <defs><filter id="${sh}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2.5" stdDeviation="2" flood-color="#3a4250" flood-opacity="0.2"/></filter></defs>
    <g filter="url(#${sh})">
      <circle cx="24" cy="48" r="16" fill="none" stroke="${color}" stroke-width="4"/>
      <circle cx="76" cy="48" r="16" fill="none" stroke="${color}" stroke-width="4"/>
      <path d="M24 48 L46 48 L60 26 L40 26 M46 48 L60 26 M60 26 L76 48" stroke="${frame}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M36 26 l8 0" stroke="#4A4A45" stroke-width="3" stroke-linecap="round"/>
      <path d="M58 22 l8 0" stroke="#4A4A45" stroke-width="3" stroke-linecap="round"/>
    </g>
    <circle cx="46" cy="48" r="3" fill="#4A4A45"/>
  </svg>`;
}

export function trophySvg(color = '#CBA15A', size = 28): string {
  const g = uid('tr-g');
  const sh = uid('tr-sh');
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">
    <defs>
      <linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#E0C173"/><stop offset="100%" stop-color="${color}"/></linearGradient>
      <filter id="${sh}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1" stdDeviation="0.8" flood-color="#8a6a1f" flood-opacity="0.25"/></filter>
    </defs>
    <g filter="url(#${sh})" fill="url(#${g})">
      <path d="M8 4 h8 v4 a4 4 0 0 1 -8 0 z"/>
      <rect x="11" y="12" width="2" height="4"/>
      <rect x="8" y="16" width="8" height="2.4" rx="1"/>
    </g>
    <path d="M8 5.2 h-2.6 a2.4 2.4 0 0 0 2.6 4" stroke="url(#${g})" stroke-width="1.4" fill="none"/>
    <path d="M16 5.2 h2.6 a2.4 2.4 0 0 1 -2.6 4" stroke="url(#${g})" stroke-width="1.4" fill="none"/>
  </svg>`;
}
