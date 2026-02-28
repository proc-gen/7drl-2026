import { addComponents, addEntity, type World } from 'bitecs'
import type { Vector2 } from '../../types'
import {
  LightComponent,
  PositionComponent,
  RenderableComponent,
  RenderLayerGroundComponent,
} from '../components'
import { AddColors } from '../../utils/color-funcs'
import { type LightType, Colors } from '../../constants'

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
    RenderableComponent,
    RenderLayerGroundComponent,
  )
  PositionComponent.values[light] = { ...position }
  LightComponent.values[light] = {
    lightType,
    intensity,
    target,
    color,
    blockable: true,
  }
  RenderableComponent.values[light] = {
    char: 'Θ',
    fg: AddColors(color, Colors.Ambient),
    bg: null,
    alwaysShow: true
  }

  return light
}
