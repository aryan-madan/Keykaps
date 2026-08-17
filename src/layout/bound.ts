import type { Key } from '../store/board'

export type Bound = {
  minx: number
  maxx: number
  miny: number
  maxy: number
}

export function bound(keys: Key[]): Bound {
  let minx = Infinity
  let maxx = -Infinity
  let miny = Infinity
  let maxy = -Infinity
  for (const key of keys) {
    minx = Math.min(minx, key.x)
    maxx = Math.max(maxx, key.x + key.w)
    miny = Math.min(miny, key.y)
    maxy = Math.max(maxy, key.y + key.h)
  }
  return { minx, maxx, miny, maxy }
}