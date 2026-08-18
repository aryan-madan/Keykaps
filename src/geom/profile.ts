export type Profile = {
  height: number
  taper: number
  tilt: number
  dish: number
}

export const profile: Profile[] = [
  { height: 0.42, taper: 0.82, tilt: 0.20, dish: 0.045 },
  { height: 0.36, taper: 0.88, tilt: 0.10, dish: 0.050 },
  { height: 0.31, taper: 0.93, tilt: 0.00, dish: 0.055 },
  { height: 0.34, taper: 0.88, tilt: -0.08, dish: 0.050 },
  { height: 0.40, taper: 0.82, tilt: -0.18, dish: 0.045 }
]