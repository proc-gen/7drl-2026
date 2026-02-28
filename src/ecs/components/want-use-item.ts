import type { EntityId } from 'bitecs'
import type { Component } from './component'
import type { ItemActionType } from '../../constants'

export const WantUseItemComponent: Component<WantUseItem> = {
  values: [] as WantUseItem[],
}

export type WantUseItem = {
  owner: EntityId
  item: EntityId
  itemActionType?: ItemActionType
}
