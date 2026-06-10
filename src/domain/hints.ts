import { hourName, nextHourName, type Time } from './time';

/** Trinvis visestøtte — guider uden at afsløre svaret. */
export function hintForTime(t: Time, step: 1 | 2): string {
  if (step === 1) {
    return t.m === 0
      ? `Den lille viser peger lige på ${hourName(t.h)}.`
      : `Den lille viser er mellem ${hourName(t.h)} og ${nextHourName(t.h)}.`;
  }
  if (t.m === 0) return 'Den store viser peger lige op på tolv.';
  if (t.m === 30) return 'Den store viser peger ned på seks. Det betyder halv.';
  if (t.m === 15) return 'Den store viser peger på tre. Det er kvart over.';
  if (t.m === 45) return 'Den store viser peger på ni. Det er kvart i.';
  return `Den store viser peger på ${hourName(t.m / 5)}.`;
}
