import { useMemo } from 'react'
import * as THREE from 'three'
import { useBoard } from '../store/board'
import { bound } from '../layout/bound'
import { ring } from '../geom/case'
import { tilt } from '../layout/tilt'

export function Case() {
  const keys = useBoard((state) => state.keys)
  const color = useBoard((state) => state.case)
  const shape = useBoard((state) => state.shape)
  const box = keys.length > 0 ? bound(keys) : null

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

    const height = shape.height
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

    // Small inset to prevent adjacent hole overlap and triangulation corruption
    const inset = 0.03

    keys.forEach((key) => {
      const cosR = Math.cos(key.r || 0)
      const sinR = Math.sin(key.r || 0)

      const rx = key.rx ?? key.x
      const ry = key.ry ?? key.y

      const points = [
        { x: key.x + inset, y: key.y + inset },
        { x: key.x + key.w - inset, y: key.y + inset },
        { x: key.x + key.w - inset, y: key.y + key.h - inset },
        { x: key.x + inset, y: key.y + key.h - inset }
      ]

      const hole = new THREE.Path()
      points.forEach((p, idx) => {
        const dx = p.x - rx
        const dy = p.y - ry
        const rotX = rx + (dx * cosR - dy * sinR) - centerX
        const rotY = ry + (dx * sinR + dy * cosR) - centerZ

        if (idx === 0) hole.moveTo(rotX, rotY)
        else hole.lineTo(rotX, rotY)
      })
      hole.closePath()

      frameShape.holes.push(hole)
    })

    const tf = new THREE.ExtrudeGeometry(frameShape, {
      depth: 0.02,
      bevelEnabled: false,
      steps: 1
    })
    tf.rotateX(Math.PI / 2)
    tf.computeVertexNormals()

    return { wall: wg, bottom: bg, topFrame: tf, topY: topHeight }
  }, [box, shape.pad, shape.inset, shape.wall, shape.height, keys])

  if (!box || !wall) return null

  const x = box.minx + (box.maxx - box.minx) / 2
  const z = box.miny + (box.maxy - box.miny) / 2

  return (
    <group position={[x, -0.15, z]}>
      <mesh geometry={wall}>
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.35} />
      </mesh>
      {bottom && (
        <mesh geometry={bottom}>
          <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.35} />
        </mesh>
      )}
      {topFrame && (
        <mesh geometry={topFrame} position={[0, topY, 0]}>
          <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.35} />
        </mesh>
      )}
    </group>
  )
}