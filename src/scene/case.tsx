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

  const { wallgeom, bottomGeom } = useMemo(() => {
    if (!box) return { wallgeom: null, bottomGeom: null }

    const width = box.maxx - box.minx + shape.pad * 2
    const depth = box.maxy - box.miny + shape.pad * 2

    const baseGeom = ring(box.maxx - box.minx, box.maxy - box.miny, shape.pad, shape.inset, shape.wall)
    if (!baseGeom) return { wallgeom: null, bottomGeom: null }

    const wg = baseGeom.clone()
    const pos = wg.attributes.position

    let minY = Infinity
    let maxY = -Infinity
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i)
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }

    const height = shape.wallHeight
    const cosTilt = Math.cos(tilt)
    const tanTilt = Math.tan(tilt)
    const topShift = 0.52

    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i)
      const vz = pos.getZ(i)
      const factor = (maxY - y) / (maxY - minY || 1)
      const targetBottomY = -height / cosTilt + vz * tanTilt
      const newY = (maxY + topShift) - factor * ((maxY + topShift) - targetBottomY)
      pos.setY(i, newY)
    }
    wg.computeVertexNormals()

    const bg = new THREE.PlaneGeometry(width, depth, 1, 1)
    bg.rotateX(-Math.PI / 2)
    const bgPos = bg.attributes.position
    for (let i = 0; i < bgPos.count; i++) {
      const vz = bgPos.getZ(i)
      const targetBottomY = -height / cosTilt + vz * tanTilt
      bgPos.setY(i, targetBottomY)
    }
    bg.computeVertexNormals()

    return { wallgeom: wg, bottomGeom: bg }
  }, [box, shape.pad, shape.inset, shape.wall, shape.wallHeight])

  if (!box || !wallgeom) return null

  const x = box.minx + (box.maxx - box.minx) / 2
  const z = box.miny + (box.maxy - box.miny) / 2

  return (
    <group position={[x, -0.1, z]}>
      <mesh geometry={wallgeom}>
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      {bottomGeom && (
        <mesh geometry={bottomGeom}>
          <meshStandardMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}