import { describe, it, expect } from 'vitest';
import { uid } from '../src/ui/uid';

describe('uid', () => {
  it('giver forskellige id-er ved hvert kald', () => {
    expect(uid('a')).not.toBe(uid('a'));
  });
  it('bruger prefikset', () => {
    expect(uid('owl').startsWith('owl-')).toBe(true);
  });
});
