// tests/collection.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderCollection } from '../src/ui/collection';

describe('renderCollection', () => {
  beforeEach(() => localStorage.clear());

  it('viser rang-navn og optjente trofæer/dinoer', () => {
    localStorage.setItem('rl.progress.v2', JSON.stringify({
      activities: { clock: { level: 2, correctByLevel: {}, trophies: ['clock-lvl1-5'], collection: ['clock-dino-1'] } },
    }));
    const root = document.createElement('div');
    renderCollection(root, { onBack: () => {} });
    expect(root.textContent).toContain('Klog ugle');
    expect(root.querySelectorAll('.col-trophy').length).toBe(1);
    expect(root.querySelectorAll('.col-dino').length).toBe(1);
  });
});
