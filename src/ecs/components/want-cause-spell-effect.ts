import type { EntityId } from 'bitecs'
import type { Component } from './component'

export const WantCauseEffectComponent: Component<WantCauseEffect> = {
  values: [] as WantCauseEffect[],
}

export type WantCauseEffect = {
  attacker: EntityId
  defender: EntityId
  effectItem: EntityId
}
