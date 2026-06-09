import { describe, it, expect, vi } from 'vitest';
import { h, svgEl, empty } from '../src/core/dom';

describe('h', () => {
  it('sætter klasse, tekst og klik-handler', () => {
    const fn = vi.fn();
    const el = h('button', { class: 'x', onclick: fn }, ['Hej']);
    expect(el.className).toBe('x');
    expect(el.textContent).toBe('Hej');
    el.click();
    expect(fn).toHaveBeenCalled();
  });
  it('sætter attributter som data-*', () => {
    const el = h('div', { 'data-id': 'klokken' });
    expect(el.getAttribute('data-id')).toBe('klokken');
  });
});

describe('svgEl', () => {
  it('parser svg-markup til et svg-element', () => {
    const node = svgEl('<svg><circle/></svg>');
    expect(node.tagName.toLowerCase()).toBe('svg');
  });
});

describe('empty', () => {
  it('fjerner alle børn', () => {
    const d = h('div', {}, ['a', h('span')]);
    empty(d);
    expect(d.childNodes.length).toBe(0);
  });
});
