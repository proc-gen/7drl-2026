import { type World } from 'bitecs'
import { Display } from 'rot-js'
import type { Position } from '../../components'

export interface RenderSystem {
  world: World

  render(display: Display, playerPosition: Position): void
}
