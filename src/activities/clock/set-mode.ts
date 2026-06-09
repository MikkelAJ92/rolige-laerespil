import { LEVELS, type ClockLevel, type ClockTime, type Rng, timesForLevel } from '../../domain/clock-levels';
import { timeToDanish } from '../../domain/time-to-danish';
import { clockFaceSvg } from './clock-face';
import { owlSvg } from '../../ui/mascot';
import { h, svgEl, empty } from '../../core/dom';
import type { AudioService } from '../../services/audio';

export function stepHour(hour: number, dir: 1 | -1): number {
  return ((hour - 1 + dir + 12) % 12) + 1;
}

export function stepMinute(current: number, minutes: number[], dir: 1 | -1): number {
  const i = minutes.indexOf(current);
  const n = (i + dir + minutes.length) % minutes.length;
  return minutes[n];
}

export interface SetModeDeps {
  audio: AudioService;
  rng: Rng;
  onCorrect: (level: ClockLevel) => void;
}

function stepper(label: string, onMinus: () => void, onPlus: () => void): HTMLElement {
  const minus = h('button', { class: 'step' }, ['−']);
  minus.addEventListener('click', onMinus);
  const plus = h('button', { class: 'step' }, ['+']);
  plus.addEventListener('click', onPlus);
  return h('div', { class: 'stepper' }, [minus, h('span', {}, [label]), plus]);
}

export function renderSetMode(container: HTMLElement, level: ClockLevel, deps: SetModeDeps): void {
  const all = timesForLevel(level);
  const target: ClockTime = all[Math.floor(deps.rng() * all.length)];
  const minutes = LEVELS[level].minutes;
  let current: ClockTime = { hours: 6, minutes: minutes[0] };

  const clockWrap = h('div', { class: 'clock-wrap' });
  const redraw = () => {
    empty(clockWrap);
    clockWrap.append(svgEl(clockFaceSvg(current.hours, current.minutes, 184)));
  };

  const owlRow = h('div', { class: 'owl-row' }, [
    svgEl(owlSvg(1, 56)),
    h('div', { class: 'speech' }, [`Sæt den til ${timeToDanish(target.hours, target.minutes)} 🔊`]),
  ]);
  const questionZone = h('div', { class: 'question-zone' }, [owlRow, clockWrap]);

  const hourStepper = stepper(
    'Time',
    () => { current = { ...current, hours: stepHour(current.hours, -1) }; redraw(); },
    () => { current = { ...current, hours: stepHour(current.hours, 1) }; redraw(); },
  );
  const minuteStepper = stepper(
    'Minut',
    () => { current = { ...current, minutes: stepMinute(current.minutes, minutes, -1) }; redraw(); },
    () => { current = { ...current, minutes: stepMinute(current.minutes, minutes, 1) }; redraw(); },
  );

  let done = false;
  const check = h('button', { class: 'check' }, ['Sådan!']);
  check.addEventListener('click', () => {
    if (done) return;
    if (current.hours === target.hours && current.minutes === target.minutes) {
      done = true;
      deps.audio.speak('Flot! Det er rigtigt');
      deps.audio.playCorrect();
      deps.onCorrect(level);
    } else {
      deps.audio.speak('Prøv igen');
    }
  });

  const answerZone = h('div', { class: 'answer-zone' }, [
    h('div', { class: 'answer-label' }, ['Stil viserne']),
    h('div', { class: 'steppers' }, [hourStepper, minuteStepper]),
    check,
  ]);

  empty(container);
  container.append(questionZone, answerZone);
  redraw();
  deps.audio.speak(`Sæt den til ${timeToDanish(target.hours, target.minutes)}`);
}
