import { useEffect } from 'react'
import { useBoard } from '../store/board'

export function Editor() {
  const keys = useBoard((state) => state.keys)
  const selected = useBoard((state) => state.selected)
  const paint = useBoard((state) => state.paint)
  const shell = useBoard((state) => state.shell)
  const tone = useBoard((state) => state.case)
  const dirty = useBoard((state) => state.dirty)
  const commit = useBoard((state) => state.commit)
  const item = keys.find((k) => k.id === selected)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (dirty) {
          commit(keys)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dirty, keys, commit])

  return (
    <div className="absolute top-4 right-4 z-50 flex flex-col items-end gap-2">
      {dirty && (
        <button
          onClick={() => commit(keys)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-neutral-800/80 bg-neutral-900/85 backdrop-blur-md shadow-xl text-[10px] text-neutral-300 hover:text-neutral-100 font-medium transition-all"
          style={{ fontFamily: 'Cherry, sans-serif' }}
        >
          <span>unsaved changes</span>
          <kbd className="inline-flex items-center gap-0.5 text-[9px] text-neutral-500">
            <span>⌘</span>S
          </kbd>
        </button>
      )}
      <div className="flex flex-col gap-2.5 p-4 rounded-2xl border border-neutral-800/80 bg-neutral-900/85 backdrop-blur-md shadow-2xl" style={{ fontFamily: 'Cherry, sans-serif' }}>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-neutral-400">case</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={tone}
              onChange={(e) => shell(e.target.value)}
              className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border border-neutral-700"
            />
            <span className="text-xs text-neutral-200">{tone}</span>
          </div>
        </div>

        {item && (
          <div className="flex flex-col gap-1 pt-2 border-t border-neutral-800">
            <span className="text-[10px] text-neutral-400">key {item.legend || 'blank'}</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={item.color}
                onChange={(e) => paint(item.id, e.target.value, item.textColor)}
                className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border border-neutral-700"
              />
              <span className="text-xs text-neutral-200">{item.color}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}