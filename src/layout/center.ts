import type { Bound } from './bound'

export function center(box: Bound) {
  return {
    x: (box.minx + box.maxx) / 2,
    z: (box.miny + box.maxy) / 2
  }
}