import * as THREE from 'three'
import { profile } from './profile'
import { dish } from './dish'

const grid = 6

export function frustum(width: number, depth: number, row: number) {
  const p = profile[row] ?? profile[2]
  const pos: number[] = []
  const idx: number[] = []
  const top: number[][] = []

  for (let iz = 0; iz <= grid; iz++) {
    const line: number[] = []
    for (let ix = 0; ix <= grid; ix++) {
      const u = ix / grid - 0.5
      const v = iz / grid - 0.5
      const x = u * width * p.taper
      const z = v * depth * p.taper + p.height * p.tilt
      const y = p.height - dish(v, p.dish)
      line.push(pos.length / 3)
      pos.push(x, y, z)
    }
    top.push(line)
  }

  for (let iz = 0; iz < grid; iz++) {
    for (let ix = 0; ix < grid; ix++) {
      const a = top[iz][ix]
      const b = top[iz][ix + 1]
      const c = top[iz + 1][ix]
      const d = top[iz + 1][ix + 1]
      idx.push(a, c, b, b, c, d)
    }
  }

  const baseFL = pos.length / 3
  pos.push(-width / 2, 0, -depth / 2)
  const baseFR = pos.length / 3
  pos.push(width / 2, 0, -depth / 2)
  const baseBL = pos.length / 3
  pos.push(-width / 2, 0, depth / 2)
  const baseBR = pos.length / 3
  pos.push(width / 2, 0, depth / 2)

  idx.push(baseFL, baseBL, baseFR, baseFR, baseBL, baseBR)

  function wall(edge: number[], baseA: number, baseB: number, flip: boolean) {
    for (let i = 0; i < edge.length - 1; i++) {
      const a = edge[i]
      const b = edge[i + 1]
      const t0 = i / grid
      const t1 = (i + 1) / grid
      const pa = pos.slice(baseA * 3, baseA * 3 + 3)
      const pb = pos.slice(baseB * 3, baseB * 3 + 3)
      const la = [pa[0] + (pb[0] - pa[0]) * t0, 0, pa[2] + (pb[2] - pa[2]) * t0]
      const lb = [pa[0] + (pb[0] - pa[0]) * t1, 0, pa[2] + (pb[2] - pa[2]) * t1]
      const ia = pos.length / 3
      pos.push(...la)
      const ib = pos.length / 3
      pos.push(...lb)
      if (flip) {
        idx.push(a, ia, b, b, ia, ib)
      } else {
        idx.push(a, b, ia, b, ib, ia)
      }
    }
  }

  wall(top[0], baseFL, baseFR, false)
  wall(top[grid], baseBL, baseBR, true)
  wall(top.map((line) => line[0]), baseFL, baseBL, true)
  wall(top.map((line) => line[grid]), baseFR, baseBR, false)

  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geom.setIndex(idx)
  geom.computeVertexNormals()
  return geom
}