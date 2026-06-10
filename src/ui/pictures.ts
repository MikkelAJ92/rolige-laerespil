// src/ui/pictures.ts
import { owlSvg } from './mascot';
import { dinoSvg, bikeSvg } from './icons';
import { uid } from './uid';

function svg(inner: string, size: number): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 120 120" aria-hidden="true">${inner}</svg>`;
}

function sol(s: number): string {
  const g = uid('sol-g');
  const sh = uid('sol-sh');
  return svg(
    `<defs>
       <radialGradient id="${g}" cx="42%" cy="38%" r="65%"><stop offset="0%" stop-color="#F0D98A"/><stop offset="100%" stop-color="#DBB85A"/></radialGradient>
       <filter id="${sh}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3.5" flood-color="#9a7d2e" flood-opacity="0.22"/></filter>
     </defs>
     <g stroke="#E2C261" stroke-width="6" stroke-linecap="round">
       <line x1="60" y1="12" x2="60" y2="26"/><line x1="60" y1="94" x2="60" y2="108"/><line x1="12" y1="60" x2="26" y2="60"/><line x1="94" y1="60" x2="108" y2="60"/>
       <line x1="26" y1="26" x2="36" y2="36"/><line x1="84" y1="84" x2="94" y2="94"/><line x1="94" y1="26" x2="84" y2="36"/><line x1="36" y1="84" x2="26" y2="94"/>
     </g>
     <circle cx="60" cy="60" r="26" fill="url(#${g})" filter="url(#${sh})"/>`,
    s,
  );
}

function kat(s: number): string {
  const g = uid('kat-g');
  const sh = uid('kat-sh');
  return svg(
    `<defs>
       <radialGradient id="${g}" cx="42%" cy="34%" r="72%"><stop offset="0%" stop-color="#C2B1A8"/><stop offset="100%" stop-color="#9E8B82"/></radialGradient>
       <filter id="${sh}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3.5" flood-color="#4a3f39" flood-opacity="0.2"/></filter>
     </defs>
     <g filter="url(#${sh})">
       <path d="M40 42 L34 22 L54 38 Z" fill="#9E8B82"/><path d="M80 42 L86 22 L66 38 Z" fill="#9E8B82"/>
       <circle cx="60" cy="64" r="32" fill="url(#${g})"/>
     </g>
     <circle cx="50" cy="60" r="4" fill="#3E3E3A"/><circle cx="70" cy="60" r="4" fill="#3E3E3A"/>
     <path d="M60 70 l-4 5 M60 70 l4 5" stroke="#3E3E3A" stroke-width="2" fill="none" stroke-linecap="round"/>
     <g stroke="#3E3E3A" stroke-width="1.5"><line x1="40" y1="72" x2="24" y2="70"/><line x1="40" y1="76" x2="26" y2="80"/><line x1="80" y1="72" x2="96" y2="70"/><line x1="80" y1="76" x2="94" y2="80"/></g>`,
    s,
  );
}

function hus(s: number): string {
  const roof = uid('hus-roof');
  const wall = uid('hus-wall');
  const sh = uid('hus-sh');
  return svg(
    `<defs>
       <linearGradient id="${roof}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#D89C7D"/><stop offset="100%" stop-color="#B97A5C"/></linearGradient>
       <linearGradient id="${wall}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ECD7B4"/><stop offset="100%" stop-color="#DBC198"/></linearGradient>
       <filter id="${sh}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3.5" flood-color="#6a4f3a" flood-opacity="0.2"/></filter>
     </defs>
     <g filter="url(#${sh})">
       <rect x="34" y="56" width="52" height="40" fill="url(#${wall})"/>
       <path d="M26 56 L60 28 L94 56 Z" fill="url(#${roof})"/>
     </g>
     <rect x="54" y="72" width="14" height="24" rx="2" fill="#9C8466"/>
     <rect x="40" y="62" width="12" height="12" rx="2" fill="#A9BBD0"/>`,
    s,
  );
}

function trae(s: number): string {
  const g = uid('trae-g');
  const sh = uid('trae-sh');
  return svg(
    `<defs>
       <radialGradient id="${g}" cx="40%" cy="34%" r="72%"><stop offset="0%" stop-color="#A6C4AC"/><stop offset="100%" stop-color="#7FA083"/></radialGradient>
       <filter id="${sh}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3.5" flood-color="#3f5140" flood-opacity="0.2"/></filter>
     </defs>
     <rect x="54" y="66" width="12" height="34" rx="3" fill="#9C8466"/>
     <g filter="url(#${sh})">
       <circle cx="42" cy="56" r="18" fill="url(#${g})"/><circle cx="78" cy="56" r="18" fill="url(#${g})"/><circle cx="60" cy="44" r="24" fill="url(#${g})"/>
     </g>`,
    s,
  );
}

