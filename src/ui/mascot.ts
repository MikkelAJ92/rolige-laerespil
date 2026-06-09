/** Tegner uglen "Ugo". Fra rang 2 får den en lille krone. */
export function owlSvg(rank = 1, size = 64): string {
  const crown = rank >= 2
    ? '<path id="crown" d="M22 14 l18 -8 l18 8 l-4 6 l-28 0 z" fill="#CBA15A"/>'
    : '';
  return `<svg width="${size}" height="${size * 1.1}" viewBox="0 0 80 90" aria-hidden="true">
    ${crown}
    <path d="M26 20 L32 6 L40 20 Z" fill="#8FB0A4"/>
    <path d="M54 20 L48 6 L40 20 Z" fill="#8FB0A4"/>
    <ellipse cx="40" cy="50" rx="30" ry="36" fill="#A6C0B5"/>
    <ellipse cx="40" cy="58" rx="19" ry="26" fill="#F1EAD9"/>
    <circle cx="29" cy="42" r="12" fill="#FBF8F1"/>
    <circle cx="51" cy="42" r="12" fill="#FBF8F1"/>
    <circle cx="29" cy="44" r="5" fill="#4A4A45"/>
    <circle cx="51" cy="44" r="5" fill="#4A4A45"/>
    <circle cx="31" cy="42" r="1.6" fill="#fff"/>
    <circle cx="53" cy="42" r="1.6" fill="#fff"/>
    <path d="M40 48 L35 54 L45 54 Z" fill="#E0A87E"/>
    <ellipse cx="14" cy="54" rx="6" ry="15" fill="#8FB0A4"/>
    <ellipse cx="66" cy="54" rx="6" ry="15" fill="#8FB0A4"/>
  </svg>`;
}
