import type { Key } from '../store/board'

export type Place = {
  pos: [number, number, number]
  rot: [number, number, number]
}

export function place(key: Key): Place {
  const px = key.x + key.w / 2
  const pz = key.y + key.h / 2
  const angle = -key.r * Math.PI / 180
  const dx = px - key.rx
  const dz = pz - key.ry
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const rx = key.rx + dx * cos - dz * sin
  const rz = key.ry + dx * sin + dz * cos
  return {
    pos: [rx, 0, rz],
    rot: [0, angle, 0]
  }
}