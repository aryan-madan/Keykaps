import { useState } from 'react'
import { parse } from '../parse/kle'
import { useBoard } from '../store/board'

export function Upload() {
  const [text, setText] = useState('')
  const load = useBoard((state) => state.load)
  function submit() {
    try {
      load(parse(text))
    } catch {
      console.error('invalid layout')
    }
  }
  return (
    <div className="flex gap-2 p-3">
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="paste kle json"
        className="h-16 flex-1 resize-none rounded border border-neutral-700 bg-neutral-900 p-2 text-sm text-neutral-100"
      />
      <button
        onClick={submit}
        className="rounded border border-neutral-700 bg-neutral-800 px-4 text-sm text-neutral-100 hover:bg-neutral-700"
      >
        load
      </button>
    </div>
  )
}