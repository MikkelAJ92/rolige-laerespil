export interface Speaker {
  speak(text: string, lang: string): void;
  cancel(): void;
}

export type TonePlayer = (freqHz: number, durationMs: number) => void;

/** Tale via browserens speechSynthesis (no-op uden for browseren). */
export class BrowserSpeaker implements Speaker {
  speak(text: string, lang: string): void {
    if (typeof speechSynthesis === 'undefined') return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.95;
    const voice = speechSynthesis.getVoices().find((v) => v.lang?.startsWith('da'));
    if (voice) u.voice = voice;
    speechSynthesis.speak(u);
  }
  cancel(): void {
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  }
}

/** Blød tone via WebAudio (no-op uden for browseren). */
export const browserTone: TonePlayer = (freqHz, durationMs) => {
  const Ctx = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext });
  const AC = Ctx.AudioContext ?? Ctx.webkitAudioContext;
  if (!AC) return;
  const ctx = new AC();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freqHz;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + durationMs / 1000);
};

export class AudioService {
  private muted = false;

  constructor(
    private speaker: Speaker = new BrowserSpeaker(),
    private tone: TonePlayer = browserTone,
  ) {}

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) this.speaker.cancel();
  }
  isMuted(): boolean {
    return this.muted;
  }

  /** Siger en tekst på dansk. */
  speak(text: string): void {
    if (this.muted) return;
    this.speaker.speak(text, 'da-DK');
  }

  /** Blød, to-tonet bekræftelse — ingen fanfare. */
  playCorrect(): void {
    if (this.muted) return;
    this.tone(523, 140); // C5
    this.tone(659, 160); // E5
  }
}
