export type Profile = {
  height: number
  taper: number
  tilt: number
  dish: number
  rotation: number
}

export const profile: Profile[] = [
  { height: 0.48, taper: 0.82, tilt: -0.10, dish: 0.045, rotation: 0.12 },
  { height: 0.41, taper: 0.88, tilt: -0.08, dish: 0.050, rotation: 0.08 },
  { height: 0.37, taper: 0.93, tilt: -0.06, dish: 0.055, rotation: 0 },
  { height: 0.40, taper: 0.88, tilt: -0.08, dish: 0.050, rotation: -0.01 },
  { height: 0.46, taper: 0.82, tilt: -0.16, dish: 0.045, rotation: -0.01 }
]