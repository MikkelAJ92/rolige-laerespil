// src/domain/ranks.ts
/** Uglens rang-navn ud fra niveau. */
export function rankName(level: number): string {
  if (level <= 1) return 'Ugle-ven';
  if (level === 2) return 'Klog ugle';
  if (level === 3) return 'Vis ugle';
  return 'Mester-ugle';
}
