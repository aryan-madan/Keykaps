import { useState, useEffect, useRef, type ChangeEvent, type DragEvent } from 'react'
import { useBoard, type Scheme, type Saved } from '../store/board'
import { parse } from '../parse/kle'
import { dump } from '../parse/export'
import {
  FaBars,
  FaTimes,
  FaFileCode,
  FaTrash,
  FaCheck,
  FaArrowRight,
  FaDownload
} from 'react-icons/fa'

export function Side() {
  const [show, setShow] = useState(false)
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
  const [baseBg, setBaseBg] = useState('#1c1c1e')
  const [baseFg, setBaseFg] = useState('#f5f5f7')
  const [modsBg, setModsBg] = useState('#2c2c2e')
  const [modsFg, setModsFg] = useState('#f5f5f7')
  const [accentBg, setAccentBg] = useState('#0a84ff')
  const [accentFg, setAccentFg] = useState('#ffffff')

  const item = keys.find((k) => k.id === selected)
  const [text, setText] = useState('')

  const [json, setJson] = useState('')
  const [err, setErr] = useState(false)
  const [drag, setDrag] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (item) {
      setText(item.legend || '')
      setShow(true)
    }
  }, [item])

  useEffect(() => {
    const files = ['olivia', 'port', 'prussian']

    files.forEach((file) => {
      fetch(`/colorways/${file}.json`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.id) {
            add(data)
            apply(data)
          }
        })
        .catch(() => { })
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

  function proc(raw: string) {
    if (!raw.trim()) return

    try {
      const data = JSON.parse(raw)
      if (data && Array.isArray(data.keys)) {
        const saved: Saved = data
        const current = useBoard.getState().boards
        const exists = current.some((b) => b.id === saved.id)
        const updated = exists ? current : [...current, saved]
        useBoard.setState({ boards: updated })
        open(saved.id)
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

  function exportFile(id: string) {
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

    const uri = 'data:text/json;charset=utf-8,' + encodeURIComponent(str)
    const anchor = document.createElement('a')
    anchor.setAttribute('href', uri)
    anchor.setAttribute('download', `${target.name.toLowerCase().replace(/\s+/g, '-')}.keykap`)
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  }

  const currentScheme = schemes.find((s) => s.id === scheme)

  return (
    <>
      <button
        onClick={() => setShow(!show)}
        className="fixed left-4 top-4 z-45 flex h-9 w-9 items-center justify-center rounded-2xl bg-[#0a0a0c]/90 text-[#8e8e93] shadow-lg ring-1 ring-white/10 backdrop-blur-md transition hover:bg-[#141416] hover:text-white active:scale-95"
      >
        <FaBars className="h-3.5 w-3.5" />
      </button>

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-80 flex-col bg-[#0d0d0f]/95 text-[#f5f5f7] shadow-2xl ring-1 ring-white/[0.08] backdrop-blur-xl transition-transform duration-300 ease-out ${show ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <header className="flex h-14 items-center justify-between border-b border-white/[0.06] px-5">
          <h1 className="text-[13px] font-medium tracking-tight text-white/95">keykaps</h1>

          <button
            onClick={() => setShow(false)}
            className="flex h-7 w-7 items-center justify-center rounded-xl text-[#8e8e93] transition hover:bg-white/10 hover:text-white"
          >
            <FaTimes className="h-3.5 w-3.5" />
          </button>
        </header>

        <div className="p-4 pb-0">
          <nav className="flex rounded-2xl bg-[#141416] p-1 ring-1 ring-white/[0.04]">
            {[
              ['editor', 'design'],
              ['colorways', 'palettes'],
              ['boards', 'layouts']
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`flex-1 flex items-center justify-center rounded-xl py-1.5 text-[11px] font-medium transition ${tab === value
                    ? 'bg-[#222226] text-white shadow-md ring-1 ring-white/[0.08]'
                    : 'text-[#8e8e93] hover:text-white'
                  }`}
              >
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <main className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {tab === 'editor' && (
            <div className="space-y-4">
              {active && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium tracking-wide text-[#8e8e93] px-0.5">
                    layout name
                  </label>
                  <input
                    type="text"
                    value={boards.find((b) => b.id === active)?.name || ''}
                    onChange={(e) => rename(active, e.target.value)}
                    placeholder="my keyboard"
                    className="h-8 w-full rounded-xl bg-[#141416] px-3 text-[11px] text-white/95 ring-1 ring-white/[0.06] outline-none transition focus:bg-[#1a1a1e] focus:ring-white/25"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-medium tracking-wide text-[#8e8e93] px-0.5">
                  interaction mode
                </label>
                <button
                  onClick={() => modeSet(mode === 'edit' ? 'view' : 'edit')}
                  className="flex h-8 w-full items-center justify-between rounded-xl bg-[#141416] px-3 text-[11px] ring-1 ring-white/[0.06] transition hover:bg-[#1a1a1e]"
                >
                  <span className="font-medium text-white/95">
                    {mode === 'edit' ? 'painting' : 'inspecting'}
                  </span>
                  <span className="text-[10px] text-[#8e8e93] font-mono lowercase">click to toggle</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-medium tracking-wide text-[#8e8e93] px-0.5">
                  environment background
                </label>
                <button
                  onClick={() => envSet(!env)}
                  className="flex h-8 w-full items-center justify-between rounded-xl bg-[#141416] px-3 text-[11px] ring-1 ring-white/[0.06] transition hover:bg-[#1a1a1e]"
                >
                  <span className="font-medium text-white/95">
                    {env ? 'enabled' : 'disabled'}
                  </span>
                  <span className="text-[10px] text-[#8e8e93] font-mono lowercase">click to toggle</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-medium tracking-wide text-[#8e8e93] px-0.5">
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
                    placeholder="enter text..."
                    className="h-8 w-full rounded-xl bg-[#141416] px-3 text-[11px] text-white/95 ring-1 ring-white/[0.06] outline-none transition focus:bg-[#1a1a1e] focus:ring-white/25"
                  />
                ) : (
                  <div className="flex h-8 items-center rounded-xl border border-dashed border-white/10 px-3 text-[10px] text-[#8e8e93]">
                    click any key to edit legend
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-medium tracking-wide text-[#8e8e93] px-0.5">
                  case color
                </label>
                <div className="flex items-center justify-between rounded-xl bg-[#141416] p-2 ring-1 ring-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="color"
                      value={useBoard.getState().case}
                      onChange={(e) => shell(e.target.value)}
                      className="h-5 w-5 cursor-pointer appearance-none rounded-lg border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-0"
                    />
                    <span className="font-mono text-[10px] font-medium text-[#8e8e93]">
                      {useBoard.getState().case}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-medium tracking-wide text-[#8e8e93] px-0.5">
                  active brush
                </label>
                {currentScheme ? (
                  <div className="overflow-hidden rounded-2xl bg-[#141416] ring-1 ring-white/[0.06]">
                    {Object.entries(currentScheme.swatches).map(([name, swatch], index) => {
                      const activeBrush = brush.name === name

                      return (
                        <button
                          key={name}
                          onClick={() => brushSet({ name, swatch })}
                          className={`flex h-8 w-full items-center justify-between px-3 text-[11px] transition ${index > 0 ? 'border-t border-white/[0.04]' : ''
                            } ${activeBrush
                              ? 'bg-white/10 font-medium text-white'
                              : 'text-[#8e8e93] hover:bg-white/[0.04] hover:text-white'
                            }`}
                        >
                          <span className="capitalize">{name}</span>
                          <span className="flex items-center gap-1.5">
                            <span
                              className="h-3 w-3 rounded-md ring-1 ring-black/20"
                              style={{ backgroundColor: swatch.background }}
                            />
                            <span
                              className="h-3 w-3 rounded-md ring-1 ring-black/20"
                              style={{ backgroundColor: swatch.color }}
                            />
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-[10px] text-[#8e8e93]">no color palette loaded.</div>
                )}
              </div>
            </div>
          )}

          {tab === 'colorways' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium tracking-wide text-[#8e8e93] px-0.5">
                  color presets
                </label>
                <div className="space-y-1">
                  {schemes.map((s) => {
                    const activeItem = scheme === s.id

                    return (
                      <button
                        key={s.id}
                        onClick={() => apply(s)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-[11px] transition ${activeItem
                            ? 'bg-white/10 font-medium text-white ring-1 ring-white/[0.08]'
                            : 'bg-[#141416] text-[#8e8e93] ring-1 ring-white/[0.04] hover:bg-[#1a1a1e] hover:text-white'
                          }`}
                      >
                        <span>{s.label}</span>
                        {activeItem && (
                          <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-white">
                            <FaCheck className="h-2 w-2" />
                            active
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                <label className="text-[10px] font-medium tracking-wide text-[#8e8e93] px-0.5">
                  create custom palette
                </label>

                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="palette name..."
                  className="h-8 w-full rounded-xl bg-[#141416] px-3 text-[11px] text-white/95 ring-1 ring-white/[0.06] outline-none transition focus:bg-[#1a1a1e] focus:ring-white/25"
                />

                <div className="divide-y divide-white/[0.04] overflow-hidden rounded-2xl bg-[#141416] ring-1 ring-white/[0.06]">
                  {[
                    ['base', baseBg, baseFg, setBaseBg, setBaseFg],
                    ['mods', modsBg, modsFg, setModsBg, setModsFg],
                    ['accent', accentBg, accentFg, setAccentBg, setAccentFg]
                  ].map(([label, bg, fg, setBg, setFg]) => (
                    <div key={label as string} className="flex h-9 items-center justify-between px-3">
                      <span className="text-[11px] text-[#8e8e93]">{label as string}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-lg ring-1 ring-white/[0.04]">
                          <span className="text-[9px] text-[#8e8e93] font-mono">bg</span>
                          <input
                            type="color"
                            value={bg as string}
                            onChange={(e) => (setBg as (v: string) => void)(e.target.value)}
                            className="h-4 w-4 cursor-pointer appearance-none rounded-md border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-lg ring-1 ring-white/[0.04]">
                          <span className="text-[9px] text-[#8e8e93] font-mono">fg</span>
                          <input
                            type="color"
                            value={fg as string}
                            onChange={(e) => (setFg as (v: string) => void)(e.target.value)}
                            className="h-4 w-4 cursor-pointer appearance-none rounded-md border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={create}
                  className="w-full rounded-xl bg-white/10 py-2 text-[11px] font-medium text-white ring-1 ring-white/[0.08] transition hover:bg-white/20 active:scale-[0.98]"
                >
                  save palette
                </button>
              </div>
            </div>
          )}

          {tab === 'boards' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-medium tracking-wide text-[#8e8e93] px-0.5">
                  import layout
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
                  className={`flex items-center gap-1 rounded-xl bg-[#141416] p-1 ring-1 transition ${drag ? 'ring-white/20' : err ? 'ring-red-500/40' : 'ring-white/[0.06]'
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
                    placeholder="paste json or drop .keykap file..."
                    className="h-7 min-w-0 flex-1 bg-transparent px-2 text-[11px] text-white/95 outline-none placeholder:text-[#8e8e93]"
                  />

                  <button
                    onClick={() => proc(json)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8e8e93] transition hover:bg-white/10 hover:text-white shrink-0"
                    title="import"
                  >
                    <FaArrowRight className="h-3 w-3" />
                  </button>

                  <button
                    onClick={() => ref.current?.click()}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8e8e93] transition hover:bg-white/10 hover:text-white shrink-0"
                    title="choose file"
                  >
                    <FaFileCode className="h-3 w-3" />
                  </button>

                  <input
                    ref={ref}
                    type="file"
                    accept=".json,.keykap,application/json"
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      read(e.target.files?.[0])
                    }
                    className="hidden"
                  />
                </div>

                {err && (
                  <div className="px-0.5 text-[10px] text-red-400 font-medium">
                    invalid format
                  </div>
                )}
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-[10px] font-medium tracking-wide text-[#8e8e93] px-0.5">
                  saved layouts
                </label>

                <div className="space-y-1">
                  {boards.length === 0 ? (
                    <div className="py-3 text-center text-[10px] text-[#8e8e93]">
                      no layouts found.
                    </div>
                  ) : (
                    boards.map((b) => {
                      const activeItem = active === b.id

                      return (
                        <div
                          key={b.id}
                          className={`group flex items-center gap-2 rounded-xl px-2.5 py-2 ring-1 transition ${activeItem
                              ? 'bg-white/10 ring-white/[0.08]'
                              : 'bg-[#141416] ring-white/[0.04] hover:bg-[#1a1a1e]'
                            }`}
                        >
                          <input
                            type="text"
                            value={b.name}
                            onChange={(e) => rename(b.id, e.target.value)}
                            className="min-w-0 flex-1 bg-transparent px-1 text-[11px] text-white/95 outline-none"
                          />

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => open(b.id)}
                              className={`rounded-lg px-2.5 py-1 text-[10px] font-medium transition ${activeItem
                                  ? 'bg-white/20 text-white'
                                  : 'text-[#8e8e93] hover:bg-white/10 hover:text-white'
                                }`}
                            >
                              {activeItem ? 'loaded' : 'load'}
                            </button>

                            <button
                              onClick={() => exportFile(b.id)}
                              className="flex h-6 w-6 items-center justify-center rounded-lg text-[#8e8e93] transition hover:bg-white/10 hover:text-white"
                              title="export keykap"
                            >
                              <FaDownload className="h-2.5 w-2.5" />
                            </button>
                          </div>

                          <button
                            onClick={() => drop(b.id)}
                            className="flex h-6 w-6 items-center justify-center rounded-lg text-[#8e8e93] transition hover:bg-red-500/10 hover:text-red-400"
                            title="delete layout"
                          >
                            <FaTrash className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        <footer className="flex h-11 items-center justify-between border-t border-white/[0.06] px-5">
          <span className="text-[10px] text-[#8e8e93]">made with love by ary</span>
        </footer>
      </aside>
    </>
  )
}