/** Round axis ticks for 0..max: 0 and two to four more at a clean step. */
export function ticks(max: number): number[] {
  if (max <= 0) return [0];
  const rough = max / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((candidate) => candidate >= rough) ?? rough;
  return [0, step, step * 2, step * 3, step * 4].filter((value) => value <= max * 1.001);
}
