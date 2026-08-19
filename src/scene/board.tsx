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
  const box = keys.length > 0 ? bound(keys) : null
  const mid = box ? center(box) : { x: 0, z: 0 }
  const depth = box ? box.maxy - box.miny : 5

  return (
    <Canvas
      shadows
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 0.85
      }}
    >
      <PerspectiveCamera
        makeDefault
        position={[0, 8.5, 13]}
        fov={40}
      />

      <Environment
        preset="studio"
        environmentIntensity={0.03}
      />

      <ambientLight intensity={0.02} />

      <directionalLight
        position={[-10, 14, 8]}
        intensity={2.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={35}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
      />

      <directionalLight
        position={[9, 6, -7]}
        intensity={0.4}
        color="#bfe3ff"
      />

      <spotLight
        position={[-6, 10, -6]}
        intensity={0.6}
        angle={0.5}
        penumbra={0.2}
        distance={25}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0001}
      />

      <group
        position={[-mid.x, -0.05, -mid.z]}
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
            depth={depth}
          />
        ))}
      </group>

      <ContactShadows
        position={[0, -0.2, 0]}
        opacity={0.8}
        scale={18}
        blur={0.7}
        far={4}
        resolution={1024}
      />

      <OrbitControls
        target={[0, 0, 0]}
        enableDamping
        dampingFactor={0.05}
        minDistance={6}
        maxDistance={25}
      />
    </Canvas>
  )
}