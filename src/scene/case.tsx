import { useMemo } from 'react'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'
import { useBoard } from '../store/board'
import { bound } from '../layout/bound'
import { ring } from '../geom/case'
import { tilt } from '../layout/tilt'

export function Case() {
  const keys = useBoard((state) => state.keys)
  const color = useBoard((state) => state.case)
  const shape = useBoard((state) => state.shape)
  const box = keys.length > 0 ? bound(keys) : null

  const [normalMap, roughnessMap, metalnessMap, aoMap] = useTexture([
    '/textures/metal/brushed-metal_normal-ogl.png',
    '/textures/metal/brushed-metal_roughness.png',
    '/textures/metal/brushed-metal_metallic.png',
    '/textures/metal/brushed-metal_ao.png',
  ])

  ;[normalMap, roughnessMap, metalnessMap, aoMap].forEach((tex) => {
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(2, 2)
  })

  const { wall, bottom, topFrame, topY } = useMemo(() => {
    if (!box || keys.length === 0) return { wall: null, bottom: null, topFrame: null, topY: 0 }

    const width = box.maxx - box.minx + shape.pad * 2
    const depth = box.maxy - box.miny + shape.pad * 2

    const base = ring(box.maxx - box.minx, box.maxy - box.miny, shape.pad, shape.inset, shape.wall)
    if (!base) return { wall: null, bottom: null, topFrame: null, topY: 0 }

    const wg = base.clone()
    const pos = wg.attributes.position

    let min = Infinity
    let max = -Infinity
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i)
      if (y < min) min = y
      if (y > max) max = y
    }

    const height = shape.height * 0.6
    const ct = Math.cos(tilt)
    const tt = Math.tan(tilt)
    const shift = 0.52
    const topHeight = max + shift

    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i)
      const vz = pos.getZ(i)
      const factor = (max - y) / (max - min || 1)
      const target = -height / ct + vz * tt
      const ny = topHeight - factor * (topHeight - target)
      pos.setY(i, ny)
    }
    wg.computeVertexNormals()

    const bg = new THREE.PlaneGeometry(width, depth, 1, 1)
    bg.rotateX(-Math.PI / 2)
    const bp = bg.attributes.position
    for (let i = 0; i < bp.count; i++) {
      const vz = bp.getZ(i)
      const target = -height / ct + vz * tt
      bp.setY(i, target)
    }
    bg.computeVertexNormals()

    const left = -width / 2 + shape.wall
    const right = width / 2 - shape.wall
    const top = -depth / 2 + shape.wall
    const bot = depth / 2 - shape.wall

    const frameShape = new THREE.Shape()
    frameShape.moveTo(left, top)
    frameShape.lineTo(left, bot)
    frameShape.lineTo(right, bot)
    frameShape.lineTo(right, top)
    frameShape.closePath()

    const centerX = box.minx + (box.maxx - box.minx) / 2
    const centerZ = box.miny + (box.maxy - box.miny) / 2

    const minGapThreshold = 0.25
    const visited = new Set<number>()
    const clusters: (typeof keys)[] = []

    for (let i = 0; i < keys.length; i++) {
      if (visited.has(i)) continue
      const cluster = [keys[i]]
      visited.add(i)
      const queue = [keys[i]]

      while (queue.length > 0) {
        const curr = queue.shift()!
        for (let j = 0; j < keys.length; j++) {
          if (visited.has(j)) continue
          const k2 = keys[j]

          const dx = Math.max(0, Math.max(curr.x, k2.x) - Math.min(curr.x + curr.w, k2.x + k2.w))
          const dy = Math.max(0, Math.max(curr.y, k2.y) - Math.min(curr.y + curr.h, k2.y + k2.h))

          if (dx < minGapThreshold && dy < minGapThreshold) {
            visited.add(j)
            cluster.push(k2)
            queue.push(k2)
          }
        }
      }
      clusters.push(cluster)
    }

    clusters.forEach((cluster) => {
      const xSet = new Set<number>()
      const ySet = new Set<number>()

      cluster.forEach((k) => {
        xSet.add(Number(k.x.toFixed(4)))
        xSet.add(Number((k.x + k.w).toFixed(4)))
        ySet.add(Number(k.y.toFixed(4)))
        ySet.add(Number((k.y + k.h).toFixed(4)))
      })

      const xs = Array.from(xSet).sort((a, b) => a - b)
      const ys = Array.from(ySet).sort((a, b) => a - b)

      const ncols = xs.length - 1
      const nrows = ys.length - 1
      const filled: boolean[][] = Array.from({ length: nrows }, () => Array(ncols).fill(false))

      for (let r = 0; r < nrows; r++) {
        for (let c = 0; c < ncols; c++) {
          const cx = (xs[c] + xs[c + 1]) / 2
          const cy = (ys[r] + ys[r + 1]) / 2
          filled[r][c] = cluster.some(
            (k) => cx >= k.x && cx <= k.x + k.w && cy >= k.y && cy <= k.y + k.h
          )
        }
      }

      type Point = [number, number]
      type Edge = { p1: Point; p2: Point; used?: boolean }
      const edges: Edge[] = []

      for (let r = 0; r < nrows; r++) {
        for (let c = 0; c < ncols; c++) {
          if (!filled[r][c]) continue

          if (r === 0 || !filled[r - 1][c]) {
            edges.push({ p1: [xs[c], ys[r]], p2: [xs[c + 1], ys[r]] })
          }
          if (c === ncols - 1 || !filled[r][c + 1]) {
            edges.push({ p1: [xs[c + 1], ys[r]], p2: [xs[c + 1], ys[r + 1]] })
          }
          if (r === nrows - 1 || !filled[r + 1][c]) {
            edges.push({ p1: [xs[c + 1], ys[r + 1]], p2: [xs[c], ys[r + 1]] })
          }
          if (c === 0 || !filled[r][c - 1]) {
            edges.push({ p1: [xs[c], ys[r + 1]], p2: [xs[c], ys[r]] })
          }
        }
      }

      if (edges.length === 0) return

      const startEdge = edges[0]
      startEdge.used = true

      const pathPoints: Point[] = [startEdge.p1, startEdge.p2]
      let current = startEdge.p2

      while (true) {
        const nextEdge = edges.find(
          (e) =>
            !e.used &&
            Math.abs(e.p1[0] - current[0]) < 1e-4 &&
            Math.abs(e.p1[1] - current[1]) < 1e-4
        )

        if (!nextEdge) break
        nextEdge.used = true
        pathPoints.pathPoints?.push?.(nextEdge.p2) || pathPoints.push(nextEdge.p2)
        current = nextEdge.p2

        if (
          Math.abs(current[0] - pathPoints[0][0]) < 1e-4 &&
          Math.abs(current[1] - pathPoints[0][1]) < 1e-4
        ) {
          break
        }
      }

      const hole = new THREE.Path()
      pathPoints.forEach(([px, py], idx) => {
        const hx = px - centerX
        const hy = py - centerZ
        if (idx === 0) hole.moveTo(hx, hy)
        else hole.lineTo(hx, hy)
      })
      hole.closePath()

      frameShape.holes.push(hole)
    })

    const tf = new THREE.ExtrudeGeometry(frameShape, {
      depth: 0.01,
      bevelEnabled: false,
      steps: 1
    })
    tf.rotateX(Math.PI / 2)
    tf.computeVertexNormals()

    return { wall: wg, bottom: bg, topFrame: tf, topY: topHeight + 0.001 }
  }, [box, shape.pad, shape.inset, shape.wall, shape.height, keys])

  if (!box || !wall) return null

  const x = box.minx + (box.maxx - box.minx) / 2
  const z = box.miny + (box.maxy - box.miny) / 2

  const matProps = {
    color: (!color || color === '#000000') ? '#ffffff' : color,
    normalMap,
    roughnessMap,
    metalnessMap,
    aoMap,
    side: THREE.DoubleSide,
    metalness: 0.9,
    roughness: 0.5,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1
  }

  return (
    <group position={[x, -0.15, z]}>
      <mesh geometry={wall} castShadow receiveShadow>
        <meshStandardMaterial {...matProps} />
      </mesh>
      {bottom && (
        <mesh geometry={bottom} castShadow receiveShadow>
          <meshStandardMaterial {...matProps} />
        </mesh>
      )}
      {topFrame && (
        <mesh geometry={topFrame} position={[0, topY, 0]} castShadow receiveShadow>
          <meshStandardMaterial {...matProps} />
        </mesh>
      )}
    </group>
  )
}