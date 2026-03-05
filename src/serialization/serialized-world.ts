import type { EntityId } from 'bitecs'
import type { MapTrigger, Tile } from '../map'
import type { GameStats, Message, Vector2 } from '../types'

export type SerializedWorld = {
  width: number
  height: number
  level: number
  gameStats: GameStats
  messages: Message[]
  tiles: Tile[][]
  mapTriggers: MapTrigger[]
  exitPosition: Vector2
  serializedEntities: SerializedEntity[]
}

export type SerializedEntity = {
  savedId: EntityId
  loadedId?: EntityId
  components: SerializedComponent[]
}

export type SerializedComponent = {
  componentType: string
  data: any
}
