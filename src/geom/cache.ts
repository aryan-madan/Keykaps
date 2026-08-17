import type { BufferGeometry } from 'three'
import { frustum } from './frustum'

const store = new Map<string, BufferGeometry>()

export function cache(width: number, depth: number, row: number) {
  const key = `${width}:${depth}:${row}`
  const hit = store.get(key)
  if (hit) return hit
  const geom = frustum(width, depth, row)
  store.set(key, geom)
  return geom
}