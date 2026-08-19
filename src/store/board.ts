import { useEffect } from 'react'
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
  textColor: string
  legend: string
  row: number
}

type Shape = {
  pad: number
  inset: number
  wall: number
  height: number
}

export type Saved = {
  id: string
  name: string
  keys: Key[]
  case: string
  shape: Shape
}

export type Swatch = {
  background: string
  color: string
}

export type Scheme = {
  id: string
  label: string
  manufacturer: string
  swatches: Record<string, Swatch>
  override?: Record<string, string>
}

type BoardState = {
  keys: Key[]
  case: string
  shape: Shape
  selected: string | null
  mode: string
  brush: { name: string; swatch: Swatch }
  boards: Saved[]
  active: string | null
  schemes: Scheme[]
  scheme: string | null
  background: string
  load: (keys: Key[]) => void
  paint: (id: string, color: string, textColor: string) => void
  select: (id: string | null) => void
  paintLegend: (id: string, legend: string) => void
  shell: (color: string) => void
  reshape: (shape: Partial<Shape>) => void
  modeSet: (mode: string) => void
  brushSet: (brush: { name: string; swatch: Swatch }) => void
  save: (name: string, keys: Key[], kase: string, shape: Shape) => void
  loadBoard: (id: string) => void
  rename: (id: string, name: string) => void
  remove: (id: string) => void
  addScheme: (scheme: Scheme) => void
  applyScheme: (scheme: Scheme) => void
  persist: () => void
}

const KEY = 'kb_boards'

function getBoards(): Saved[] {
  try {
    const data = localStorage.getItem(KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function setBoards(boards: Saved[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(boards))
  } catch {}
}

export const useBoard = create<BoardState>((set, get) => ({
  keys: [],
  case: '#e6e6e6',
  shape: { pad: 0.3, inset: 0, wall: 0.15, height: 1.0 },
  selected: null,
  mode: 'view',
  brush: { name: 'base', swatch: { background: '#3b82f6', color: '#ffffff' } },
  boards: getBoards(),
  active: null,
  schemes: [],
  scheme: null,
  background: '#09090b',
  load: (keys) => {
    const id = Math.random().toString(36).substring(2, 9)
    const name = `board ${get().boards.length + 1}`
    const kase = get().case
    const shape = get().shape
    const mappedKeys = keys.map((k) => ({ ...k, textColor: k.textColor || '#222222' }))
    
    const colorCounts: Record<string, number> = {}
    mappedKeys.forEach((k) => {
      if (k.color) {
        colorCounts[k.color] = (colorCounts[k.color] || 0) + 1
      }
    })
    
    let bg = '#09090b'
    let minCount = Infinity
    for (const [col, count] of Object.entries(colorCounts)) {
      if (count < minCount) {
        minCount = count
        bg = col
      }
    }

    const item: Saved = { id, name, keys: mappedKeys, case: kase, shape }
    const boards = [...get().boards, item]
    setBoards(boards)
    set({ keys: mappedKeys, boards, active: id, background: bg })
  },
  paint: (id, color, textColor) => set((state) => ({
    keys: state.keys.map((key) => key.id === id ? { ...key, color, textColor } : key)
  })),
  select: (id) => set({ selected: id }),
  paintLegend: (id, legend) => set((state) => ({
    keys: state.keys.map((k) => k.id === id ? { ...k, legend } : k)
  })),
  shell: (color) => set({ case: color }),
  reshape: (shape) => set((state) => ({ shape: { ...state.shape, ...shape } })),
  modeSet: (mode) => set({ mode }),
  brushSet: (brush) => set({ brush }),
  save: (name, keys, kase, shape) => {
    const id = Math.random().toString(36).substring(2, 9)
    const item: Saved = { id, name, keys, case: kase, shape }
    const boards = [...get().boards, item]
    setBoards(boards)
    set({ boards, active: id })
  },
  loadBoard: (id) => {
    const target = get().boards.find((b) => b.id === id)
    if (target) {
      const mappedKeys = target.keys.map((k) => ({ ...k, textColor: k.textColor || '#222222' }))
      
      const colorCounts: Record<string, number> = {}
      mappedKeys.forEach((k) => {
        if (k.color) {
          colorCounts[k.color] = (colorCounts[k.color] || 0) + 1
        }
      })
      
      let bg = get().background
      let minCount = Infinity
      for (const [col, count] of Object.entries(colorCounts)) {
        if (count < minCount) {
          minCount = count
          bg = col
        }
      }

      set({ keys: mappedKeys, case: target.case, shape: target.shape, active: target.id, background: bg })
    }
  },
  rename: (id, name) => {
    const boards = get().boards.map((b) => b.id === id ? { ...b, name } : b)
    setBoards(boards)
    set({ boards })
  },
  remove: (id) => {
    const boards = get().boards.filter((b) => b.id !== id)
    setBoards(boards)
    set({ boards, active: get().active === id ? null : get().active })
  },
  addScheme: (scheme) => set((state) => {
    if (state.schemes.some((s) => s.id === scheme.id)) return state
    return { schemes: [...state.schemes, scheme] }
  }),
  applyScheme: (scheme) => set((state) => {
    const override = scheme.override || {}
    const updated = state.keys.map((k) => {
      let name = 'base'
      if (override[k.legend]) {
        name = override[k.legend]
      } else if (k.w > 1.5 || k.w2 > 1.5) {
        name = 'mods'
      }
      const swatch = scheme.swatches[name] || scheme.swatches['base']
      return { 
        ...k, 
        color: swatch ? swatch.background : k.color,
        textColor: swatch ? swatch.color : (k.textColor || '#222222')
      }
    })
    const bg = scheme.swatches.accent?.background || scheme.swatches.base?.background || state.background
    return { keys: updated, scheme: scheme.id, background: bg }
  }),
  persist: () => {
    const { active, keys, case: kase, shape, boards } = get()
    if (!active) return
    const updated = boards.map((b) => b.id === active ? { ...b, keys, case: kase, shape } : b)
    setBoards(updated)
    set({ boards: updated })
  }
}))