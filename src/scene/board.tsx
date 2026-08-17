import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useBoard } from '../store/board'
import { bound } from '../layout/bound'
import { center } from '../layout/center'
import { tilt } from '../layout/tilt'
import { Key } from './key'
import { Case } from './case'

export function Board() {
  const keys = useBoard((state) => state.keys)
  const box = keys.length > 0 ? bound(keys) : null
  const mid = box ? center(box) : { x: 0, z: 0 }

  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[0, 10, 14]} fov={40} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 10, 5]} intensity={0.7} />
      <directionalLight position={[-6, 2, 8]} intensity={0.35} />
      <group position={[-mid.x, -0.05, -mid.z]}>
        <group rotation={[tilt, 0, 0]}>
          <Case />
        </group>
        {keys.map((key) => (
          <Key key={key.id} data={key} mid={mid.z} />
        ))}
      </group>
      <OrbitControls target={[0, 0, 0]} />
    </Canvas>
  )
}