import { describe, it, expect } from 'vitest';
import { owlSvg } from '../src/ui/mascot';

describe('owlSvg', () => {
  it('returnerer et svg-element', () => {
    expect(owlSvg(1)).toContain('<svg');
  });
  it('har ingen krone på rang 1', () => {
    expect(owlSvg(1)).not.toContain('data-part="crown"');
  });
  it('får en krone fra rang 2', () => {
    expect(owlSvg(2)).toContain('data-part="crown"');
  });
  it('markerer udtrykket (calm vs happy)', () => {
    expect(owlSvg(1, 64, 'calm')).toContain('data-eyes="calm"');
    expect(owlSvg(1, 64, 'happy')).toContain('data-eyes="happy"');
  });
});
