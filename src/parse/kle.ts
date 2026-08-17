import { Serial } from '@ijprest/kle-serial'
import { row } from './row'
import type { Key } from '../store/board'

export function parse(json: string): Key[] {
  const board = Serial.deserialize(JSON.parse(json))
  return board.keys.map((k: any, i: number) => {
    const labels = (k.labels || [])
      .filter((l: any) => typeof l === 'string' && l.trim() !== '')
      .map((l: string) => l.replace(/\n+/g, ' ').trim())

    return {
      id: String(i),
      x: k.x,
      y: k.y,
      w: k.width,
      h: k.height,
      x2: k.x2,
      y2: k.y2,
      w2: k.width2,
      h2: k.height2,
      rx: k.rotation_x,
      ry: k.rotation_y,
      r: k.rotation_angle,
      color: k.color,
      legend: labels[0] || '',
      row: row(k.y)
    }
  })
}