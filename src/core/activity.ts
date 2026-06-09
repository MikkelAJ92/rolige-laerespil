export interface Activity {
  readonly id: string;
  mount(container: HTMLElement): void;
  unmount(): void;
}
