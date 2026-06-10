// tests/spell-mode.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderSpellMode } from '../src/activities/words/spell-mode';
import { AudioService } from '../src/services/audio';

function makeAudio() {
  return new AudioService({ speak: vi.fn(), cancel: vi.fn() }, vi.fn());
}
function tap(root: HTMLElement, letter: string) {
  const btn = Array.from(root.querySelectorAll<HTMLButtonElement>('.tray-tile'))
    .find((b) => b.textContent === letter && !b.dataset.used);
  btn!.dataset.used = '1';
  btn!.click();
}

describe('renderSpellMode', () => {
  it('viser ét felt pr. bogstav (niveau 1 => ordet "sol")', () => {
    const root = document.createElement('div');
    renderSpellMode(root, 1, { audio: makeAudio(), rng: () => 0, onCorrect: vi.fn() });
    expect(root.querySelectorAll('.slot').length).toBe(3);
  });

  it('kalder onCorrect når ordet staves i rigtig rækkefølge', () => {
    const root = document.createElement('div');
    const onCorrect = vi.fn();
    renderSpellMode(root, 1, { audio: makeAudio(), rng: () => 0, onCorrect });
    // rng=()=>0 => ordet er "sol"
    for (const ch of 'sol') {
      const btn = Array.from(root.querySelectorAll<HTMLButtonElement>('.tray-tile'))
        .find((b) => b.textContent === ch)!;
      btn.click();
    }
    expect(onCorrect).toHaveBeenCalledWith(1);
    expect(onCorrect).toHaveBeenCalledTimes(1);
  });

  it('fylder ikke ved forkert bogstav', () => {
    const root = document.createElement('div');
    const onCorrect = vi.fn();
    renderSpellMode(root, 1, { audio: makeAudio(), rng: () => 0, onCorrect });
    // "sol": forkert første tryk er alt andet end "s"
    const wrong = Array.from(root.querySelectorAll<HTMLButtonElement>('.tray-tile'))
      .find((b) => b.textContent !== 's')!;
    wrong.click();
    expect(root.querySelectorAll('.slot--filled').length).toBe(0);
    expect(onCorrect).not.toHaveBeenCalled();
  });
});
