import { useMemo } from 'react'
import * as THREE from 'three'
import { Decal } from '@react-three/drei'
import { useBoard } from '../store/board'
import { place } from '../layout/place'
import { cache } from '../geom/cache'
import { raise } from '../layout/tilt'
import { profile } from '../geom/profile'
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

  const prof = profile[data.row] ?? profile[0]

  const topW = Math.max(0.1, (data.w - gap) - (1 - prof.taper))
  const topD = Math.max(0.1, (data.h - gap) - (1 - prof.taper))

  const texture = useMemo(() => {
    if (!data.legend) return null

    const baseRes = 512
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(baseRes * topW)
    canvas.height = Math.round(baseRes * topD)

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.fillStyle = '#222222'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    let fontSize = 110
    const maxTextWidth = canvas.width * 0.85
    ctx.font = `bold ${fontSize}px sans-serif`

    while (ctx.measureText(data.legend).width > maxTextWidth && fontSize > 20) {
      fontSize -= 4
      ctx.font = `bold ${fontSize}px sans-serif`
    }

    ctx.fillText(data.legend, canvas.width / 2, canvas.height / 2)

    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    return tex
  }, [data.legend, topW, topD])

  return (
    <group position={[pos[0], y, pos[2]]} rotation={rot}>
      <mesh onClick={() => select(data.id)} geometry={geom}>
        <meshStandardMaterial color={data.color || '#333333'} />
        {texture && (
          <Decal
            position={[0, prof.height, 0]}
            rotation={[-Math.PI / 2 + prof.tilt, 0, 0]}
            scale={[topW, topD, 0.5]}
          >
            <meshBasicMaterial
              map={texture}
              transparent
              polygonOffset
              polygonOffsetFactor={-1}
            />
          </Decal>
        )}
      </mesh>
    </group>
  )
}