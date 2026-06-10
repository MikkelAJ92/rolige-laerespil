// tests/pictures.test.ts
import { describe, it, expect } from 'vitest';
import { WORDS } from '../src/domain/words';
import { pictureSvg } from '../src/ui/pictures';

describe('pictureSvg', () => {
  it('returnerer et svg for hvert ord i ordlisten', () => {
    for (const w of WORDS) {
      expect(pictureSvg(w.picture)).toContain('<svg');
    }
  });
});
