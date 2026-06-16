import { describe, it, expect } from 'vitest';
import { SCENES, pickScene } from '../src/domain/scenes';

describe('SCENES', () => {
  it('har mindst én scene, alle felter udfyldt', () => {
    expect(SCENES.length).toBeGreaterThan(0);
    for (const s of SCENES) {
      expect(s.id).toBeTruthy();
      expect(s.locked).toBeTruthy();
      expect(s.opened).toBeTruthy();
      expect(s.title).toBeTruthy();
      expect(s.bg).toHaveLength(2);
      expect(s.accent).toBeTruthy();
    }
  });
  it('har unikke id-er', () => {
    expect(new Set(SCENES.map((s) => s.id)).size).toBe(SCENES.length);
  });
});

describe('pickScene', () => {
  it('er deterministisk for en given rng', () => {
    expect(pickScene(() => 0)).toBe(SCENES[0]);
  });
  it('returnerer aldrig den undgåede scene', () => {
    for (const s of SCENES) {
      for (const r of [0, 0.25, 0.5, 0.75, 0.99]) {
        expect(pickScene(() => r, s.id).id).not.toBe(s.id);
      }
    }
  });
});
