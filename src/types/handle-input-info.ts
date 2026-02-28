import type { EntityId } from 'bitecs'

export type HandleInputInfo = {
  needUpdate: boolean
  needTargeting?: EntityId
  finishTurn?: boolean
}
