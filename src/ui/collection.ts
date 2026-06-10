// src/ui/collection.ts
import { h, svgEl, empty } from '../core/dom';
import { owlSvg } from './mascot';
import { trophySvg, dinoSvg } from './icons';
import { rankName } from '../domain/ranks';
import { load, totalTrophies, allDinos, overallRank } from '../services/progress';

export interface CollectionDeps {
  onBack: () => void;
}

const LOCKED_SLOTS = 3; // antydning af "mere at samle"

export function renderCollection(container: HTMLElement, deps: CollectionDeps): void {
  const state = load();
  const rank = overallRank(state);
  const trophies = totalTrophies(state);
  const dinos = allDinos(state).length;

  const back = h('button', { class: 'back' }, ['‹ Hjem']);
  back.addEventListener('click', () => deps.onBack());

  const head = h('div', { class: 'col-head' }, [
    svgEl(owlSvg(rank, 64)),
    h('div', {}, [
      h('div', { class: 'col-title' }, ['Min samling']),
      h('div', { class: 'col-rank' }, [`Ugo — "${rankName(rank)}"`]),
    ]),
  ]);

  const trophyGrid = h('div', { class: 'col-grid' });
  for (let i = 0; i < trophies; i++) trophyGrid.append(h('span', { class: 'col-trophy' }, [svgEl(trophySvg('#CBA15A', 30))]));
  for (let i = 0; i < LOCKED_SLOTS; i++) trophyGrid.append(h('span', { class: 'col-locked' }, [svgEl(trophySvg('#C9C2B4', 30))]));

  const dinoGrid = h('div', { class: 'col-grid' });
  const dinoColors = ['#9DB89A', '#C99A78', '#9AB0C4', '#A6938A'];
  for (let i = 0; i < dinos; i++) dinoGrid.append(h('span', { class: 'col-dino' }, [svgEl(dinoSvg(dinoColors[i % dinoColors.length], 44))]));
  for (let i = 0; i < LOCKED_SLOTS; i++) dinoGrid.append(h('span', { class: 'col-locked' }, [svgEl(dinoSvg('#C9C2B4', 44))]));

  const wrapper = h('div', { class: 'activity' }, [
    h('div', { class: 'topbar' }, [back, h('div', {}, []), h('div', {}, [])]),
    h('div', { class: 'collection' }, [
      head,
      h('div', { class: 'col-section' }, [h('div', { class: 'label' }, ['Trofæer']), trophyGrid]),
      h('div', { class: 'col-section' }, [h('div', { class: 'label' }, ['Dinoer']), dinoGrid]),
    ]),
  ]);

  empty(container);
  container.append(wrapper);
}
