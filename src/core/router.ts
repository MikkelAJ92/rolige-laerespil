import type { Activity } from './activity';
import { empty } from './dom';

export class Router {
  private current: Activity | null = null;

  constructor(private root: HTMLElement) {}

  showActivity(activity: Activity): void {
    this.reset();
    this.current = activity;
    activity.mount(this.root);
  }

  showView(render: (root: HTMLElement) => void): void {
    this.reset();
    render(this.root);
  }

  private reset(): void {
    if (this.current) { this.current.unmount(); this.current = null; }
    empty(this.root);
  }
}
