import type { Component } from './component'

export const PlayerComponent: Component<Player> = {
  values: [] as Player[],
}

export type Player = {
  levelUpBase: number
  currentLevel: number
  currentXp: number
  levelUpFactor: number
  experienceToNextLevel: number
}
