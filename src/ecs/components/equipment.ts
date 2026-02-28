import type { EntityId } from 'bitecs'
import type { Component } from './component'

export const EquipmentComponent: Component<Equipment> = {
  values: [] as Equipment[],
}

export type Equipment = {
  armor: EntityId
  weapon: EntityId
}
