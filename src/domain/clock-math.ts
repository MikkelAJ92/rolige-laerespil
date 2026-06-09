/** Vinkel i grader fra kl. 12, med uret. */
export function minuteHandAngle(minutes: number): number {
  return minutes * 6;
}

export function hourHandAngle(hours: number, minutes: number): number {
  return (hours % 12) * 30 + minutes * 0.5;
}
