import { query, removeEntity, type EntityId, type World } from 'bitecs'
import type { UpdateSystem } from './update-system'
import {
  AnimationComponent,
  PositionComponent,
  RemoveComponent,
} from '../../components'
import { createAnimation } from '../../templates'
import type { Map } from '../../../map'

export class UpdateRemoveAnimationSystem implements UpdateSystem {
  map: Map

  constructor(map: Map) {
    this.map = map
  }

  update(world: World, _entity: EntityId) {
    for (const eid of query(world, [AnimationComponent, RemoveComponent])) {
      const animation = AnimationComponent.values[eid]
      if (animation.nextAnimation !== undefined) {
        createAnimation(
          world,
          this.map,
          eid,
          PositionComponent.values[eid],
          animation.nextAnimation,
          animation.nextSubAnimation,
        )
      }

      removeEntity(world, eid)
    }
  }
}
