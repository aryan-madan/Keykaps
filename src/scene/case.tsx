import { useMemo } from 'react'
import { useBoard } from '../store/board'
import { bound } from '../layout/bound'
import { ring } from '../geom/case'
import { shell } from '../geom/shell'

export function Case() {
  const keys = useBoard((state) => state.keys)
  const color = useBoard((state) => state.case)
  const shape = useBoard((state) => state.shape)
  const box = keys.length > 0 ? bound(keys) : null

  const width = box ? box.maxx - box.minx + shape.pad * 2 : 0
  const depth = box ? box.maxy - box.miny + shape.pad * 2 : 0

  const wallgeom = useMemo(() => {
    if (!box) return null
    return ring(box.maxx - box.minx, box.maxy - box.miny, shape.pad, shape.inset, shape.wall)
  }, [box, shape.pad, shape.inset, shape.wall])

  const plategeom = useMemo(() => {
    if (!box) return null
    return shell(width, depth, shape.plate, shape.slant)
  }, [box, width, depth, shape.plate, shape.slant])

  if (!box || !wallgeom || !plategeom) return null

  const x = box.minx + (box.maxx - box.minx) / 2
  const z = box.miny + (box.maxy - box.miny) / 2

  return (
    <group position={[x, 0, z]}>
      <mesh geometry={wallgeom}>
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh geometry={plategeom}>
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}