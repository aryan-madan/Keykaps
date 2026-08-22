import { Canvas } from '@react-three/fiber'
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  ContactShadows
} from '@react-three/drei'
import { useBoard } from '../store/board'
import { bound } from '../layout/bound'
import { center } from '../layout/center'
import { tilt } from '../layout/tilt'
import { Key } from './key'
import { Case } from './case'

export function Board() {
  const keys = useBoard((state) => state.keys)
  const envBg = useBoard((state) => state.env)
  const box = keys.length > 0 ? bound(keys) : null
  const mid = box ? center(box) : { x: 0, z: 0 }

  return (
    <Canvas
      shadows
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.0
      }}
    >
      <PerspectiveCamera
        makeDefault
        position={[0, 10, 22]}
        fov={30}
      />

      <Environment
        files="/textures/environment/paul_lobe_haus_4k.exr"
        environmentIntensity={0.8}
        background={envBg}
      />

      <ambientLight intensity={0.1} />

      <directionalLight
        position={[-10, 14, 8]}
        intensity={2.0}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
      />

      <group
        position={[-mid.x, -1.8, -mid.z]}
        castShadow
        receiveShadow
      >
        <group rotation={[tilt, 0, 0]}>
          <Case />
        </group>

        {keys.map((key) => (
          <Key
            key={key.id}
            data={key}
            mid={mid.z}
          />
        ))}
      </group>

      <ContactShadows
        position={[0, -2.0, 0]}
        opacity={0.8}
        scale={25}
        blur={0.7}
        far={6}
        resolution={1024}
      />

      <OrbitControls
        target={[0, -1.8, 0]}
        enableDamping
        dampingFactor={0.05}
        minDistance={6}
        maxDistance={60}
      />
    </Canvas>
  )
}