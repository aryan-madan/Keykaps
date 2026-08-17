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

type Board = {
  keys: Key[]
  case: string
  selected: string | null
  load: (keys: Key[]) => void
  paint: (id: string, color: string) => void
  select: (id: string | null) => void
  shell: (color: string) => void
}

export const useBoard = create<Board>((set) => ({
  keys: [],
  case: '#222222',
  selected: null,
  load: (keys) => set({ keys }),
  paint: (id, color) => set((state) => ({
    keys: state.keys.map((key) => key.id === id ? { ...key, color } : key)
  })),
  select: (id) => set({ selected: id }),
  shell: (color) => set({ case: color })
}))