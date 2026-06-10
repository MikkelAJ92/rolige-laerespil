// tests/progress-bar.test.ts
import { describe, it, expect } from 'vitest';
import { progressBar } from '../src/ui/progress-bar';

describe('progressBar', () => {
  it('fylder efter fremgang og viser hvor mange flere', () => {
    const el = progressBar(3, 5);
    expect(el.querySelector('.pbar-fill')!.getAttribute('style')).toContain('60%');
    expect(el.textContent).toContain('2 mere');
  });
  it('er tom ved 0', () => {
    const el = progressBar(0, 5);
    expect(el.querySelector('.pbar-fill')!.getAttribute('style')).toContain('0%');
    expect(el.textContent).toContain('5 mere');
  });
});
