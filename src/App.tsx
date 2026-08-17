import { Board } from './scene/board'
import { Upload } from './ui/upload'
import './App.css'

export function App() {
  return (
    <div className="app">
      <Upload />
      <div className="stage">
        <Board />
      </div>
    </div>
  )
}

export default App