import { describe, it, expect, beforeEach } from 'vitest';
import { getJSON, setJSON } from '../src/core/storage';

describe('storage', () => {
  beforeEach(() => localStorage.clear());

  it('gemmer og henter JSON', () => {
    setJSON('k', { a: 1 });
    expect(getJSON('k', { a: 0 })).toEqual({ a: 1 });
  });
  it('returnerer fallback når nøglen mangler', () => {
    expect(getJSON('mangler', { x: 9 })).toEqual({ x: 9 });
  });
  it('returnerer fallback ved ugyldig JSON', () => {
    localStorage.setItem('korrupt', '{ikke json');
    expect(getJSON('korrupt', { ok: true })).toEqual({ ok: true });
  });
});
