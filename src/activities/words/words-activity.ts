// src/activities/words/words-activity.ts
import type { Activity } from '../../core/activity';
import { WORD_LEVELS, type WordLevel } from '../../domain/words';
import { renderSpellMode } from './spell-mode';
import { trophySvg } from '../../ui/icons';
import { owlSvg } from '../../ui/mascot';
import { progressBar } from '../../ui/progress-bar';
import { showLevelUpCard } from '../../ui/level-up-card';
import { rankName } from '../../domain/ranks';
import { h, svgEl, empty } from '../../core/dom';
import type { AudioService } from '../../services/audio';
import { load, save, recordCorrect, getActivity, overallRank, type ProgressState } from '../../services/progress';

const ACTIVITY = 'words';
const MAX_LEVEL = 3;

export interface WordsActivityDeps {
  audio: AudioService;
  rng: () => number;
  onExit: () => void;
}

export class WordsActivity implements Activity {
  readonly id = 'words';
  private container: HTMLElement | null = null;
  private state: ProgressState = load();
  private pendingRedraw?: number;

  constructor(private deps: WordsActivityDeps) {}

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
    const level = act.level as WordLevel;

    const back = h('button', { class: 'back' }, ['‹ Hjem']);
    back.addEventListener('click', () => this.deps.onExit());
    const trophyCount = h('div', { class: 'trophy-count' }, [svgEl(trophySvg()), ` ${act.trophies.length}`]);
    const topbar = h('div', { class: 'topbar' }, [
      back,
      h('div', { class: 'level-pill' }, [`Niveau ${level} · ${WORD_LEVELS[level].label}`]),
      trophyCount,
    ]);

    const body = h('div', { class: 'activity-body' });
    const wrapper = h('div', { class: 'activity' }, [
      topbar,
      h('div', { class: 'progress-row' }, [progressBar(act.correctByLevel[level] ?? 0)]),
      body,
    ]);

    empty(c);
    c.append(wrapper);

    renderSpellMode(body, level, {
      audio: this.deps.audio,
      rng: this.deps.rng,
      onCorrect: (lvl: WordLevel) => this.onCorrect(lvl),
    });
  }

  private onCorrect(level: WordLevel): void {
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
      }, 1600);
    }
  }
}
