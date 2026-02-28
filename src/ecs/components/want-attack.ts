import type { EntityId } from 'bitecs'
import type { Component } from './component'
import type { AttackType } from '../../constants/attack-type'

export const WantAttackComponent: Component<WantAttack> = {
  values: [] as WantAttack[],
}

export type WantAttack = {
  attackType: AttackType
  attacker: EntityId
  defender: EntityId
  itemUsed?: EntityId
}
