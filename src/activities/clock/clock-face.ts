// src/activities/clock/clock-face.ts
import { hourHandAngle, minuteHandAngle } from '../../domain/clock-math';
import { uid } from '../../ui/uid';

const NUMBERS: Array<{ n: number; x: number; y: number }> = [
  { n: 12, x: 100, y: 42 }, { n: 1, x: 131, y: 50 }, { n: 2, x: 154, y: 69 },
  { n: 3, x: 162, y: 100 }, { n: 4, x: 154, y: 131 }, { n: 5, x: 131, y: 150 },
  { n: 6, x: 100, y: 158 }, { n: 7, x: 69, y: 150 }, { n: 8, x: 46, y: 131 },
  { n: 9, x: 38, y: 100 }, { n: 10, x: 46, y: 69 }, { n: 11, x: 69, y: 50 },
];

export function clockFaceSvg(hours: number, minutes: number, size = 200): string {
  const ha = hourHandAngle(hours, minutes);
  const ma = minuteHandAngle(minutes);
  const face = uid('clk-face');
  const sh = uid('clk-sh');
  const numbers = NUMBERS.map(
    ({ n, x, y }) =>
      `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-family="Georgia, serif" font-size="16" fill="#4A4A45">${n}</text>`,
  ).join('');

  return `<svg width="${size}" height="${size}" viewBox="0 0 200 200" role="img" aria-label="analogt ur">
    <defs>
      <radialGradient id="${face}" cx="42%" cy="36%" r="68%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#EDE3D2"/></radialGradient>
      <filter id="${sh}" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#6b6a53" flood-opacity="0.18"/></filter>
    </defs>
    <circle cx="100" cy="100" r="86" fill="url(#${face})" stroke="#A8C3B8" stroke-width="6" filter="url(#${sh})"/>
    <circle cx="100" cy="100" r="79" fill="none" stroke="#E7E0D2" stroke-width="1.5"/>
    ${numbers}
    <line x1="100" y1="100" x2="100" y2="40" stroke="#4A4A45" stroke-width="4.5" stroke-linecap="round" transform="rotate(${ma} 100 100)"/>
    <line x1="100" y1="100" x2="100" y2="58" stroke="#C98A6B" stroke-width="6.5" stroke-linecap="round" transform="rotate(${ha} 100 100)"/>
    <circle cx="100" cy="100" r="5.5" fill="#4A4A45"/>
  </svg>`;
}
