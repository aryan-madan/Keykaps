export function dish(v: number, depth: number) {
  const n = Math.min(1, Math.abs(v) / 0.6)
  return depth * Math.sqrt(Math.max(0, 1 - n * n))
}