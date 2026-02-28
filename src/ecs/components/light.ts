import type { LightType } from '../../constants/light-type'
import type { Vector2 } from '../../types'
import type { Component } from './component'

export const LightComponent: Component<Light> = {
  values: [] as Light[],
}

export type Light = {
    lightType: LightType
    target?: Vector2
    color: string
    intensity: number
    blockable: boolean
}
