import { Board } from './scene/board'
import { Upload } from './ui/upload'

export function App() {
  return (
    <div className="flex h-screen flex-col bg-neutral-950">
      <Upload />
      <div className="flex-1">
        <Board />
      </div>
    </div>
  )
}

export default App