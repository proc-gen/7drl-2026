import { type EntityId, type World } from 'bitecs'

export interface UpdateSystem {
  update(world: World, entity: EntityId): void
}
