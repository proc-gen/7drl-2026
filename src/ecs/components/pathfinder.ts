import type { Vector2 } from '../../types'
import type { Component } from './component'

export const PathfinderComponent: Component<Pathfinder> = {
  values: [] as Pathfinder[],
}

export type Pathfinder = {
  lastKnownTargetPosition?: Vector2
}
