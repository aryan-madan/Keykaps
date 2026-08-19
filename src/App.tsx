import { Board } from './scene/board'
import { Side } from './ui/side'
import { useBoard } from './store/board'

export function App() {
  const background = useBoard((state) => state.background)

  return (
    <div 
      className="flex h-screen flex-col relative overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: background }}
    >
      <Side />
      <div className="flex-1">
        <Board />
      </div>
    </div>
  )
}

export default App