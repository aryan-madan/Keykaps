import { useState, useEffect, useRef, useCallback, type ChangeEvent, type DragEvent } from 'react'
import { useBoard, type Scheme, type Saved } from '../store/board'
import { parse } from '../parse/kle'
import { dump } from '../parse/export'
import {
  FiMenu,
  FiX,
  FiCode,
  FiTrash2,
  FiArrowRight,
  FiDownload,
  FiSliders,
  FiDroplet,
  FiLayers
} from 'react-icons/fi'

export function Side() {
  const [show, setShow] = useState(true)
  const [tab, setTab] = useState('editor')

  const {
    mode,
    modeSet,
    brush,
    brushSet,
    shell,
    boards,
    active,
    open,
    name: rename,
    drop,
    schemes,
    add,
    apply,
    scheme,
    keys,
    selected,
    legend,
    load,
    env,
    envSet,
    shape,
    case: kase
  } = useBoard()

  const [inputName, setInputName] = useState('')
  const [baseBg, setBaseBg] = useState('#18181b')
  const [baseFg, setBaseFg] = useState('#f4f4f5')
  const [modsBg, setModsBg] = useState('#09090b')
  const [modsFg, setModsFg] = useState('#f4f4f5')
  const [accentBg, setAccentBg] = useState('#3f3f46')
  const [accentFg, setAccentFg] = useState('#ffffff')

  const item = keys.find((k) => k.id === selected)
  const [text, setText] = useState('')

  const [json, setJson] = useState('')
  const [err, setErr] = useState(false)
  const [drag, setDrag] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null)
  
  const ref = useRef<HTMLInputElement>(null)
  const lastSavedSnapshot = useRef<string>('')
  const activeBoard = boards.find((b) => b.id === active)

  useEffect(() => {
    if (activeBoard) {
      lastSavedSnapshot.current = JSON.stringify({
        keys: activeBoard.keys,
        case: activeBoard.case,
        shape: activeBoard.shape
      })
      setIsDirty(false)
    }
  }, [active])

  useEffect(() => {
    if (!activeBoard) return
    const currentSnapshot = JSON.stringify({
      keys,
      case: kase,
      shape
    })
    setIsDirty(currentSnapshot !== lastSavedSnapshot.current)
  }, [keys, kase, shape, activeBoard])

  useEffect(() => {
    if (item) {
      setText(item.legend || '')
      setShow(true)
    }
  }, [item])

  useEffect(() => {
    const files = ['olivia', 'port', 'prussian', 'makima']

    Promise.all(
      files.map((file) =>
        fetch(`/colorways/${file}.json`)
          .then((res) => res.json())
          .catch(() => null)
      )
    ).then((results) => {
      const loadedSchemes: Scheme[] = []
      results.forEach((data) => {
        if (data?.id) {
          add(data)
          loadedSchemes.push(data)
        }
      })
      const state = useBoard.getState()
      if (!state.scheme && loadedSchemes.length > 0) {
        apply(loadedSchemes[0])
      }
    })
  }, [add, apply])

  function create() {
    if (!inputName.trim()) return

    const scheme: Scheme = {
      id: inputName.toLowerCase().replace(/\s+/g, '-'),
      label: inputName,
      manufacturer: 'custom',
      swatches: {
        base: { background: baseBg, color: baseFg },
        mods: { background: modsBg, color: modsFg },
        accent: { background: accentBg, color: accentFg }
      },
      override: {}
    }

    add(scheme)
    apply(scheme)
    setInputName('')
  }

  function downloadJson(data: object | string, filename: string) {
    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
    const blob = new Blob([content], { type: 'application/json;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  function exportPalette(paletteScheme: Scheme) {
    if (!paletteScheme) return
    const filename = `${paletteScheme.id || 'colorway'}.json`
    downloadJson(paletteScheme, filename)
  }

  function proc(raw: string) {
    if (!raw.trim()) return

    try {
      const data = JSON.parse(raw)

      if (data && (Array.isArray(data.keys) || data.id)) {
        const saved: Saved = data
        const current = useBoard.getState().boards
        const exists = current.some((b) => b.id === saved.id)
        const updated = exists
          ? current.map((b) => (b.id === saved.id ? saved : b))
          : [...current, saved]

        useBoard.setState({ boards: updated })
        open(saved.id)
        if (saved.keys) load(saved.keys)
      } else if (data && data.swatches) {
        add(data)
        apply(data)
      } else {
        const result = parse(data)
        load(result)
      }
      setErr(false)
      setJson('')
    } catch {
      setErr(true)
    }
  }

  function read(file?: File) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (content) proc(content)
    }
    reader.readAsText(file)
  }

  const saveLayout = useCallback((id: string) => {
    const target = boards.find((b) => b.id === id)
    if (!target) return

    const updatedBoards = boards.map((b) => {
      if (b.id === id) {
        return {
          ...b,
          keys,
          case: kase,
          shape
        }
      }
      return b
    })

    useBoard.setState({ boards: updatedBoards })

    if (active === id) {
      lastSavedSnapshot.current = JSON.stringify({
        keys,
        case: kase,
        shape
      })
      setIsDirty(false)
    }
  }, [boards, active, keys, kase, shape])

  const exportFile = useCallback((id: string) => {
    const target = boards.find((b) => b.id === id)
    if (!target) return
    const saved: Saved = {
      id: target.id,
      name: target.name,
      keys: active === target.id ? keys : target.keys,
      case: active === target.id ? kase : target.case,
      shape: active === target.id ? shape : target.shape
    }
    const str = dump(saved)
    const filename = `${target.name.toLowerCase().replace(/\s+/g, '-')}.keykap`
    downloadJson(str, filename)
  }, [boards, active, keys, kase, shape])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (active) {
          saveLayout(active)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [active, saveLayout])

  const currentScheme = schemes.find((s) => s.id === scheme)

  const getBlurItemStyle = (index: number) => ({
    transitionDelay: show ? `${60 + index * 45}ms` : '0ms'
  })

  const blurItemClass = `transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${
    show
      ? 'opacity-100 blur-0 translate-y-0 scale-100'
      : 'opacity-0 blur-xl -translate-y-2 scale-95 pointer-events-none'
  }`

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        
        @font-face {
          font-family: 'Cherry';
          src: url('/typeface/cherry.otf') format('opentype');
        }

        .font-sans {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .font-cherry {
          font-family: 'Cherry', cursive, sans-serif;
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div
        style={{
          width: show ? '250px' : '40px',
          height: show ? 'calc(100vh - 40px)' : '40px'
        }}
        className="fixed left-5 top-5 z-50 font-sans bg-zinc-950 transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] rounded-2xl shadow-2xl overflow-hidden"
      >
        {!show ? (
          <button
            onClick={() => setShow(true)}
            className="flex h-full w-full items-center justify-center transition-colors duration-150 relative group"
            title="open menu"
          >
            <FiMenu className="h-4 w-4 text-zinc-300 transition-transform duration-300 group-hover:scale-105" />
            {isDirty && (
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-zinc-400" />
            )}
          </button>
        ) : (
          <div className="flex h-full w-full flex-col text-zinc-200 overflow-hidden relative rounded-2xl">
            <div
              style={getBlurItemStyle(0)}
              className={`flex h-12 shrink-0 items-center justify-between px-3.5 pt-1 ${blurItemClass}`}
            >
              <div className="flex items-center gap-2">
                <span className="font-cherry text-xl tracking-wide text-zinc-100">keykaps</span>
              </div>
              <button
                onClick={() => setShow(false)}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
              >
                <FiX className="h-3.5 w-3.5" />
              </button>
            </div>

            <div
              style={getBlurItemStyle(1)}
              className={`px-3 py-1 ${blurItemClass}`}
            >
              <div className="grid grid-cols-3 gap-1 bg-zinc-900 p-1 rounded-xl">
                {([
                  ['editor', 'editor', FiSliders],
                  ['colorways', 'colors', FiDroplet],
                  ['boards', 'boards', FiLayers]
                ] as const).map(([id, label, Icon]) => {
                  const isActiveTab = tab === id
                  return (
                    <button
                      key={id}
                      onClick={() => setTab(id)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[10px] font-medium transition-all duration-150 ${
                        isActiveTab
                          ? 'bg-zinc-100 text-zinc-950 font-semibold'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                      <span>{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-2 space-y-4 pb-12">
              {tab === 'editor' && (
                <div className="space-y-3">
                  {active && (
                    <div
                      style={getBlurItemStyle(2)}
                      className={`space-y-1 ${blurItemClass}`}
                    >
                      <label className="text-[9px] font-medium text-zinc-500 px-1">
                        layout name
                      </label>
                      <input
                        type="text"
                        value={boards.find((b) => b.id === active)?.name || ''}
                        onChange={(e) => rename(active, e.target.value)}
                        placeholder="custom layout"
                        className="h-8 w-full bg-zinc-900 text-zinc-100 rounded-xl px-3 text-[11px] outline-none transition placeholder:text-zinc-600 focus:bg-zinc-800"
                      />
                    </div>
                  )}

                  <div
                    style={getBlurItemStyle(3)}
                    className={`space-y-1 ${blurItemClass}`}
                  >
                    <label className="text-[9px] font-medium text-zinc-500 px-1">
                      mode
                    </label>
                    <button
                      onClick={() => modeSet(mode === 'edit' ? 'view' : 'edit')}
                      className="flex h-8 w-full items-center justify-between bg-zinc-900 hover:bg-zinc-800 px-3 rounded-xl text-[11px] transition"
                    >
                      <span className="text-zinc-200">{mode === 'edit' ? 'painting' : 'inspecting'}</span>
                      <span className="text-[9px] text-zinc-500 font-mono">toggle</span>
                    </button>
                  </div>

                  <div
                    style={getBlurItemStyle(4)}
                    className={`space-y-1 ${blurItemClass}`}
                  >
                    <label className="text-[9px] font-medium text-zinc-500 px-1">
                      background
                    </label>
                    <button
                      onClick={() => envSet(!env)}
                      className="flex h-8 w-full items-center justify-between bg-zinc-900 hover:bg-zinc-800 px-3 rounded-xl text-[11px] transition"
                    >
                      <span className="text-zinc-200">{env ? 'enabled' : 'disabled'}</span>
                      <span className="text-[9px] text-zinc-500 font-mono">toggle</span>
                    </button>
                  </div>

                  <div
                    style={getBlurItemStyle(5)}
                    className={`space-y-1 ${blurItemClass}`}
                  >
                    <label className="text-[9px] font-medium text-zinc-500 px-1">
                      key legend
                    </label>
                    {item ? (
                      <input
                        type="text"
                        value={text}
                        onChange={(e) => {
                          setText(e.target.value)
                          legend(item.id, e.target.value)
                        }}
                        placeholder="enter legend..."
                        className="h-8 w-full bg-zinc-900 text-zinc-100 rounded-xl px-3 text-[11px] outline-none transition placeholder:text-zinc-600 focus:bg-zinc-800"
                      />
                    ) : (
                      <div className="flex h-8 items-center bg-zinc-900 px-3 rounded-xl text-[10px] text-zinc-600 font-mono">
                        select a key
                      </div>
                    )}
                  </div>

                  <div
                    style={getBlurItemStyle(6)}
                    className={`space-y-1 ${blurItemClass}`}
                  >
                    <label className="text-[9px] font-medium text-zinc-500 px-1">
                      case color
                    </label>
                    <div className="flex items-center justify-between bg-zinc-900 px-3 py-1.5 rounded-xl">
                      <span className="text-[11px] text-zinc-400">hex</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={useBoard.getState().case}
                          onChange={(e) => shell(e.target.value)}
                          className="h-4 w-4 cursor-pointer appearance-none rounded-md bg-transparent border-0 p-0"
                        />
                        <span className="font-mono text-[11px] text-zinc-200">
                          {useBoard.getState().case}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    style={getBlurItemStyle(7)}
                    className={`space-y-1 ${blurItemClass}`}
                  >
                    <label className="text-[9px] font-medium text-zinc-500 px-1">
                      active brush
                    </label>
                    {currentScheme ? (
                      <div className="bg-zinc-900 rounded-xl p-1 space-y-0.5">
                        {Object.entries(currentScheme.swatches).map(([name, swatch]) => {
                          const activeBrush = brush.name === name
                          return (
                            <button
                              key={name}
                              onClick={() => brushSet({ name, swatch })}
                              className={`flex h-7 w-full items-center justify-between px-2.5 text-[11px] rounded-lg transition ${
                                activeBrush
                                  ? 'bg-zinc-100 text-zinc-950 font-semibold'
                                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                              }`}
                            >
                              <span className="lowercase">{name}</span>
                              <span className="flex items-center gap-1">
                                <span className="h-3 w-3 rounded-md" style={{ backgroundColor: swatch.background }} />
                                <span className="h-3 w-3 rounded-md" style={{ backgroundColor: swatch.color }} />
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-[10px] text-zinc-600 px-1">no palette loaded.</div>
                    )}
                  </div>
                </div>
              )}

              {tab === 'colorways' && (
                <div className="space-y-3">
                  <div
                    style={getBlurItemStyle(2)}
                    className={`space-y-1 ${blurItemClass}`}
                  >
                    <label className="text-[9px] font-medium text-zinc-500 px-1">
                      saved colorways
                    </label>
                    <div className="space-y-1">
                      {schemes.map((s) => {
                        const activeItem = scheme === s.id
                        return (
                          <div
                            key={s.id}
                            onClick={() => apply(s)}
                            className={`flex items-center justify-between rounded-xl px-3 py-2 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer ${
                              activeItem
                                ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                                : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                            }`}
                          >
                            <span className={`min-w-0 flex-1 truncate px-1 text-[11px] ${
                              activeItem ? 'text-zinc-950 font-semibold' : 'text-zinc-100 font-medium'
                            }`}>
                              {s.label}
                            </span>

                            {activeItem && (
                              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => exportPalette(s)}
                                  className="flex h-6 w-6 items-center justify-center rounded-lg text-zinc-800 hover:text-zinc-950 hover:bg-zinc-200 transition"
                                  title="export scheme"
                                >
                                  <FiDownload className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div
                    style={getBlurItemStyle(3)}
                    className={`space-y-2 pt-2 ${blurItemClass}`}
                  >
                    <span className="text-[9px] font-medium text-zinc-500 px-1">
                      custom palette
                    </span>
                    <input
                      type="text"
                      value={inputName}
                      onChange={(e) => setInputName(e.target.value)}
                      placeholder="palette name"
                      className="h-8 w-full bg-zinc-900 text-zinc-100 rounded-xl px-3 text-[11px] outline-none placeholder:text-zinc-600 focus:bg-zinc-800 transition"
                    />
                    <div className="bg-zinc-900 rounded-xl p-1 space-y-0.5">
                      {[
                        ['base', baseBg, baseFg, setBaseBg, setBaseFg],
                        ['mods', modsBg, modsFg, setModsBg, setModsFg],
                        ['accent', accentBg, accentFg, setAccentBg, setAccentFg]
                      ].map(([label, bg, fg, setBg, setFg]) => (
                        <div key={label as string} className="flex h-7 items-center justify-between px-2.5 rounded-lg hover:bg-zinc-800">
                          <span className="text-[11px] text-zinc-300 lowercase">{label as string}</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={bg as string}
                              onChange={(e) => (setBg as (v: string) => void)(e.target.value)}
                              className="h-3.5 w-3.5 cursor-pointer appearance-none rounded-md bg-transparent border-0 p-0"
                            />
                            <input
                              type="color"
                              value={fg as string}
                              onChange={(e) => (setFg as (v: string) => void)(e.target.value)}
                              className="h-3.5 w-3.5 cursor-pointer appearance-none rounded-md bg-transparent border-0 p-0"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={create}
                      className="w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 py-2 text-[11px] font-semibold text-zinc-200 transition active:scale-[0.98]"
                    >
                      save palette
                    </button>
                  </div>
                </div>
              )}

              {tab === 'boards' && (
                <div className="space-y-3">
                  <div
                    style={getBlurItemStyle(2)}
                    className={`space-y-1 ${blurItemClass}`}
                  >
                    <label className="text-[9px] font-medium text-zinc-500 px-1">
                      import
                    </label>
                    <div
                      onDrop={(e: DragEvent) => {
                        e.preventDefault()
                        setDrag(false)
                        read(e.dataTransfer.files?.[0])
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                        setDrag(true)
                      }}
                      onDragLeave={() => setDrag(false)}
                      className={`flex items-center gap-1.5 rounded-xl bg-zinc-900 p-1.5 transition ${
                        drag ? 'bg-zinc-800' : err ? 'bg-red-950' : ''
                      }`}
                    >
                      <input
                        value={json}
                        onChange={(e) => {
                          setJson(e.target.value)
                          setErr(false)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') proc(json)
                        }}
                        placeholder="paste json or drop..."
                        className="h-7 min-w-0 flex-1 bg-transparent px-2 text-[11px] text-zinc-100 outline-none placeholder:text-zinc-600"
                      />
                      <button
                        onClick={() => proc(json)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 transition shrink-0"
                      >
                        <FiArrowRight className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => ref.current?.click()}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 transition shrink-0"
                      >
                        <FiCode className="h-3.5 w-3.5" />
                      </button>
                      <input
                        ref={ref}
                        type="file"
                        accept=".keykap,.json"
                        onChange={(e: ChangeEvent<HTMLInputElement>) => read(e.target.files?.[0])}
                        className="hidden"
                      />
                    </div>
                    {err && <div className="px-1 text-[9px] text-red-400">invalid layout format</div>}
                  </div>

                  <div
                    style={getBlurItemStyle(3)}
                    className={`space-y-1 ${blurItemClass}`}
                  >
                    <label className="text-[9px] font-medium text-zinc-500 px-1">
                      layouts list
                    </label>
                    <div className="space-y-1">
                      {boards.length === 0 ? (
                        <div className="py-4 text-center text-[10px] font-mono text-zinc-600">
                          no layouts found.
                        </div>
                      ) : (
                        boards.map((b) => {
                          const activeItem = active === b.id
                          const isEditing = editingBoardId === b.id
                          return (
                            <div
                              key={b.id}
                              onClick={() => {
                                if (!activeItem) open(b.id)
                              }}
                              onDoubleClick={() => setEditingBoardId(b.id)}
                              className={`flex items-center justify-between rounded-xl px-3 py-2 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer ${
                                activeItem
                                  ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                                  : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                              }`}
                            >
                              {isEditing ? (
                                <input
                                  type="text"
                                  autoFocus
                                  value={b.name}
                                  onChange={(e) => rename(b.id, e.target.value)}
                                  onBlur={() => setEditingBoardId(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') setEditingBoardId(null)
                                  }}
                                  className={`min-w-0 flex-1 bg-transparent px-1 text-[11px] outline-none ${
                                    activeItem ? 'text-zinc-950 font-semibold' : 'text-zinc-100 font-medium'
                                  }`}
                                />
                              ) : (
                                <span className={`min-w-0 flex-1 truncate px-1 text-[11px] ${
                                  activeItem ? 'text-zinc-950 font-semibold' : 'text-zinc-100 font-medium'
                                }`}>
                                  {b.name}
                                </span>
                              )}

                              {activeItem && (
                                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => exportFile(b.id)}
                                    className="flex h-6 w-6 items-center justify-center rounded-lg text-zinc-800 hover:text-zinc-950 hover:bg-zinc-200 transition"
                                    title="export layout"
                                  >
                                    <FiDownload className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => drop(b.id)}
                                    className="flex h-6 w-6 items-center justify-center rounded-lg text-zinc-800 hover:text-red-600 hover:bg-zinc-200 transition"
                                    title="delete layout"
                                  >
                                    <FiTrash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {isDirty && active && (
              <div className="absolute bottom-10 left-0 right-0 py-1.5 flex justify-center transition-all duration-200">
                <button
                  onClick={() => saveLayout(active)}
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 text-[10px] text-zinc-300 hover:text-zinc-100 font-medium transition-all"
                >
                  <span>unsaved changes</span>
                  <kbd className="inline-flex items-center gap-0.5 text-[9px] font-sans text-zinc-400">
                    <span>⌘</span>S
                  </kbd>
                </button>
              </div>
            )}

            <div
              style={getBlurItemStyle(8)}
              className={`flex h-10 shrink-0 items-center justify-center px-3.5 bg-zinc-950 border-t border-zinc-900/60 rounded-b-2xl ${blurItemClass}`}
            >
              <span className="text-[10px] text-zinc-600 font-medium tracking-wide">made with ♡ by ary</span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}