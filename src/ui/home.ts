// src/ui/home.ts
import { owlSvg } from './mascot';
import { trophySvg } from './icons';
import { h, svgEl, empty } from '../core/dom';
import { load, totalTrophies, overallRank } from '../services/progress';

export interface HomeDeps {
  onSelect: (activityId: string) => void;
  onParent: () => void;
}

const TILES = [
  { id: 'clock', label: 'Klokken', color: 'var(--clock)' },
  { id: 'letters', label: 'Bogstaver', color: 'var(--letters)' },
  { id: 'numbers', label: 'Tal', color: 'var(--numbers)' },
];

export function renderHome(container: HTMLElement, deps: HomeDeps): void {
  const state = load();
  const rank = overallRank(state);
  const trophies = totalTrophies(state);

  const brand = h('div', { class: 'brand' }, [svgEl(owlSvg(rank, 44)), h('span', {}, ['Mine Lærespil'])]);
  const gear = h('button', { class: 'gear', 'aria-label': 'Forælder' }, ['⚙']);
  const trophyBadge = h('div', { class: 'home-trophies' }, [svgEl(trophySvg()), ` ${trophies}`, gear]);
  const top = h('div', { class: 'home-top' }, [brand, trophyBadge]);

  const tileEls = TILES.map((t) => {
    const tile = h('button', { class: 'tile home-tile', 'data-id': t.id, style: `background:${t.color}` }, [
      h('span', { class: 'tile-label' }, [t.label]),
    ]);
    tile.addEventListener('click', () => deps.onSelect(t.id));
    return tile;
  });
  const tiles = h('div', { class: 'tiles' }, tileEls);

  const samling = h('button', { class: 'collection-link' }, [svgEl(trophySvg('#CBA15A', 20)), ' Min samling']);
  samling.addEventListener('click', () => deps.onSelect('collection'));

  empty(container);
  container.append(h('div', { class: 'home' }, [top, tiles, samling]));

  let timer: number | undefined;
  const start = () => { timer = window.setTimeout(() => deps.onParent(), 600); };
  const cancel = () => { if (timer) window.clearTimeout(timer); };
  gear.addEventListener('pointerdown', start);
  gear.addEventListener('pointerup', cancel);
  gear.addEventListener('pointerleave', cancel);
}
