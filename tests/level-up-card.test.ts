// tests/level-up-card.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { showLevelUpCard } from '../src/ui/level-up-card';

afterEach(() => {
  document.querySelectorAll('.levelup-overlay').forEach((e) => e.remove());
});

describe('showLevelUpCard', () => {
  it('viser niveau + rang og kan lukkes med Videre', () => {
    const onClose = vi.fn();
    showLevelUpCard({ level: 2, rankName: 'Klog ugle', owlMarkup: '<svg width="10" height="10"></svg>', onClose });

    const overlay = document.querySelector('.levelup-overlay');
    expect(overlay).not.toBeNull();
    expect(overlay!.textContent).toContain('Niveau 2!');
    expect(overlay!.textContent).toContain('Klog ugle');

    overlay!.querySelector<HTMLButtonElement>('.levelup-next')!.click();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.levelup-overlay')).toBeNull();
  });
});
