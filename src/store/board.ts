import { create } from 'zustand'

export type Key = {
  id: string
  x: number
  y: number
  w: number
  h: number
  x2: number
  y2: number
  w2: number
  h2: number
  rx: number
  ry: number
  r: number
  color: string
  legend: string
  row: number
}

type Shape = {
  pad: number
  inset: number
  wall: number
  plate: number
  wallHeight: number
}

type Board = {
  keys: Key[]
  case: string
  shape: Shape
  selected: string | null
  load: (keys: Key[]) => void
  paint: (id: string, color: string) => void
  select: (id: string | null) => void
  shell: (color: string) => void
  reshape: (shape: Partial<Shape>) => void
}

export const useBoard = create<Board>((set) => ({
  keys: [],
  case: '#e6e6e6',
  shape: { pad: 0.3, inset: 0, wall: 0.15, plate: 1.4, wallHeight: 1.0 },
  selected: null,
  load: (keys) => set({ keys }),
  paint: (id, color) => set((state) => ({
    keys: state.keys.map((key) => key.id === id ? { ...key, color } : key)
  })),
  select: (id) => set({ selected: id }),
  shell: (color) => set({ case: color }),
  reshape: (shape) => set((state) => ({ shape: { ...state.shape, ...shape } }))
}))