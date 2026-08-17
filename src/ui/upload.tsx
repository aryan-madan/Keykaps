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
    <div className="upload">
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="paste kle json"
      />
      <button onClick={submit}>load</button>
    </div>
  )
}