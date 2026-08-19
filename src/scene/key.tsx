import { useState, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Decal } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useBoard } from '../store/board'
import { place } from '../layout/place'
import { cache } from '../geom/cache'
import { raise } from '../layout/tilt'
import { profile } from '../geom/profile'
import type { Key as Data } from '../store/board'

const gap = 0.08

type Props = {
  data: Data
  mid: number
}

export function Key({ data, mid }: Props) {
  const [ready, setReady] = useState(false)
  const mode = useBoard((state) => state.mode)
  const brush = useBoard((state) => state.brush)
  const paint = useBoard((state) => state.paint)
  const select = useBoard((state) => state.select)
  const ref = useRef<THREE.Group>(null)
  const [down, setDown] = useState(false)

  const { pos, rot } = place(data)
  const geom = cache(data.w - gap, data.h - gap, data.row)
  const y = pos[1] + raise(pos[2] - mid)

  const prof = profile[data.row] ?? profile[0]

  const tw = Math.max(0.1, (data.w - gap) - (1 - prof.taper))
  const td = Math.max(0.1, (data.h - gap) - (1 - prof.taper))

  useEffect(() => {
    const font = new FontFace('Cherry', 'url(/typeface/cherry.otf)')
    font.load().then((loaded) => {
      document.fonts.add(loaded)
      setReady(true)
    }).catch(() => {
      setReady(true)
    })
  }, [])

  useEffect(() => {
    function handle(e: KeyboardEvent, state: boolean) {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return
      const text = data.legend?.toLowerCase() || ''
      const code = e.key.toLowerCase()
      if (text === code || (code === ' ' && text === '')) {
        setDown(state)
      }
    }

    const downFn = (e: KeyboardEvent) => handle(e, true)
    const upFn = (e: KeyboardEvent) => handle(e, false)

    window.addEventListener('keydown', downFn)
    window.addEventListener('keyup', upFn)
    return () => {
      window.removeEventListener('keydown', downFn)
      window.removeEventListener('keyup', upFn)
    }
  }, [data.legend])

  useFrame((_, delta) => {
    if (!ref.current) return
    const targetY = down ? -0.15 : 0
    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, y + targetY, delta * 20)
  })

  const tex = useMemo(() => {
    if (!data.legend || !ready) return null

    const res = 512
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(res * tw)
    canvas.height = Math.round(res * td)

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.fillStyle = data.textColor || brush.swatch.color || '#222222'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'

    let size = Math.round(res * 0.28)
    const pad = Math.round(res * 0.12)
    const limit = canvas.width - pad * 2
    ctx.font = `${size}px Cherry, sans-serif`

    while (ctx.measureText(data.legend).width > limit && size > 20) {
      size -= 4
      ctx.font = `${size}px Cherry, sans-serif`
    }

    ctx.fillText(data.legend, pad, pad)

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [data.legend, data.textColor, tw, td, ready, brush.swatch.color])

  return (
    <group ref={ref} position={[pos[0], y, pos[2]]} rotation={rot}>
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          if (mode === 'edit') {
            paint(data.id, brush.swatch.background, brush.swatch.color)
          } else {
            select(data.id)
          }
        }}
        geometry={geom}
      >
        <meshStandardMaterial color={data.color || '#333333'} />
        {tex && (
          <Decal
            position={[0, prof.height, 0]}
            rotation={[-Math.PI / 2 + prof.tilt, 0, 0]}
            scale={[tw, td, 0.08]}
          >
            <meshBasicMaterial
              map={tex}
              transparent
              polygonOffset
              polygonOffsetFactor={-4}
              polygonOffsetUnits={-4}
            />
          </Decal>
        )}
      </mesh>
    </group>
  )
}