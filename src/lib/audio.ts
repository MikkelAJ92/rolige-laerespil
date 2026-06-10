export interface Speaker {
  speak(text: string, lang: string): void;
  cancel(): void;
}

export type TonePlayer = (freqHz: number, durationMs: number, delayMs?: number) => void;

const browserSpeaker: Speaker = {
  speak(text, lang) {
    if (typeof speechSynthesis === 'undefined') return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.95;
    const voice = speechSynthesis.getVoices().find((v) => v.lang?.startsWith('da'));
    if (voice) u.voice = voice;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  },
  cancel() {
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  },
};

let audioCtx: AudioContext | null = null;

const browserTone: TonePlayer = (freqHz, durationMs, delayMs = 0) => {
  const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  const AC = w.AudioContext ?? w.webkitAudioContext;
  if (!AC) return;
  audioCtx = audioCtx ?? new AC();
  const ctx = audioCtx;
  const start = ctx.currentTime + delayMs / 1000;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freqHz;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.06, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + durationMs / 1000);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + durationMs / 1000);
};

/** Fjerner emoji/symboler fra en streng, så den egner sig til oplæsning. */
export function speakable(s: string): string {
  return s.replace(/[^\p{L}\p{N}\s,.!?—-]/gu, '').trim();
}

export function createAudio(speaker: Speaker = browserSpeaker, tone: TonePlayer = browserTone) {
  let muted = false;
  return {
    setMuted(m: boolean) {
      muted = m;
      if (m) speaker.cancel();
    },
    isMuted() {
      return muted;
    },
    /** Blid dansk oplæsning. */
    speak(text: string) {
      if (!muted) speaker.speak(text, 'da-DK');
    },
    /** Blød to-tone-bekræftelse — ingen fanfare. */
    correct() {
      if (muted) return;
      tone(523, 140);
      tone(659, 160, 130);
    },
    /** Lidt festligere ved pokal — stadig blødt (tre toner). */
    trophy() {
      if (muted) return;
      tone(523, 130);
      tone(659, 130, 120);
      tone(784, 200, 240);
    },
  };
}

export type Audio = ReturnType<typeof createAudio>;

/** App-singleton. */
export const audio = createAudio();
