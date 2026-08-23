import { useState, useEffect, useRef, useCallback, type ChangeEvent, type DragEvent } from 'react'
import { useBoard, type Scheme, type Saved } from '../store/board'
import { parse } from '../parse/kle'
import { dump } from '../parse/export'
import { Layout } from './layout'
import {
  FiMenu,
  FiX,
  FiCode,
  FiTrash2,
  FiArrowRight,
  FiDownload,
  FiSliders,
  FiDroplet,
  FiLayers,
  FiMaximize2
} from 'react-icons/fi'

export function Side() {
  const [show, setShow] = useState(true)
  const [vis, setVis] = useState(true)
  const [tab, setTab] = useState('editor')
  const [full, setFull] = useState(false)
  const [editor, setEditor] = useState(false)
  const [edvis, setEdvis] = useState(false)

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

  const [pname, setPname] = useState('')
  const [basebg, setBasebg] = useState('#18181b')
  const [basefg, setBasefg] = useState('#f4f4f5')
  const [modsbg, setModsbg] = useState('#09090b')
  const [modsfg, setModsfg] = useState('#f4f4f5')
  const [accbg, setAccbg] = useState('#3f3f46')
  const [accfg, setAccfg] = useState('#ffffff')

  const item = keys.find((k) => k.id === selected)
  const [text, setText] = useState('')

  const [json, setJson] = useState('')
  const [err, setErr] = useState(false)
  const [drag, setDrag] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [editid, setEditid] = useState<string | null>(null)

  const ref = useRef<HTMLInputElement>(null)
  const snap = useRef<string>('')
  const curboard = boards.find((b) => b.id === active)

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setVis(true)
      }, 250)
      return () => clearTimeout(timer)
    } else {
      setVis(false)
    }
  }, [show])

  useEffect(() => {
    if (curboard) {
      snap.current = JSON.stringify({
        keys: curboard.keys,
        case: curboard.case,
        shape: curboard.shape
      })
      setDirty(false)
    }
  }, [active])

  useEffect(() => {
    if (!curboard) return
    const cur = JSON.stringify({
      keys,
      case: kase,
      shape
    })
    setDirty(cur !== snap.current)
  }, [keys, kase, shape, curboard])

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
      const loaded: Scheme[] = []
      results.forEach((data) => {
        if (data?.id) {
          add(data)
          loaded.push(data)
        }
      })
      const state = useBoard.getState()
      if (!state.scheme && loaded.length > 0) {
        apply(loaded[0])
      }
    })
  }, [add, apply])

  function create() {
    if (!pname.trim()) return

    const scheme: Scheme = {
      id: pname.toLowerCase().replace(/\s+/g, '-'),
      label: pname,
      manufacturer: 'custom',
      swatches: {
        base: { background: basebg, color: basefg },
        mods: { background: modsbg, color: modsfg },
        accent: { background: accbg, color: accfg }
      },
      override: {}
    }

    add(scheme)
    apply(scheme)
    setPname('')
  }

  function download(data: object | string, filename: string) {
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

  function expsch(s: Scheme) {
    if (!s) return
    download(s, `${s.id || 'colorway'}.json`)
  }

  function proc(raw: string) {
    if (!raw.trim()) return

    try {
      const data = JSON.parse(raw)

      if (data && (Array.isArray(data.keys) || data.id)) {
        const saved: Saved = data
        const cur = useBoard.getState().boards
        const exists = cur.some((b) => b.id === saved.id)
        const updated = exists
          ? cur.map((b) => (b.id === saved.id ? saved : b))
          : [...cur, saved]

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

  const save = useCallback((id: string) => {
    const target = boards.find((b) => b.id === id)
    if (!target) return

    const updated = boards.map((b) => {
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

    useBoard.setState({ boards: updated })

    if (active === id) {
      snap.current = JSON.stringify({
        keys,
        case: kase,
        shape
      })
      setDirty(false)
    }
  }, [boards, active, keys, kase, shape])

  const expfile = useCallback((id: string) => {
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
    download(str, `${target.name.toLowerCase().replace(/\s+/g, '-')}.keykap`)
  }, [boards, active, keys, kase, shape])

  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (active) {
          save(active)
        }
      }
    }

    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [active, save])

  function openeditor() {
    setVis(false)
    setTimeout(() => {
      setFull(true)
      setTimeout(() => {
        setEditor(true)
        requestAnimationFrame(() => setEdvis(true))
      }, 400)
    }, 300)
  }

  function closeeditor() {
    setEdvis(false)
    setTimeout(() => {
      setEditor(false)
      setFull(false)
      setVis(true)
    }, 300)
  }

  const curscheme = schemes.find((s) => s.id === scheme)

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

      {editor && <Layout vis={edvis} exit={closeeditor} />}

      <div
        style={{
          width: full ? 'calc(100vw - 40px)' : show ? '250px' : '40px',
          height: full ? 'calc(100vh - 40px)' : show ? 'calc(100vh - 40px)' : '40px'
        }}
        className="fixed left-5 top-5 z-40 font-sans bg-zinc-950 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] rounded-2xl shadow-2xl overflow-hidden border border-zinc-800/80"
      >
        {!show && !full ? (
          <button
            onClick={() => setShow(true)}
            className="flex h-full w-full items-center justify-center transition-colors duration-150 relative group"
            title="open menu"
          >
            <FiMenu className="h-4 w-4 text-zinc-300 transition-transform duration-300 group-hover:scale-105" />
            {dirty && (
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-zinc-400" />
            )}
          </button>
        ) : (
          <div className={`flex h-full w-full flex-col text-zinc-200 overflow-hidden relative rounded-2xl transition-opacity duration-300 ease-out ${vis && !full ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="flex h-12 shrink-0 items-center justify-between px-3.5 pt-1">
              <div className="flex items-center gap-2">
                <span className="font-cherry text-xl tracking-wide text-zinc-100">keykaps</span>
              </div>
              <button
                onClick={() => {
                  setVis(false)
                  setShow(false)
                }}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
              >
                <FiX className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="px-3 py-1">
              <div className="grid grid-cols-3 gap-1 bg-zinc-900 p-1 rounded-xl">
                {([
                  ['editor', 'editor', FiSliders],
                  ['colorways', 'colors', FiDroplet],
                  ['boards', 'boards', FiLayers]
                ] as const).map(([id, label, Icon]) => {
                  const act = tab === id
                  return (
                    <button
                      key={id}
                      onClick={() => setTab(id)}
                      className={`flex items-center justify-center gap-1 rounded-lg py-1.5 text-[9px] font-medium transition-all duration-150 ${act
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
                  <div className="space-y-1">
                    <label className="text-[9px] font-medium text-zinc-500 px-1">
                      layout editor
                    </label>
                    <button
                      onClick={openeditor}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 py-2.5 text-[11px] font-semibold text-zinc-200 transition active:scale-[0.98]"
                    >
                      <FiMaximize2 className="h-3.5 w-3.5" />
                      <span>expand editor</span>
                    </button>
                  </div>

                  {active && (
                    <div className="space-y-1">
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

                  <div className="space-y-1">
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

                  <div className="space-y-1">
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

                  <div className="space-y-1">
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

                  <div className="space-y-1">
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

                  <div className="space-y-1">
                    <label className="text-[9px] font-medium text-zinc-500 px-1">
                      active brush
                    </label>
                    {curscheme ? (
                      <div className="bg-zinc-900 rounded-xl p-1 space-y-0.5">
                        {Object.entries(curscheme.swatches).map(([name, swatch]) => {
                          const act = brush.name === name
                          return (
                            <button
                              key={name}
                              onClick={() => brushSet({ name, swatch })}
                              className={`flex h-7 w-full items-center justify-between px-2.5 text-[11px] rounded-lg transition ${act
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
                  <div className="space-y-1">
                    <label className="text-[9px] font-medium text-zinc-500 px-1">
                      saved colorways
                    </label>
                    <div className="space-y-1">
                      {schemes.map((s) => {
                        const act = scheme === s.id
                        return (
                          <div
                            key={s.id}
                            onClick={() => apply(s)}
                            className={`flex items-center justify-between rounded-xl px-3 py-2 transition-all duration-300 ease-out cursor-pointer ${act
                              ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                              : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                              }`}
                          >
                            <span className={`min-w-0 flex-1 truncate px-1 text-[11px] ${act ? 'text-zinc-950 font-semibold' : 'text-zinc-100 font-medium'
                              }`}>
                              {s.label}
                            </span>

                            {act && (
                              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => expsch(s)}
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

                  <div className="space-y-2 pt-2">
                    <span className="text-[9px] font-medium text-zinc-500 px-1">
                      custom palette
                    </span>
                    <input
                      type="text"
                      value={pname}
                      onChange={(e) => setPname(e.target.value)}
                      placeholder="palette name"
                      className="h-8 w-full bg-zinc-900 text-zinc-100 rounded-xl px-3 text-[11px] outline-none placeholder:text-zinc-600 focus:bg-zinc-800 transition"
                    />
                    <div className="bg-zinc-900 rounded-xl p-1 space-y-0.5">
                      {[
                        ['base', basebg, basefg, setBasebg, setBasefg],
                        ['mods', modsbg, modsfg, setModsbg, setModsfg],
                        ['accent', accbg, accfg, setAccbg, setAccfg]
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
                  <div className="space-y-1">
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
                      className={`flex items-center gap-1.5 rounded-xl bg-zinc-900 p-1.5 transition ${drag ? 'bg-zinc-800' : err ? 'bg-red-950' : ''
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

                  <div className="space-y-1">
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
                          const act = active === b.id
                          const editing = editid === b.id
                          return (
                            <div
                              key={b.id}
                              onClick={() => {
                                if (!act) open(b.id)
                              }}
                              onDoubleClick={() => setEditid(b.id)}
                              className={`flex items-center justify-between rounded-xl px-3 py-2 transition-all duration-300 ease-out cursor-pointer ${act
                                ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                                : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                                }`}
                            >
                              {editing ? (
                                <input
                                  type="text"
                                  autoFocus
                                  value={b.name}
                                  onChange={(e) => rename(b.id, e.target.value)}
                                  onBlur={() => setEditid(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') setEditid(null)
                                  }}
                                  className={`min-w-0 flex-1 bg-transparent px-1 text-[11px] outline-none ${act ? 'text-zinc-950 font-semibold' : 'text-zinc-100 font-medium'
                                    }`}
                                />
                              ) : (
                                <span className={`min-w-0 flex-1 truncate px-1 text-[11px] ${act ? 'text-zinc-950 font-semibold' : 'text-zinc-100 font-medium'
                                  }`}>
                                  {b.name}
                                </span>
                              )}

                              {act && (
                                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => expfile(b.id)}
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

            {dirty && active && (
              <div className="absolute bottom-10 left-0 right-0 py-1.5 flex justify-center transition-all duration-200">
                <button
                  onClick={() => save(active)}
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 text-[10px] text-zinc-300 hover:text-zinc-100 font-medium transition-all"
                >
                  <span>unsaved changes</span>
                  <kbd className="inline-flex items-center gap-0.5 text-[9px] font-sans text-zinc-400">
                    <span>⌘</span>S
                  </kbd>
                </button>
              </div>
            )}

            <div className="flex h-10 shrink-0 items-center justify-center px-3.5 bg-zinc-950 border-t border-zinc-900/60 rounded-b-2xl">
              <span className="text-[10px] text-zinc-600 font-medium tracking-wide">made with ♡ by ary</span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}