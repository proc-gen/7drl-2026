import type { Component } from './component'

export const BlindComponent: Component<Blind> = {
  values: [] as Blind[],
}

export type Blind = {
  turnsLeft: number
}
