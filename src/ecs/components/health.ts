import type { Component } from './component'

export const SuitStatsComponent: Component<SuitStats> = {
  values: [] as SuitStats[],
}

export type SuitStats = {
  currentShield: number
  maxShield: number
  currentEnergy: number
  maxEnergy: number
}
