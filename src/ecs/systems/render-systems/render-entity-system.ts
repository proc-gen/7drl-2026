import { hasComponent, query, type World } from 'bitecs'
import { type RenderSystem } from './'
import {
  DeadComponent,
  PositionComponent,
  RenderableComponent,
  RenderOrder,
  type Position,
} from '../../components'
import { Display } from 'rot-js'
import type { Vector2 } from '../../../types'
import { DisplayValues } from '../../../constants/display-values'
import type { Map } from '../../../map'
import { MixColors } from '../../../utils/color-funcs'

export class RenderEntitySystem implements RenderSystem {
  world: World
  map: Map
  playerFOV: Vector2[]

  constructor(world: World, map: Map, playerFOV: Vector2[]) {
    this.world = world
    this.map = map
    this.playerFOV = playerFOV
  }

  render(display: Display, playerPosition: Position) {
    const xOffset = DisplayValues.HalfWidth - playerPosition.x
    const yOffset = DisplayValues.HalfHeight - playerPosition.y

    RenderOrder.forEach((layerComponent) => {
      for (const eid of query(this.world, [
        PositionComponent,
        RenderableComponent,
        layerComponent,
      ])) {
        const position = PositionComponent.values[eid]
        const renderable = RenderableComponent.values[eid]
        const tile = this.map.tiles[position.x][position.y]

        if (
          (tile.seen && tile.char.length === 0 && renderable.alwaysShow) ||
          (!hasComponent(this.world, eid, DeadComponent) &&
            this.playerFOV.find(
              (a) => a.x === position.x && a.y === position.y,
            ) !== undefined)
        ) {
          const fg =
            renderable.fg !== null
              ? MixColors(renderable.fg, tile.lighting)
              : null
          const bg =
            renderable.bg !== null
              ? MixColors(renderable.bg, tile.lighting)
              : null
          display.drawOver(
            position.x + xOffset,
            position.y + yOffset,
            renderable.char,
            fg,
            bg,
          )
        }
      }
    })
  }
}
