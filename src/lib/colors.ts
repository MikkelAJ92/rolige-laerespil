// darken/lighten a hex color (amt -100..100)
export function shade(hex: string, amt: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + (amt / 100) * 255)));
  const r = f((num >> 16) & 255);
  const g = f((num >> 8) & 255);
  const b = f(num & 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
