import type { AmmunitionType } from '../../constants'
import type { Component } from './component'

export const AmmunitionComponent: Component<Ammunition> = {
  values: [] as Ammunition[],
}

export type Ammunition = {
  projectileCount: number
  ammunitionType: AmmunitionType
}
