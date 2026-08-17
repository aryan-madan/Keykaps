import { useBoard } from '../store/board'
import { place } from '../layout/place'
import type { Key as KeyData } from '../store/board'

const gap = 0.08

type Props = {
  data: KeyData
}

export function Key({ data }: Props) {
  const select = useBoard((state) => state.select)
  const { pos, rot } = place(data)
  return (
    <mesh position={pos} rotation={rot} onClick={() => select(data.id)}>
      <boxGeometry args={[data.w - gap, 0.5, data.h - gap]} />
      <meshStandardMaterial color={data.color || '#333333'} />
    </mesh>
  )
}