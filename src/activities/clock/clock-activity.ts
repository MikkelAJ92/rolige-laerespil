// src/activities/clock/clock-activity.ts
import type { Activity } from '../../core/activity';
import { LEVELS, type ClockLevel } from '../../domain/clock-levels';
import { renderReadMode } from './read-mode';
import { renderSetMode } from './set-mode';
import { trophySvg } from '../../ui/icons';
import { owlSvg } from '../../ui/mascot';
import { progressBar } from '../../ui/progress-bar';
import { showLevelUpCard } from '../../ui/level-up-card';
import { rankName } from '../../domain/ranks';
import { h, svgEl, empty } from '../../core/dom';
import type { AudioService } from '../../services/audio';
import { load, save, recordCorrect, getActivity, overallRank, type ProgressState } from '../../services/progress';

const ACTIVITY = 'clock';
const MAX_LEVEL = 4;

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
  private pendingRedraw?: number;

  constructor(private deps: ClockActivityDeps) {}

  mount(container: HTMLElement): void {
    this.container = container;
    this.render();
  }

  unmount(): void {
    if (this.pendingRedraw !== undefined) {
      window.clearTimeout(this.pendingRedraw);
      this.pendingRedraw = undefined;
    }
    if (this.container) empty(this.container);
    this.container = null;
  }

  private render(): void {
    const c = this.container;
    if (!c) return;
    const act = getActivity(this.state, ACTIVITY);
    const level = act.level as ClockLevel;

    const back = h('button', { class: 'back' }, ['‹ Hjem']);
    back.addEventListener('click', () => this.deps.onExit());
    const trophyCount = h('div', { class: 'trophy-count' }, [svgEl(trophySvg()), ` ${act.trophies.length}`]);
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
    const wrapper = h('div', { class: 'activity' }, [
      topbar,
      h('div', { class: 'progress-row' }, [progressBar(act.correctByLevel[level] ?? 0)]),
      modeSwitch,
      body,
    ]);

    empty(c);
    c.append(wrapper);

    const deps = { audio: this.deps.audio, rng: this.deps.rng, onCorrect: (lvl: ClockLevel) => this.onCorrect(lvl) };
    if (this.mode === 'read') renderReadMode(body, level, deps);
    else renderSetMode(body, level, deps);
  }

  private onCorrect(level: ClockLevel): void {
    const res = recordCorrect(this.state, ACTIVITY, level, MAX_LEVEL);
    this.state = res.state;
    save(this.state);
    if (this.pendingRedraw !== undefined) window.clearTimeout(this.pendingRedraw);

    if (res.leveledUp) {
      const rank = overallRank(this.state);
      const newLevel = getActivity(this.state, ACTIVITY).level;
      this.deps.audio.speak(`Godt klaret! Nu er du på niveau ${newLevel}`);
      this.deps.audio.playCorrect();
      showLevelUpCard({
        level: newLevel,
        rankName: rankName(rank),
        owlMarkup: owlSvg(rank, 96, 'happy'),
        onClose: () => this.render(),
      });
    } else {
      this.pendingRedraw = window.setTimeout(() => {
        this.pendingRedraw = undefined;
        this.render();
      }, 1400);
    }
  }
}
