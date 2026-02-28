import type { Display } from 'rot-js'
import type { Vector2 } from '../types'

export interface RenderWindow {
  windowPosition: Vector2
  windowDimension: Vector2

  render(display: Display): void
}
