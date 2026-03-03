import type { PersonalityType } from '../../constants'
import type { Component } from './component'

export const ActorComponent: Component<Actor> = {
  values: [] as Actor[],
}

export type Actor = {
  personality: PersonalityType
}
