import { useBoard } from '../store/board'
import { place } from '../layout/place'
import type { Key as KeyData } from '../store/board'

type Props = {
  data: KeyData
}

export function Key({ data }: Props) {
  const select = useBoard((state) => state.select)
  const { pos, rot } = place(data)
  return (
    <mesh position={pos} rotation={rot} onClick={() => select(data.id)}>
      <boxGeometry args={[data.w * 0.9, 0.5, data.h * 0.9]} />
      <meshStandardMaterial color={data.color || '#333333'} />
    </mesh>
  )
}