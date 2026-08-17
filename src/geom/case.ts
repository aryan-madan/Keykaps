import * as THREE from 'three'

export function ring(width: number, depth: number, pad: number, inset: number, height: number) {
  const outerW = width + pad * 2
  const outerD = depth + pad * 2
  const innerW = width + inset * 2
  const innerD = depth + inset * 2

  const shape = new THREE.Shape()
  shape.moveTo(-outerW / 2, -outerD / 2)
  shape.lineTo(outerW / 2, -outerD / 2)
  shape.lineTo(outerW / 2, outerD / 2)
  shape.lineTo(-outerW / 2, outerD / 2)
  shape.lineTo(-outerW / 2, -outerD / 2)

  const hole = new THREE.Path()
  hole.moveTo(-innerW / 2, -innerD / 2)
  hole.lineTo(-innerW / 2, innerD / 2)
  hole.lineTo(innerW / 2, innerD / 2)
  hole.lineTo(innerW / 2, -innerD / 2)
  hole.lineTo(-innerW / 2, -innerD / 2)
  shape.holes.push(hole)

  const geom = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false })
  geom.rotateX(-Math.PI / 2)
  return geom
}