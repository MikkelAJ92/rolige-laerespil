import { uid } from './uid';

export type OwlExpression = 'calm' | 'happy';

/** Tegner uglen "Ugo" i stil B. Krone fra rang 2. */
export function owlSvg(rank = 1, size = 64, expression: OwlExpression = 'calm'): string {
  const body = uid('owl-body');
  const belly = uid('owl-belly');
  const beak = uid('owl-beak');
  const gold = uid('owl-gold');
  const sh = uid('owl-sh');

  const crown = rank >= 2
    ? `<path data-part="crown" d="M40 22 L40 12 L50 18 L60 6 L70 18 L80 12 L80 22 Z" fill="url(#${gold})" filter="url(#${sh})"/>`
    : '';

  const eyes = expression === 'happy'
    ? `<g data-eyes="happy">
         <path d="M37 64 q7 -10 14 0" stroke="#3E3E3A" stroke-width="3.5" fill="none" stroke-linecap="round"/>
         <path d="M69 64 q7 -10 14 0" stroke="#3E3E3A" stroke-width="3.5" fill="none" stroke-linecap="round"/>
         <circle cx="34" cy="72" r="5" fill="#E0A87E" opacity="0.4"/>
         <circle cx="86" cy="72" r="5" fill="#E0A87E" opacity="0.4"/>
       </g>`
    : `<g data-eyes="calm">
         <circle cx="44" cy="62" r="7.5" fill="#3E3E3A"/><circle cx="76" cy="62" r="7.5" fill="#3E3E3A"/>
         <circle cx="47.5" cy="58.5" r="2.8" fill="#fff"/><circle cx="79.5" cy="58.5" r="2.8" fill="#fff"/>
       </g>`;

  return `<svg width="${size}" height="${size * 1.1}" viewBox="0 0 120 132" aria-hidden="true">
    <defs>
      <radialGradient id="${body}" cx="40%" cy="32%" r="78%"><stop offset="0%" stop-color="#BBD0C6"/><stop offset="100%" stop-color="#90B1A5"/></radialGradient>
      <linearGradient id="${belly}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#F8F1E1"/><stop offset="100%" stop-color="#E6D6BA"/></linearGradient>
      <linearGradient id="${beak}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#EAB489"/><stop offset="100%" stop-color="#D2935F"/></linearGradient>
      <linearGradient id="${gold}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#E0C173"/><stop offset="100%" stop-color="#C49A4A"/></linearGradient>
      <filter id="${sh}" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="4" stdDeviation="4.5" flood-color="#3a4a42" flood-opacity="0.18"/></filter>
    </defs>
    ${crown}
    <g filter="url(#${sh})">
      <path d="M38 30 L46 10 L56 30 Z" fill="#8FB0A4"/><path d="M82 30 L74 10 L64 30 Z" fill="#8FB0A4"/>
      <ellipse cx="60" cy="74" rx="44" ry="52" fill="url(#${body})"/>
      <path d="M20 66 q-7 24 7 46 q7 -22 5 -46 z" fill="#83A89B"/><path d="M100 66 q7 24 -7 46 q-7 -22 -5 -46 z" fill="#83A89B"/>
      <ellipse cx="60" cy="84" rx="28" ry="38" fill="url(#${belly})"/>
    </g>
    <circle cx="44" cy="60" r="17" fill="#FBF8F1"/><circle cx="76" cy="60" r="17" fill="#FBF8F1"/>
    ${eyes}
    <path d="M60 68 l-6 9 l12 0 z" fill="url(#${beak})"/>
  </svg>`;
}
