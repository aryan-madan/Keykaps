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

export type Shape = {
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

export type State = {
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
  env: boolean
  load: (keys: Key[]) => void
  paint: (id: string, color: string, textColor: string) => void
  select: (id: string | null) => void
  legend: (id: string, text: string) => void
  shell: (color: string) => void
  mold: (shape: Partial<Shape>) => void
  modeSet: (mode: string) => void
  brushSet: (brush: { name: string; swatch: Swatch }) => void
  envSet: (env: boolean) => void
  save: (name: string, keys: Key[], kase: string, shape: Shape) => void
  open: (id: string) => void
  name: (id: string, text: string) => void
  drop: (id: string) => void
  add: (scheme: Scheme) => void
  apply: (scheme: Scheme) => void
  store: () => void
  init: () => Promise<void>
}

const KEY = 'kb_boards'

function read(): Saved[] {
  try {
    const data = localStorage.getItem(KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function write(boards: Saved[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(boards))
  } catch { }
}

export const useBoard = create<State>((set, get) => ({
  keys: [],
  case: '#e6e6e6',
  shape: { pad: 0.3, inset: 0, wall: 0.15, height: 1.0 },
  selected: null,
  mode: 'view',
  brush: { name: 'base', swatch: { background: '#3b82f6', color: '#ffffff' } },
  boards: read(),
  active: null,
  schemes: [],
  scheme: null,
  background: '#09090b',
  env: false,

  load: (keys) => {
    const id = Math.random().toString(36).substring(2, 9)
    const name = `board ${get().boards.length + 1}`
    const kase = get().case
    const shape = get().shape
    const mapped = keys.map((k) => ({ ...k, textColor: k.textColor || '#222222' }))
    const counts: Record<string, number> = {}
    mapped.forEach((k) => {
      if (k.color) {
        counts[k.color] = (counts[k.color] || 0) + 1
      }
    })
    let bg = '#09090b'
    let min = Infinity
    for (const [col, count] of Object.entries(counts)) {
      if (count < min) {
        min = count
        bg = col
      }
    }
    const item: Saved = { id, name, keys: mapped, case: kase, shape }
    const boards = [...get().boards, item]
    write(boards)
    set({ keys: mapped, boards, active: id, background: bg })
  },

  paint: (id, color, textColor) => set((state) => ({
    keys: state.keys.map((k) => k.id === id ? { ...k, color, textColor } : k)
  })),

  select: (id) => set({ selected: id }),

  legend: (id, text) => set((state) => ({
    keys: state.keys.map((k) => k.id === id ? { ...k, legend: text } : k)
  })),

  shell: (color) => set({ case: color }),

  mold: (shape) => set((state) => ({ shape: { ...state.shape, ...shape } })),

  modeSet: (mode) => set({ mode }),

  brushSet: (brush) => set({ brush }),

  envSet: (env) => set({ env }),

  save: (name, keys, kase, shape) => {
    const id = Math.random().toString(36).substring(2, 9)
    const item: Saved = { id, name, keys, case: kase, shape }
    const boards = [...get().boards, item]
    write(boards)
    set({ boards, active: id })
  },

  open: (id) => {
    const target = get().boards.find((b) => b.id === id)
    if (target) {
      const mapped = target.keys.map((k) => ({ ...k, textColor: k.textColor || '#222222' }))
      const counts: Record<string, number> = {}
      mapped.forEach((k) => {
        if (k.color) {
          counts[k.color] = (counts[k.color] || 0) + 1
        }
      })
      let bg = get().background
      let min = Infinity
      for (const [col, count] of Object.entries(counts)) {
        if (count < min) {
          min = count
          bg = col
        }
      }
      set({ keys: mapped, case: target.case, shape: target.shape, active: target.id, background: bg })
    }
  },

  name: (id, text) => {
    const boards = get().boards.map((b) => b.id === id ? { ...b, name: text } : b)
    write(boards)
    set({ boards })
  },

  drop: (id) => {
    const boards = get().boards.filter((b) => b.id !== id)
    write(boards)
    set({ boards, active: get().active === id ? null : get().active })
  },

  add: (scheme) => set((state) => {
    if (state.schemes.some((s) => s.id === scheme.id)) return state
    return { schemes: [...state.schemes, scheme] }
  }),

  apply: (scheme) => set((state) => {
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

  store: () => {
    const { active, keys, case: kase, shape, boards } = get()
    if (!active) return
    const updated = boards.map((b) => b.id === active ? { ...b, keys, case: kase, shape } : b)
    write(updated)
    set({ boards: updated })
  },

  init: async () => {
    const files = ['noel65', 'olivia60', 'port65', 'tofu64']
    let loadedFirstId: string | null = null

    for (const file of files) {
      try {
        const res = await fetch(`/layouts/${file}.keykap`)
        if (res.ok) {
          const data: Saved = await res.json()
          if (data && data.id && data.keys) {
            const current = get().boards
            const exists = current.some((b) => b.id === data.id || b.name.toLowerCase() === data.name.toLowerCase())
            if (!exists) {
              const updated = [...current, data]
              write(updated)
              set({ boards: updated })
            }
            if (!loadedFirstId) {
              loadedFirstId = data.id
            }
          }
        }
      } catch { }
    }

    const currentBoards = get().boards
    if (!get().active && currentBoards.length > 0) {
      const targetId = loadedFirstId || currentBoards[0].id
      get().open(targetId)
    }
  }
}))

if (typeof window !== 'undefined') {
  useBoard.getState().init()
}