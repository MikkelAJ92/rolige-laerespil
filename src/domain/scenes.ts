export interface Scene {
  id: string;
  locked: string;
  opened: string;
  title: string;
  bg: readonly [string, string];
  accent: string;
}

export const SCENES: readonly Scene[] = [
  { id: 'dino', locked: '🥚', opened: '🦕', title: 'Knæk koden, så klækker ægget!', bg: ['#E6F3DA', '#C7E6AE'], accent: '#6E9E4F' },
  { id: 'kiste', locked: '🧰', opened: '💎', title: 'Hjælp Ugo med at åbne kisten!', bg: ['#F4E8CE', '#E6CFA1'], accent: '#B98A4B' },
  { id: 'cykel', locked: '🚲', opened: '🚲', title: 'Lås cyklen op — så kan I køre en tur!', bg: ['#DDF0F8', '#BFE3F1'], accent: '#4FA3C4' },
  { id: 'raket', locked: '🚀', opened: '🌙', title: 'Tast startkoden til raketten!', bg: ['#DBDEF2', '#BCC2E7'], accent: '#5B63B0' },
  { id: 'traedoer', locked: '🦉', opened: '🪟', title: 'Den hemmelige dør i Ugos træ.', bg: ['#E2EADB', '#C6D5BA'], accent: '#6E8A5A' },
  { id: 'doer', locked: '🚪', opened: '✨', title: 'En dør med en hemmelig kode…', bg: ['#F0E6EE', '#E0CADC'], accent: '#9B6F92' },
];

export function pickScene(rng: () => number = Math.random, avoid?: string): Scene {
  const pool = avoid ? SCENES.filter((s) => s.id !== avoid) : SCENES;
  const list = pool.length ? pool : SCENES;
  return list[Math.floor(rng() * list.length)];
}
