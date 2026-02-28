import type { EntityId } from 'bitecs'
import type { Component } from './component'
import type { ItemActionType } from '../../constants/item-action-type'

export const ActionComponent: Component<Action> = {
  values: [] as Action[],
}

export type Action = {
  processed: boolean
  xOffset: number
  yOffset: number
  useItem: EntityId | undefined
  itemActionType: ItemActionType | undefined
  pickUpItem: boolean
  actionSuccessful: boolean
}
