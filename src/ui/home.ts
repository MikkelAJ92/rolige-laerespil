import { owlSvg } from './mascot';
import { trophySvg } from './icons';
import { h, svgEl, empty } from '../core/dom';
import { load, owlRank } from '../services/progress';

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

  const brand = h('div', { class: 'brand' }, [svgEl(owlSvg(owlRank(state), 44)), h('span', {}, ['Mine Lærespil'])]);
  const gear = h('button', { class: 'gear', 'aria-label': 'Forælder' }, ['⚙']);
  const trophies = h('div', { class: 'home-trophies' }, [svgEl(trophySvg()), ` ${state.trophies.length}`, gear]);
  const top = h('div', { class: 'home-top' }, [brand, trophies]);

  const tileEls = TILES.map((t) => {
    const tile = h('button', { class: 'tile home-tile', 'data-id': t.id, style: `background:${t.color}` }, [
      h('span', { class: 'tile-label' }, [t.label]),
    ]);
    tile.addEventListener('click', () => deps.onSelect(t.id));
    return tile;
  });
  const tiles = h('div', { class: 'tiles' }, tileEls);

  empty(container);
  container.append(h('div', { class: 'home' }, [top, tiles]));

  // Forælder-hjørne åbnes med tryk-og-hold (600 ms) for at undgå utilsigtede tryk.
  let timer: number | undefined;
  const start = () => { timer = window.setTimeout(() => deps.onParent(), 600); };
  const cancel = () => { if (timer) window.clearTimeout(timer); };
  gear.addEventListener('pointerdown', start);
  gear.addEventListener('pointerup', cancel);
  gear.addEventListener('pointerleave', cancel);
}
