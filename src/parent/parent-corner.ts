import { LEVELS, type ClockLevel } from '../domain/clock-levels';
import { h, empty } from '../core/dom';
import type { AudioService } from '../services/audio';
import { load, save, getActivity } from '../services/progress';

export interface ParentDeps {
  audio: AudioService;
  onClose: () => void;
}

export function renderParentCorner(container: HTMLElement, deps: ParentDeps): void {
  const state = load();
  const clockAct = getActivity(state, 'clock');

  const sound = h('input', { type: 'checkbox' }) as HTMLInputElement;
  sound.checked = !deps.audio.isMuted();
  sound.addEventListener('change', () => deps.audio.setMuted(!sound.checked));
  const soundRow = h('label', { class: 'row' }, [h('span', {}, ['Lyd']), sound]);

  const select = h('select') as HTMLSelectElement;
  ([1, 2, 3, 4] as ClockLevel[]).forEach((l) => {
    const opt = h('option', { value: String(l) }, [`${l} · ${LEVELS[l].label}`]) as HTMLOptionElement;
    if (clockAct.level === l) opt.selected = true;
    select.append(opt);
  });
  select.addEventListener('change', () => {
    const current = load();
    const newLevel = Number(select.value) as ClockLevel;
    const updated = {
      ...current,
      activities: {
        ...current.activities,
        clock: { ...getActivity(current, 'clock'), level: newLevel },
      },
    };
    save(updated);
  });
  const levelRow = h('div', { class: 'row' }, [h('span', {}, ['Niveau (klokken)']), select]);

  const reset = h('button', { class: 'reset' }, ['Nulstil fremgang']);
  reset.addEventListener('click', () => { save({ activities: {} }); deps.onClose(); });
  const close = h('button', { class: 'close' }, ['Luk']);
  close.addEventListener('click', () => deps.onClose());

  const card = h('div', { class: 'parent-card' }, [h('h2', {}, ['Forælder']), soundRow, levelRow, reset, close]);

  empty(container);
  container.append(h('div', { class: 'parent-overlay' }, [card]));
}
