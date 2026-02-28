import { addComponents, addEntity, type World } from 'bitecs'
import type { Vector2 } from '../../types'
import {
  LightComponent,
  PositionComponent,
} from '../components'
import { type LightType } from '../../constants'

export const createLight = (
  world: World,
  position: Vector2,
  lightType: LightType,
  color: string,
  intensity: number,
  target: Vector2 | undefined = undefined,
) => {
  const light = addEntity(world)

  addComponents(
    world,
    light,
    LightComponent,
    PositionComponent,
  )
  PositionComponent.values[light] = { ...position }
  LightComponent.values[light] = {
    lightType,
    intensity,
    target,
    color,
    blockable: true,
  }

  return light
}
