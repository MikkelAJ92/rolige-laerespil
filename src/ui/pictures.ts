// src/ui/pictures.ts
import { owlSvg } from './mascot';
import { dinoSvg, bikeSvg } from './icons';

function wrap(inner: string, size: number): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 120 120" aria-hidden="true">${inner}</svg>`;
}

const sol = (s: number) => wrap(
  `<g stroke="#D9B25A" stroke-width="5" stroke-linecap="round">
     <line x1="60" y1="14" x2="60" y2="28"/><line x1="60" y1="92" x2="60" y2="106"/>
     <line x1="14" y1="60" x2="28" y2="60"/><line x1="92" y1="60" x2="106" y2="60"/>
     <line x1="28" y1="28" x2="38" y2="38"/><line x1="82" y1="82" x2="92" y2="92"/>
     <line x1="92" y1="28" x2="82" y2="38"/><line x1="38" y1="82" x2="28" y2="92"/>
   </g>
   <circle cx="60" cy="60" r="24" fill="#E6C66A"/>`, s);

const kat = (s: number) => wrap(
  `<path d="M38 40 L34 22 L52 36 Z" fill="#A6938A"/><path d="M82 40 L86 22 L68 36 Z" fill="#A6938A"/>
   <circle cx="60" cy="64" r="32" fill="#B3A199"/>
   <circle cx="50" cy="60" r="4" fill="#4A4A45"/><circle cx="70" cy="60" r="4" fill="#4A4A45"/>
   <path d="M60 70 l-4 5 M60 70 l4 5" stroke="#4A4A45" stroke-width="2" fill="none" stroke-linecap="round"/>
   <g stroke="#4A4A45" stroke-width="1.5"><line x1="40" y1="72" x2="24" y2="70"/><line x1="40" y1="76" x2="26" y2="80"/><line x1="80" y1="72" x2="96" y2="70"/><line x1="80" y1="76" x2="94" y2="80"/></g>`, s);

const hus = (s: number) => wrap(
  `<path d="M26 56 L60 28 L94 56 Z" fill="#C98A6B"/>
   <rect x="34" y="56" width="52" height="40" fill="#E0C9A6"/>
   <rect x="54" y="72" width="14" height="24" fill="#9C8466"/>
   <rect x="40" y="62" width="12" height="12" fill="#A9BBD0"/>`, s);

const trae = (s: number) => wrap(
  `<rect x="54" y="66" width="12" height="34" rx="3" fill="#9C8466"/>
   <circle cx="60" cy="48" r="30" fill="#8FB0A4"/>
   <circle cx="42" cy="58" r="18" fill="#9DB89A"/><circle cx="78" cy="58" r="18" fill="#9DB89A"/>`, s);

const baal = (s: number) => wrap(
  `<path d="M60 30 C72 46 70 56 60 70 C50 56 48 46 60 30 Z" fill="#D98A5A"/>
   <path d="M60 44 C66 54 65 60 60 70 C55 60 54 54 60 44 Z" fill="#E6C66A"/>
   <g stroke="#9C8466" stroke-width="6" stroke-linecap="round"><line x1="36" y1="92" x2="84" y2="80"/><line x1="36" y1="80" x2="84" y2="92"/></g>`, s);

const oeje = (s: number) => wrap(
  `<ellipse cx="60" cy="60" rx="40" ry="24" fill="#FBF8F1" stroke="#4A4A45" stroke-width="3"/>
   <circle cx="60" cy="60" r="14" fill="#7D8C9E"/><circle cx="60" cy="60" r="6" fill="#4A4A45"/>
   <circle cx="64" cy="56" r="2" fill="#fff"/>`, s);

const bold = (s: number) => wrap(
  `<circle cx="60" cy="60" r="32" fill="#A9BBD0" stroke="#7D8C9E" stroke-width="3"/>
   <path d="M28 60 H92 M60 28 V92" stroke="#7D8C9E" stroke-width="3" fill="none"/>`, s);

const fisk = (s: number) => wrap(
  `<path d="M86 60 L104 46 L104 74 Z" fill="#9DB89A"/>
   <ellipse cx="54" cy="60" rx="34" ry="20" fill="#8FB0A4"/>
   <circle cx="40" cy="55" r="3.5" fill="#4A4A45"/>`, s);

const banan = (s: number) => wrap(
  `<path d="M30 40 C40 84 80 92 96 70 C84 80 50 70 44 38 Z" fill="#E6C66A" stroke="#C9A94E" stroke-width="3"/>`, s);

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
    default: return wrap('<circle cx="60" cy="60" r="30" fill="#E2DDD2"/>', size);
  }
}
