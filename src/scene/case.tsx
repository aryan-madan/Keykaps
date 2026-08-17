import { useBoard } from '../store/board'
import { bound } from '../layout/bound'

export function Case() {
  const keys = useBoard((state) => state.keys)
  const shell = useBoard((state) => state.case)
  if (keys.length === 0) return null
  const box = bound(keys)
  const pad = 0.5
  const width = box.maxx - box.minx + pad * 2
  const depth = box.maxy - box.miny + pad * 2
  const x = box.minx + (box.maxx - box.minx) / 2
  const z = box.miny + (box.maxy - box.miny) / 2
  return (
    <mesh position={[x, -0.75, z]}>
      <boxGeometry args={[width, 1, depth]} />
      <meshStandardMaterial color={shell} />
    </mesh>
  )
}