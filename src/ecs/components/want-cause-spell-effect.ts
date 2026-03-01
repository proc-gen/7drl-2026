import type { EntityId } from 'bitecs'
import type { Component } from './component'

export const WantCauseEffectComponent: Component<WantCauseSpellEffect> = {
  values: [] as WantCauseSpellEffect[],
}

export type WantCauseSpellEffect = {
  attacker: EntityId
  defender: EntityId
  effectItem: EntityId
}
