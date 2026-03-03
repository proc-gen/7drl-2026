import {
  hasComponent,
  Not,
  query,
  removeEntity,
  type EntityId,
  type World,
} from 'bitecs'
import type { UpdateSystem } from './update-system'
import {
  AnimationComponent,
  DeadComponent,
  InfoComponent,
  OwnerComponent,
  PositionComponent,
  RemoveComponent,
} from '../../components'
import { createActor, createCorpse } from '../../templates'
import type { Map } from '../../../map'
import { getRandomNumber } from '../../../utils/random'
import type { MessageLog } from '../../../utils/message-log'

export class UpdateRemoveSystem implements UpdateSystem {
  map: Map
  log: MessageLog

  constructor(map: Map, log: MessageLog) {
    this.map = map
    this.log = log
  }

  update(world: World, _entity: EntityId) {
    for (const eid of query(world, [
      RemoveComponent,
      Not(AnimationComponent),
    ])) {
      if (hasComponent(world, eid, DeadComponent)) {
        const name = InfoComponent.values[eid].name

        const position = { ...PositionComponent.values[eid] }
        if (name !== 'Exploding Spider') {
          const corpse = createCorpse(world, position, name)
          this.map.addEntityAtLocation(corpse, position)
        }
        this.map.removeEntityAtLocation(eid, position)

        if (name === 'Cyborg') {
          const chance = getRandomNumber(0, 100)
          if (chance < 25) {
            const newEnemy = createActor(world, position, 'Damaged Cyborg')!
            this.map.addEntityAtLocation(newEnemy, position)
          }
        }

        for (const ownedEid of query(world, [OwnerComponent])) {
          if (OwnerComponent.values[ownedEid].owner === eid) {
            if (name === 'Pickpocket Bot') {
              OwnerComponent.values[ownedEid].owner =
                OwnerComponent.values[ownedEid].origOwner!
            } else {
              removeEntity(world, ownedEid)
            }
          }
        }

        if (name === 'Pickpocket Bot') {
          this.log.addMessage(
            `The death of ${name} has returned all stolen items!`,
          )
        }
      }

      removeEntity(world, eid)
    }
  }
}
