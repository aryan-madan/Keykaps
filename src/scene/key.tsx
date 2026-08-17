import { useBoard } from '../store/board'
import { place } from '../layout/place'
import { cache } from '../geom/cache'
import type { Key as KeyData } from '../store/board'

const gap = 0.08

type Props = {
  data: KeyData
}

export function Key({ data }: Props) {
  const select = useBoard((state) => state.select)
  const { pos, rot } = place(data)
  const geom = cache(data.w - gap, data.h - gap, data.row)
  return (
    <mesh position={pos} rotation={rot} onClick={() => select(data.id)} geometry={geom}>
      <meshStandardMaterial color={data.color || '#333333'} />
    </mesh>
  )
}