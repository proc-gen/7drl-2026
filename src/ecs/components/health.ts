import type { Component } from './component'

export const HealthComponent: Component<Health> = {
  values: [] as Health[],
}

export type Health = {
  current: number
  max: number
}
