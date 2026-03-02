import { addComponents, addEntity, type World } from 'bitecs'
import type { Vector2 } from '../../types'
import {
  InfoComponent,
  InteractableComponent,
  PositionComponent,
  RenderableComponent,
  RenderLayerGroundComponent,
} from '../components'
import {
  Colors,
  InteractableTypes,
  type InteractableType,
} from '../../constants'
import { getRandomNumber } from '../../utils/random'

export const createCorpse = (world: World, position: Vector2, name: string) => {
  const corpse = addEntity(world)

  addComponents(
    world,
    corpse,
    InfoComponent,
    PositionComponent,
    RenderableComponent,
    RenderLayerGroundComponent,
    InteractableComponent,
  )

  const interactableType =
    getRandomNumber(0, 100) % 2 === 0
      ? InteractableTypes.EnergyRemnants
      : InteractableTypes.ShieldRemnants

  InfoComponent.values[corpse] = { name: `${interactableType} of ${name}` }
  PositionComponent.values[corpse] = { ...position }

  RenderableComponent.values[corpse] = {
    char: '%',
    fg:
      interactableType === InteractableTypes.EnergyRemnants
        ? Colors.EnergyBar
        : Colors.ShieldBar,
    bg: Colors.Black,
  }

  InteractableComponent.values[corpse] = {
    interactableType: interactableType as InteractableType,
    used: false,
  }

  return corpse
}
