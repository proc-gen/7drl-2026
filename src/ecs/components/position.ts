import type { Component } from './component'

export const PositionComponent: Component<Position> = {
  values: [] as Position[],
}

export type Position = {
  x: number
  y: number
}
