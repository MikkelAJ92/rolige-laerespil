import { describe, it, expect, vi } from 'vitest';
import { renderReadMode } from '../src/activities/clock/read-mode';
import { AudioService } from '../src/services/audio';

function makeAudio() {
  return new AudioService({ speak: vi.fn(), cancel: vi.fn() }, vi.fn());
}

describe('renderReadMode', () => {
  it('viser 4 svarknapper', () => {
    const root = document.createElement('div');
    renderReadMode(root, 1, { audio: makeAudio(), rng: () => 0, onCorrect: vi.fn() });
    expect(root.querySelectorAll('.answer').length).toBe(4);
  });

  it('kalder onCorrect når det rigtige svar trykkes', () => {
    const root = document.createElement('div');
    const onCorrect = vi.fn();
    renderReadMode(root, 1, { audio: makeAudio(), rng: () => 0, onCorrect });
    const btn = Array.from(root.querySelectorAll<HTMLButtonElement>('.answer'))
      .find((b) => b.textContent === 'Klokken 1')!;
    btn.click();
    expect(onCorrect).toHaveBeenCalledWith(1);
  });

  it('kalder ikke onCorrect ved forkert svar', () => {
    const root = document.createElement('div');
    const onCorrect = vi.fn();
    renderReadMode(root, 1, { audio: makeAudio(), rng: () => 0, onCorrect });
    const wrong = Array.from(root.querySelectorAll<HTMLButtonElement>('.answer'))
      .find((b) => b.textContent !== 'Klokken 1')!;
    wrong.click();
    expect(onCorrect).not.toHaveBeenCalled();
  });
});
