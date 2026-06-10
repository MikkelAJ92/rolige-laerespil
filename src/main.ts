// src/main.ts
import './styles/tokens.css';
import './styles/base.css';
import { Router } from './core/router';
import { AudioService } from './services/audio';
import { renderHome } from './ui/home';
import { renderCollection } from './ui/collection';
import { renderParentCorner } from './parent/parent-corner';
import { ClockActivity } from './activities/clock/clock-activity';
import { WordsActivity } from './activities/words/words-activity';

const root = document.querySelector<HTMLDivElement>('#app')!;
const router = new Router(root);
const audio = new AudioService();
const rng = () => Math.random();

function goHome(): void {
  router.showView((el) =>
    renderHome(el, {
      onSelect: (id) => {
        if (id === 'clock') router.showActivity(new ClockActivity({ audio, rng, onExit: goHome }));
        else if (id === 'letters') router.showActivity(new WordsActivity({ audio, rng, onExit: goHome }));
        else if (id === 'collection') router.showView((el2) => renderCollection(el2, { onBack: goHome }));
        // 'numbers' kommer i v3.
      },
      onParent: openParent,
    }),
  );
}

function openParent(): void {
  const layer = document.createElement('div');
  document.body.append(layer);
  renderParentCorner(layer, {
    audio,
    onClose: () => { layer.remove(); goHome(); },
  });
}

goHome();
