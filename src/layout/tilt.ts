export const tilt = 0.12

export function raise(z: number) {
  return -Math.sin(tilt) * z
}