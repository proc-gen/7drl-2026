import type { Component } from './component'

export const ConfusionComponent: Component<Confusion> = {
  values: [] as Confusion[],
}

export type Confusion = {
  turnsLeft: number
}
