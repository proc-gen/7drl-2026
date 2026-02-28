import type { Component } from './component'

export const ActorComponent: Component<Actor> = {
  values: [] as Actor[],
}

export type Actor = {
  hostile: boolean
}
