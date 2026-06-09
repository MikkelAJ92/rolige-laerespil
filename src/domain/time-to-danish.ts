const HOUR_WORDS = [
  'tolv', 'et', 'to', 'tre', 'fire', 'fem',
  'seks', 'syv', 'otte', 'ni', 'ti', 'elleve',
];

export function hourWord(h: number): string {
  return HOUR_WORDS[((h % 12) + 12) % 12];
}

/** Returnerer den danske talemåde uden "klokken er"-præfiks. */
export function timeToDanish(hours: number, minutes: number): string {
  const h = ((hours % 12) + 12) % 12 || 12; // 1..12
  const next = h === 12 ? 1 : h + 1;
  const w = hourWord(h);
  const nw = hourWord(next);

  switch (minutes) {
    case 0:  return w;
    case 5:  return `fem minutter over ${w}`;
    case 10: return `ti minutter over ${w}`;
    case 15: return `kvart over ${w}`;
    case 20: return `tyve minutter over ${w}`;
    case 25: return `fem minutter i halv ${nw}`;
    case 30: return `halv ${nw}`;
    case 35: return `fem minutter over halv ${nw}`;
    case 40: return `tyve minutter i ${nw}`;
    case 45: return `kvart i ${nw}`;
    case 50: return `ti minutter i ${nw}`;
    case 55: return `fem minutter i ${nw}`;
    default: throw new Error(`Ikke-understøttet minut: ${minutes}`);
  }
}
