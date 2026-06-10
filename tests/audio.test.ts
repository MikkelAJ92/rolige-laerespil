import { describe, it, expect, vi } from 'vitest';
import { createAudio, speakable, type Speaker, type TonePlayer } from '../src/lib/audio';

function makeFakes() {
  const speaker: Speaker = { speak: vi.fn(), cancel: vi.fn() };
  const tone: TonePlayer = vi.fn();
  return { speaker, tone };
}

describe('createAudio', () => {
  it('taler dansk når lyden er til', () => {
    const { speaker, tone } = makeFakes();
    createAudio(speaker, tone).speak('halv fire');
    expect(speaker.speak).toHaveBeenCalledWith('halv fire', 'da-DK');
  });

  it('er tavs og annullerer når muted', () => {
    const { speaker, tone } = makeFakes();
    const audio = createAudio(speaker, tone);
    audio.setMuted(true);
    audio.speak('tre');
    audio.correct();
    audio.trophy();
    expect(speaker.speak).not.toHaveBeenCalled();
    expect(tone).not.toHaveBeenCalled();
    expect(speaker.cancel).toHaveBeenCalled();
    expect(audio.isMuted()).toBe(true);
  });

  it('spiller to bløde toner ved rigtigt og tre ved pokal', () => {
    const { speaker, tone } = makeFakes();
    const audio = createAudio(speaker, tone);
    audio.correct();
    expect(tone).toHaveBeenCalledTimes(2);
    audio.trophy();
    expect(tone).toHaveBeenCalledTimes(5);
  });
});

describe('speakable', () => {
  it('fjerner emoji men beholder tekst og tegnsætning', () => {
    expect(speakable('Flot, Alfred! 🌟')).toBe('Flot, Alfred!');
    expect(speakable('Du er en klokke-mester! ⭐')).toBe('Du er en klokke-mester!');
  });
});
