export function dish(v: number, depth: number) {
  const n = Math.abs(v) / 0.5
  return depth * Math.pow(1 - n * n, 2) * 0.35
}