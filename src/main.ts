import './styles/tokens.css';
import './styles/base.css';
import { Router } from './core/router';
import { AudioService } from './services/audio';
import { renderHome } from './ui/home';
import { renderParentCorner } from './parent/parent-corner';
import { ClockActivity } from './activities/clock/clock-activity';

const root = document.querySelector<HTMLDivElement>('#app')!;
const router = new Router(root);
const audio = new AudioService();
const rng = () => Math.random();

function goHome(): void {
  router.showView((el) =>
    renderHome(el, {
      onSelect: (id) => {
        if (id === 'clock') {
          router.showActivity(new ClockActivity({ audio, rng, onExit: goHome }));
        }
        // 'letters' og 'numbers' kommer i v2/v3.
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
