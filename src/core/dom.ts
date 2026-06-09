type Child = Node | string;
type Props = Record<string, unknown>;

/** Opretter et element, sætter class/attributter/handlers og tilføjer børn. */
export function h(tag: string, props: Props = {}, children: Child[] = []): HTMLElement {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null) continue;
    if (k === 'class') el.className = String(v);
    else if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    } else {
      el.setAttribute(k, String(v));
    }
  }
  for (const c of children) el.append(typeof c === 'string' ? document.createTextNode(c) : c);
  return el;
}

/** Parser BETROET SVG-markup (aldrig brugerinput) til et DOM-element. */
export function svgEl(markup: string): Element {
  const doc = new DOMParser().parseFromString(`<body>${markup}</body>`, 'text/html');
  return document.importNode(doc.body.firstElementChild as Element, true);
}

/** Tømmer et element for børn. */
export function empty(el: Element): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}
