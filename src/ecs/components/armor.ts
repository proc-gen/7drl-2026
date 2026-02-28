import type { Component } from './component'

export const ArmorComponent: Component<Armor> = {
  values: [] as Armor[],
}

export type Armor = {
  defense: number
}
