import * as THREE from 'three'

export function shell(width: number, depth: number, height: number, slant: number) {
  const tw = width / 2
  const td = depth / 2

  const pos = [
    -tw, 0, -td,
    tw, 0, -td,
    tw, 0, td,
    -tw, 0, td,
    -tw, -height, -td,
    tw, -height, -td,
    tw, -height, td - slant,
    -tw, -height, td - slant
  ]

  const idx = [
    0, 3, 2, 0, 2, 1,
    4, 5, 6, 4, 6, 7,
    0, 1, 5, 0, 5, 4,
    0, 4, 7, 0, 7, 3,
    1, 2, 6, 1, 6, 5,
    3, 7, 6, 3, 6, 2
  ]

  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geom.setIndex(idx)
  geom.computeVertexNormals()
  return geom
}