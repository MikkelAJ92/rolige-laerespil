import { describe, it, expect, vi } from 'vitest';
import { AudioService, type Speaker, type TonePlayer } from '../src/services/audio';

function makeFakes() {
  const speaker: Speaker = { speak: vi.fn(), cancel: vi.fn() };
  const tone: TonePlayer = vi.fn();
  return { speaker, tone };
}

describe('AudioService', () => {
  it('taler når den ikke er muted', () => {
    const { speaker, tone } = makeFakes();
    new AudioService(speaker, tone).speak('halv fire');
    expect(speaker.speak).toHaveBeenCalledWith('halv fire', 'da-DK');
  });

  it('er tavs når den er muted', () => {
    const { speaker, tone } = makeFakes();
    const audio = new AudioService(speaker, tone);
    audio.setMuted(true);
    audio.speak('tre');
    audio.playCorrect();
    expect(speaker.speak).not.toHaveBeenCalled();
    expect(tone).not.toHaveBeenCalled();
    expect(speaker.cancel).toHaveBeenCalled();
  });

  it('spiller en blød bekræftelse når den ikke er muted', () => {
    const { speaker, tone } = makeFakes();
    new AudioService(speaker, tone).playCorrect();
    expect(tone).toHaveBeenCalled();
  });
});
