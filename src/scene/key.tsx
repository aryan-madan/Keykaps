import { useBoard } from '../store/board'
import { place } from '../layout/place'
import { cache } from '../geom/cache'
import { raise } from '../layout/tilt'
import type { Key as KeyData } from '../store/board'

const gap = 0.08

type Props = {
  data: KeyData
  mid: number
}

export function Key({ data, mid }: Props) {
  const select = useBoard((state) => state.select)
  const { pos, rot } = place(data)
  const geom = cache(data.w - gap, data.h - gap, data.row)
  const y = pos[1] + raise(pos[2] - mid)
  return (
    <mesh position={[pos[0], y, pos[2]]} rotation={rot} onClick={() => select(data.id)} geometry={geom}>
      <meshStandardMaterial color={data.color || '#333333'} />
    </mesh>
  )
}