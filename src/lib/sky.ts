export interface SkyTheme {
  gradient: string;
  night: boolean;
}

/** Himlens udtryk ud fra den rigtige time (0-23). Rolige, dæmpede overgange. */
export function skyTheme(hour: number): SkyTheme {
  if (hour >= 21 || hour < 6) {
    return { gradient: 'linear-gradient(180deg,#2C3A5A 0%,#46587A 55%,#6B5E7A 100%)', night: true };
  }
  if (hour < 9) {
    return { gradient: 'linear-gradient(180deg,#FFD9B8 0%,#CDE6F5 50%,#FBF3DF 100%)', night: false };
  }
  if (hour < 17) {
    return { gradient: 'linear-gradient(180deg,#BFE6F7 0%,#DDF1FB 45%,#FBF3DF 100%)', night: false };
  }
  return { gradient: 'linear-gradient(180deg,#F5C28C 0%,#E8D3E0 55%,#FBF3DF 100%)', night: false };
}
