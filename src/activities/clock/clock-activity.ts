import type { Activity } from '../../core/activity';
import { LEVELS, type ClockLevel } from '../../domain/clock-levels';
import { renderReadMode } from './read-mode';
import { renderSetMode } from './set-mode';
import { trophySvg } from '../../ui/icons';
import { h, svgEl, empty } from '../../core/dom';
import type { AudioService } from '../../services/audio';
import { load, save, recordCorrect, type ProgressState } from '../../services/progress';

export interface ClockActivityDeps {
  audio: AudioService;
  rng: () => number;
  onExit: () => void;
}

type Mode = 'read' | 'set';

export class ClockActivity implements Activity {
  readonly id = 'clock';
  private container: HTMLElement | null = null;
  private state: ProgressState = load();
  private mode: Mode = 'read';

  constructor(private deps: ClockActivityDeps) {}

  mount(container: HTMLElement): void {
    this.container = container;
    this.render();
  }

  unmount(): void {
    if (this.container) empty(this.container);
    this.container = null;
  }

  private render(): void {
    const c = this.container;
    if (!c) return;
    const level = this.state.level;

    const back = h('button', { class: 'back' }, ['‹ Hjem']);
    back.addEventListener('click', () => this.deps.onExit());
    const trophyCount = h('div', { class: 'trophy-count' }, [svgEl(trophySvg()), ` ${this.state.trophies.length}`]);
    const topbar = h('div', { class: 'topbar' }, [
      back,
      h('div', { class: 'level-pill' }, [`Niveau ${level} · ${LEVELS[level].label}`]),
      trophyCount,
    ]);

    const readBtn = h('button', { class: this.mode === 'read' ? 'on' : '' }, ['Se klokken']);
    readBtn.addEventListener('click', () => { this.mode = 'read'; this.render(); });
    const setBtn = h('button', { class: this.mode === 'set' ? 'on' : '' }, ['Stil klokken']);
    setBtn.addEventListener('click', () => { this.mode = 'set'; this.render(); });
    const modeSwitch = h('div', { class: 'mode-switch' }, [readBtn, setBtn]);

    const body = h('div', { class: 'activity-body' });
    const wrapper = h('div', { class: 'activity' }, [topbar, modeSwitch, body]);

    empty(c);
    c.append(wrapper);

    const deps = { audio: this.deps.audio, rng: this.deps.rng, onCorrect: (lvl: ClockLevel) => this.onCorrect(lvl) };
    if (this.mode === 'read') renderReadMode(body, level, deps);
    else renderSetMode(body, level, deps);
  }

  private onCorrect(level: ClockLevel): void {
    const res = recordCorrect(this.state, level);
    this.state = res.state;
    save(this.state);
    // Rolig opdatering: gentegn efter et kort øjeblik, så barnet ser sit rigtige svar først.
    window.setTimeout(() => this.render(), 1400);
  }
}
