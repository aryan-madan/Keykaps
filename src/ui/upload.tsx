import { useState, useRef, ChangeEvent, DragEvent } from 'react'
import { parse } from '../parse/kle'
import { useBoard } from '../store/board'

export function Upload() {
  const [text, setText] = useState('')
  const [err, setErr] = useState(false)
  const [drag, setDrag] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  const load = useBoard((state) => state.load)

  function process(raw: string) {
    if (!raw.trim()) return
    try {
      load(parse(raw))
      setErr(false)
    } catch {
      setErr(true)
    }
  }

  function read(file?: File) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (content) {
        setText(content)
        process(content)
      }
    }
    reader.readAsText(file)
  }

  function drop(e: DragEvent) {
    e.preventDefault()
    setDrag(false)
    read(e.dataTransfer.files?.[0])
  }

  return (
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-50">
      <div
        onDrop={drop}
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        style={{ fontFamily: 'Cherry, sans-serif' }}
        className={`flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-t-2xl border-t border-x backdrop-blur-md shadow-2xl transition-all ${
          drag
            ? 'border-neutral-400 bg-neutral-900/95'
            : err
            ? 'border-red-500/60 bg-neutral-900/90'
            : 'border-neutral-800/80 bg-neutral-900/85'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setErr(false)
            }}
            onKeyDown={(e) => e.key === 'Enter' && process(text)}
            placeholder="paste json or drop file..."
            className="w-48 bg-neutral-950/80 px-3 py-1.5 text-xs rounded-lg border border-neutral-800/80 outline-none text-neutral-100 placeholder:text-neutral-500 transition-all focus:border-neutral-600 focus:bg-neutral-950"
          />
          <button
            onClick={() => process(text)}
            className="px-3 py-1.5 bg-neutral-100 text-neutral-950 text-xs font-medium rounded-lg hover:bg-white transition-all shadow-sm active:scale-95"
          >
            load
          </button>
          <button
            onClick={() => ref.current?.click()}
            className="px-3 py-1.5 bg-neutral-800/90 border border-neutral-700/80 text-neutral-200 text-xs rounded-lg hover:bg-neutral-700 transition-all shadow-sm active:scale-95"
          >
            file
          </button>
          <input
            ref={ref}
            type="file"
            accept=".json,application/json"
            onChange={(e: ChangeEvent<HTMLInputElement>) => read(e.target.files?.[0])}
            className="hidden"
          />
        </div>

        {err && (
          <span className="text-[10px] text-red-400 animate-pulse">
            invalid kle json format
          </span>
        )}
      </div>
    </div>
  )
}