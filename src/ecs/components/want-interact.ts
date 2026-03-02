import type { EntityId } from 'bitecs'
import type { Component } from './component'

export const WantInteractComponent: Component<WantInteract> = {
  values: [] as WantInteract[],
}

export type WantInteract = {
  user: EntityId
  interactable: EntityId
}
