// src/activities/words/words-activity.ts
import type { Activity } from '../../core/activity';
import { WORD_LEVELS, type WordLevel } from '../../domain/words';
import { renderSpellMode } from './spell-mode';
import { trophySvg } from '../../ui/icons';
import { h, svgEl, empty } from '../../core/dom';
import type { AudioService } from '../../services/audio';
import { wordsLoad, wordsSave, wordsRecordCorrect, type WordsState } from '../../services/words-progress';

export interface WordsActivityDeps {
  audio: AudioService;
  rng: () => number;
  onExit: () => void;
}

export class WordsActivity implements Activity {
  readonly id = 'words';
  private container: HTMLElement | null = null;
  private state: WordsState = wordsLoad();
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
    const level = this.state.level;

    const back = h('button', { class: 'back' }, ['‹ Hjem']);
    back.addEventListener('click', () => this.deps.onExit());
    const trophyCount = h('div', { class: 'trophy-count' }, [svgEl(trophySvg()), ` ${this.state.trophies.length}`]);
    const topbar = h('div', { class: 'topbar' }, [
      back,
      h('div', { class: 'level-pill' }, [`Niveau ${level} · ${WORD_LEVELS[level].label}`]),
      trophyCount,
    ]);

    const body = h('div', { class: 'activity-body' });
    const wrapper = h('div', { class: 'activity' }, [topbar, body]);

    empty(c);
    c.append(wrapper);

    renderSpellMode(body, level, {
      audio: this.deps.audio,
      rng: this.deps.rng,
      onCorrect: (lvl: WordLevel) => this.onCorrect(lvl),
    });
  }

  private onCorrect(level: WordLevel): void {
    const res = wordsRecordCorrect(this.state, level);
    this.state = res.state;
    wordsSave(this.state);
    if (this.pendingRedraw !== undefined) window.clearTimeout(this.pendingRedraw);
    this.pendingRedraw = window.setTimeout(() => {
      this.pendingRedraw = undefined;
      this.render();
    }, 1600);
  }
}
