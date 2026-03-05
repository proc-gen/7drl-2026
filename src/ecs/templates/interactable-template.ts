import { addComponents, addEntity, type World } from 'bitecs'
import type { Vector2 } from '../../types'
import {
  Colors,
  InteractableTypes,
  type InteractableType,
} from '../../constants'
import {
  BlockerComponent,
  InfoComponent,
  InteractableComponent,
  PositionComponent,
  RenderableComponent,
  RenderLayerBlockerComponent,
} from '../components'

export const createInteractable = (
  world: World,
  position: Vector2,
  interactableType: InteractableType,
) => {
  const interactableInfo = getInteractableInfo(interactableType)
  if (interactableInfo !== undefined) {
    const interactable = addEntity(world)

    addComponents(
      world,
      interactable,
      InfoComponent,
      BlockerComponent,
      PositionComponent,
      RenderableComponent,
      RenderLayerBlockerComponent,
      InteractableComponent,
    )

    PositionComponent.values[interactable] = { ...position }
    InteractableComponent.values[interactable] = {
      interactableType,
      used: false,
    }
    RenderableComponent.values[interactable] = {
      char: interactableInfo.char,
      fg: Colors.InteractableUnused,
      bg: Colors.InteractableBackground,
      alwaysShow: true,
    }
    InfoComponent.values[interactable] = {
      name: interactableInfo.name,
      description: interactableInfo.description,
    }

    return interactable
  }

  return undefined
}

const getInteractableInfo = (interactableType: InteractableType) => {
  switch (interactableType) {
    case InteractableTypes.SecurityCrate:
      return {
        char: 'S',
        name: 'Security Crate',
        description: 'Get some supplies for the journey ahead',
      }
    case InteractableTypes.EnergyStation:
      return {
        char: 'e',
        name: 'Energy Station',
        description: 'Replenish up to 50 energy',
      }
    case InteractableTypes.RandomCrate:
      return {
        char: '?',
        name: 'Crate of Fortune',
        description:
          'It could give you all your worldly desires, or it could take away everyhing you hold dear. Use at your own risk!',
      }
    case InteractableTypes.LockdownSwitch:
      return {
        char: '!',
        name: 'Lockdown Switch',
        description:'The switch to turn off the alarm and unlock the facility'
      }
  }

  return undefined
}
