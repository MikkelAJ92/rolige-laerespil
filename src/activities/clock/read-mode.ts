import { pickQuestion, type ClockLevel, type ClockTime, type Rng } from '../../domain/clock-levels';
import { timeToDanish } from '../../domain/time-to-danish';
import { clockFaceSvg } from './clock-face';
import { owlSvg } from '../../ui/mascot';
import { h, svgEl, empty } from '../../core/dom';
import type { AudioService } from '../../services/audio';

export interface ReadModeDeps {
  audio: AudioService;
  rng: Rng;
  onCorrect: (level: ClockLevel) => void;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Niveau 1 viser cifferform ("Klokken 3"), højere niveauer viser frasen. */
function optionLabel(t: ClockTime, level: ClockLevel): string {
  if (level === 1) return `Klokken ${t.hours}`;
  return capitalize(timeToDanish(t.hours, t.minutes));
}

export function renderReadMode(container: HTMLElement, level: ClockLevel, deps: ReadModeDeps): void {
  const { answer, options } = pickQuestion(level, deps.rng);

  const owlRow = h('div', { class: 'owl-row' }, [
    svgEl(owlSvg(1, 56)),
    h('div', { class: 'speech' }, ['Hvad er klokken? 🔊']),
  ]);
  const clockWrap = h('div', { class: 'clock-wrap' }, [svgEl(clockFaceSvg(answer.hours, answer.minutes, 184))]);
  const questionZone = h('div', { class: 'question-zone' }, [owlRow, clockWrap]);

  const answersEl = h('div', { class: 'answers' });
  const answerZone = h('div', { class: 'answer-zone' }, [
    h('div', { class: 'answer-label' }, ['Tryk på det rigtige svar']),
    answersEl,
  ]);

  let answered = false;
  for (const opt of options) {
    const btn = h('button', { class: 'answer' }, [optionLabel(opt, level)]);
    btn.addEventListener('click', () => {
      if (answered) return;
      const correct = opt.hours === answer.hours && opt.minutes === answer.minutes;
      if (correct) {
        answered = true;
        deps.audio.speak(`Klokken er ${timeToDanish(answer.hours, answer.minutes)}`);
        deps.audio.playCorrect();
        btn.classList.add('answer--correct');
        deps.onCorrect(level);
      } else {
        btn.classList.add('answer--try');
        deps.audio.speak('Prøv igen');
      }
    });
    answersEl.append(btn);
  }

  empty(container);
  container.append(questionZone, answerZone);
}
