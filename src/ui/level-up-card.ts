// src/ui/level-up-card.ts
import { h, svgEl } from '../core/dom';
import { trophySvg } from './icons';

export interface LevelUpOpts {
  level: number;
  rankName: string;
  owlMarkup: string;
  dinoMarkup?: string;
  onClose: () => void;
}

/** Viser et roligt fejrings-kort som overlay. "Videre" lukker det. */
export function showLevelUpCard(opts: LevelUpOpts): HTMLElement {
  const next = h('button', { class: 'levelup-next' }, ['Videre']);

  const rewards: HTMLElement[] = [];
  if (opts.dinoMarkup) {
    rewards.push(h('div', { class: 'levelup-reward' }, [svgEl(opts.dinoMarkup), h('div', { class: 'levelup-reward-label' }, ['Ny dino!'])]));
  }
  rewards.push(h('div', { class: 'levelup-reward' }, [svgEl(trophySvg('#CBA15A', 34)), h('div', { class: 'levelup-reward-label' }, ['Trofæ!'])]));

  const card = h('div', { class: 'levelup-card' }, [
    svgEl(opts.owlMarkup),
    h('div', { class: 'levelup-title' }, [`Niveau ${opts.level}!`]),
    h('div', { class: 'levelup-rank' }, [opts.rankName]),
    h('div', { class: 'levelup-rewards' }, rewards),
    next,
  ]);

  const overlay = h('div', { class: 'levelup-overlay' }, [card]);
  next.addEventListener('click', () => {
    overlay.remove();
    opts.onClose();
  });
  document.body.append(overlay);
  return overlay;
}
