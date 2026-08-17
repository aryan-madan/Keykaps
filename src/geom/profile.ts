export type Profile = {
  height: number
  taper: number
  tilt: number
  dish: number
}

export const profile: Profile[] = [
  { height: 0.56, taper: 0.72, tilt: 0.22, dish: 0.05 },
  { height: 0.5, taper: 0.78, tilt: 0.14, dish: 0.08 },
  { height: 0.44, taper: 0.84, tilt: 0.06, dish: 0.09 },
  { height: 0.4, taper: 0.86, tilt: -0.04, dish: 0.07 },
  { height: 0.34, taper: 0.9, tilt: 0, dish: 0.04 }
]