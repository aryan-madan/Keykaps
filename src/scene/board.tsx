import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useBoard } from '../store/board'
import { Key } from './key'
import { Case } from './case'

export function Board() {
  const keys = useBoard((state) => state.keys)
  return (
    <Canvas camera={{ position: [0, 12, 12], fov: 40 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <Case />
      {keys.map((key) => (
        <Key key={key.id} data={key} />
      ))}
      <OrbitControls />
    </Canvas>
  )
}