import type { Saved } from '../store/board'

export function dump(board: Saved): string {
  return JSON.stringify(board, null, 2)
}