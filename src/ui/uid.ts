let counter = 0;

/** Unik id-streng pr. kald — bruges til gradient-/filter-id'er, så de ikke kolliderer i DOM'en. */
export function uid(prefix = 'id'): string {
  counter += 1;
  return `${prefix}-${counter}`;
}
