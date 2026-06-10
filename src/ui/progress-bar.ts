// src/ui/progress-bar.ts
import { h, svgEl } from '../core/dom';
import { trophySvg } from './icons';

/** Bar mod næste trofæ. current = rigtige svar på nuværende niveau. */
export function progressBar(current: number, threshold = 5): HTMLElement {
  const done = current % threshold;
  const remaining = threshold - done;
  const pct = (done / threshold) * 100;

  const fill = h('div', { class: 'pbar-fill', style: `width:${pct}%` });
  const bar = h('div', { class: 'pbar' }, [fill]);
  const label = h('span', { class: 'pbar-label' }, [svgEl(trophySvg('#CBA15A', 16)), ` ${remaining} mere`]);
  return h('div', { class: 'pbar-wrap' }, [bar, label]);
}
