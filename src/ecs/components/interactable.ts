import type { InteractableType } from '../../constants'
import type { Component } from './component'

export const InteractableComponent: Component<Interactable> = {
  values: [] as Interactable[],
}

export type Interactable = {
    interactableType: InteractableType
    used: boolean
}
