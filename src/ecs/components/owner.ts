import type { EntityId } from 'bitecs'
import type { Component } from './component'

export const OwnerComponent: Component<Owner> = {
  values: [] as Owner[],
}

export type Owner = {
  owner: EntityId
}
