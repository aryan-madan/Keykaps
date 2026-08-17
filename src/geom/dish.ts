export function dish(v: number, depth: number) {
  const n = v / 0.5
  return depth * (1 - n * n)
}