import type { Component } from './component'

export const EquippableComponent: Component<Equippable> = {
  values: [] as Equippable[],
}

export type Equippable = {
  equipped: boolean
}