function baal(s: number): string {
  const g = uid('baal-g');
  const sh = uid('baal-sh');
  return svg(
    `<defs>
       <linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#E6C66A"/><stop offset="100%" stop-color="#D9774A"/></linearGradient>
       <filter id="${sh}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#7a3f24" flood-opacity="0.22"/></filter>
     </defs>
     <g stroke="#9C8466" stroke-width="6" stroke-linecap="round"><line x1="36" y1="92" x2="84" y2="80"/><line x1="36" y1="80" x2="84" y2="92"/></g>
     <path d="M60 30 C72 46 70 56 60 70 C50 56 48 46 60 30 Z" fill="url(#${g})" filter="url(#${sh})"/>
     <path d="M60 44 C66 54 65 60 60 70 C55 60 54 54 60 44 Z" fill="#F0DE9A"/>`,
    s,
  );
}

function oeje(s: number): string {
  const g = uid('oeje-g');
  const sh = uid('oeje-sh');
  return svg(
    `<defs>
       <radialGradient id="${g}" cx="50%" cy="45%" r="60%"><stop offset="0%" stop-color="#8FA0B2"/><stop offset="100%" stop-color="#5E7A83"/></radialGradient>
       <filter id="${sh}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#3a3a45" flood-opacity="0.18"/></filter>
     </defs>
     <ellipse cx="60" cy="60" rx="40" ry="24" fill="#FBF8F1" stroke="#4A4A45" stroke-width="3" filter="url(#${sh})"/>
     <circle cx="60" cy="60" r="14" fill="url(#${g})"/><circle cx="60" cy="60" r="6" fill="#3E3E3A"/>
     <circle cx="64" cy="56" r="2.4" fill="#fff"/>`,
    s,
  );
}

function bold(s: number): string {
  const g = uid('bold-g');
  const sh = uid('bold-sh');
  return svg(
    `<defs>
       <radialGradient id="${g}" cx="40%" cy="34%" r="70%"><stop offset="0%" stop-color="#BCCBDB"/><stop offset="100%" stop-color="#90A6BE"/></radialGradient>
       <filter id="${sh}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3.5" flood-color="#3f4a57" flood-opacity="0.2"/></filter>
     </defs>
     <circle cx="60" cy="60" r="32" fill="url(#${g})" stroke="#7D8C9E" stroke-width="2.5" filter="url(#${sh})"/>
     <path d="M28 60 H92 M60 28 V92" stroke="#7D8C9E" stroke-width="2.5" fill="none" opacity="0.8"/>`,
    s,
  );
}

function fisk(s: number): string {
  const g = uid('fisk-g');
  const sh = uid('fisk-sh');
  return svg(
    `<defs>
       <linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#A6C4B6"/><stop offset="100%" stop-color="#7FA092"/></linearGradient>
       <filter id="${sh}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#3f5147" flood-opacity="0.2"/></filter>
     </defs>
     <g filter="url(#${sh})">
       <path d="M84 60 L104 46 L104 74 Z" fill="#7FA092"/>
       <ellipse cx="52" cy="60" rx="34" ry="20" fill="url(#${g})"/>
     </g>
     <circle cx="38" cy="55" r="3.5" fill="#3E3E3A"/>`,
    s,
  );
}

function banan(s: number): string {
  const g = uid('banan-g');
  const sh = uid('banan-sh');
  return svg(
    `<defs>
       <linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#EBD27A"/><stop offset="100%" stop-color="#D4B24A"/></linearGradient>
       <filter id="${sh}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#8a6f2a" flood-opacity="0.2"/></filter>
     </defs>
     <path d="M30 40 C40 84 80 92 96 70 C84 80 50 70 44 38 Z" fill="url(#${g})" stroke="#C9A94E" stroke-width="2.5" filter="url(#${sh})"/>`,
    s,
  );
}

export function pictureSvg(id: string, size = 120): string {
  switch (id) {
    case 'ugle': return owlSvg(1, size);
    case 'dino': return dinoSvg('#9DB89A', size);
    case 'cykel': return bikeSvg('#9AB0C4', '#C99A78', size);
    case 'sol': return sol(size);
    case 'kat': return kat(size);
    case 'hus': return hus(size);
    case 'trae': return trae(size);
    case 'baal': return baal(size);
    case 'oeje': return oeje(size);
    case 'bold': return bold(size);
    case 'fisk': return fisk(size);
    case 'banan': return banan(size);
    default: return svg('<circle cx="60" cy="60" r="30" fill="#E2DDD2"/>', size);
  }
}
