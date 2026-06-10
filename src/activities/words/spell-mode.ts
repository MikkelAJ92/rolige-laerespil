// src/activities/words/spell-mode.ts
import {
  pickWord, shuffledLetters, isCorrectNext, isComplete,
  WORD_LEVELS, type WordLevel, type Rng,
} from '../../domain/words';
import { pictureSvg } from '../../ui/pictures';
import { owlSvg } from '../../ui/mascot';
import { h, svgEl, empty } from '../../core/dom';
import type { AudioService } from '../../services/audio';

export interface SpellModeDeps {
  audio: AudioService;
  rng: Rng;
  onCorrect: (level: WordLevel) => void;
}

export function renderSpellMode(container: HTMLElement, level: WordLevel, deps: SpellModeDeps): void {
  const entry = pickWord(level, deps.rng);
  const word = entry.word;
  const cfg = WORD_LEVELS[level];
  let typed = '';
  let tray = shuffledLetters(word, deps.rng);
  let done = false;

  const owlRow = h('div', { class: 'owl-row' }, [
    svgEl(owlSvg(1, 56)),
    h('div', { class: 'speech' }, ['Stav ordet 🔊']),
  ]);
  const picture = h('div', { class: 'word-picture' }, [svgEl(pictureSvg(entry.picture, 120))]);
  const guide = h('div', { class: cfg.showWord ? 'word-guide' : 'word-guide word-guide--hidden' }, [word]);
  const questionZone = h('div', { class: 'question-zone' }, [owlRow, picture, guide]);

  const slotsEl = h('div', { class: 'slots' });
  const trayEl = h('div', { class: 'tray' });
  const answerZone = h('div', { class: 'answer-zone' }, [
    h('div', { class: 'answer-label' }, ['Tryk bogstaverne i rækkefølge']),
    slotsEl,
    trayEl,
  ]);

  function update(): void {
    empty(slotsEl);
    for (let i = 0; i < word.length; i++) {
      const filled = i < typed.length;
      slotsEl.append(h('div', { class: filled ? 'slot slot--filled' : 'slot' }, [filled ? typed[i] : '']));
    }
    empty(trayEl);
    tray.forEach((letter, idx) => {
      const tile = h('button', { class: 'tray-tile' }, [letter]);
      tile.addEventListener('click', () => onTile(letter, idx, tile));
      tile.addEventListener('animationend', () => tile.classList.remove('tray-tile--wrong'));
      trayEl.append(tile);
    });
  }

  function onTile(letter: string, idx: number, tile: HTMLElement): void {
    if (done) return;
    if (isCorrectNext(word, typed, letter)) {
      typed += letter;
      tray.splice(idx, 1);
      update();
      if (isComplete(word, typed)) {
        done = true;
        deps.audio.speak(word);
        deps.audio.playCorrect();
        deps.onCorrect(level);
      }
    } else {
      tile.classList.add('tray-tile--wrong');
    }
  }

  empty(container);
  container.append(questionZone, answerZone);
  update();
  deps.audio.speak(word);
}
