import { addComponents, addEntity, type World } from 'bitecs'
import type { Vector2 } from '../../types'
import {
  InfoComponent,
  PositionComponent,
  RenderableComponent,
  RenderLayerGroundComponent,
} from '../components'
import { Colors } from '../../constants'

export const createCorpse = (world: World, position: Vector2, name: string) => {
  const corpse = addEntity(world)

  addComponents(
    world,
    corpse,
    InfoComponent,
    PositionComponent,
    RenderableComponent,
    RenderLayerGroundComponent,
  )

  InfoComponent.values[corpse] = { name: `Corpse of ${name}` }
  PositionComponent.values[corpse] = { ...position }
  RenderableComponent.values[corpse] = {
    char: '%',
    fg: Colors.LightGrey,
    bg: Colors.DarkRed,
  }

  return corpse
}
