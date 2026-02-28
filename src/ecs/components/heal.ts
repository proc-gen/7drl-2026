import type { Component } from './component'

export const HealComponent: Component<Heal> = {
  values: [] as Heal[],
}

export type Heal = {
  amount: number
}
