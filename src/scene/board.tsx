import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useBoard } from '../store/board'
import { bound } from '../layout/bound'
import { center } from '../layout/center'
import { Key } from './key'
import { Case } from './case'

export function Board() {
  const keys = useBoard((state) => state.keys)
  const box = keys.length > 0 ? bound(keys) : null
  const mid = box ? center(box) : { x: 0, z: 0 }
  return (
    <Canvas camera={{ position: [0, 14, 14], fov: 40 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <group position={[-mid.x, 0, -mid.z]}>
        <Case />
        {keys.map((key) => (
          <Key key={key.id} data={key} />
        ))}
      </group>
      <OrbitControls />
    </Canvas>
  )
}