import {
  hasComponent,
  removeComponent,
  type EntityId,
  type World,
} from 'bitecs'
import type { UpdateSystem } from './update-system'
import { ConfusionComponent, InfoComponent } from '../../components'
import type { MessageLog } from '../../../utils/message-log'

export class UpdateTurnsLeftSystem implements UpdateSystem {
  log: MessageLog

  constructor(log: MessageLog) {
    this.log = log
  }

  update(world: World, entity: EntityId) {
    if (hasComponent(world, entity, ConfusionComponent)) {
      const confusion = ConfusionComponent.values[entity]
      confusion.turnsLeft--
      if (confusion.turnsLeft === 0) {
        const info = InfoComponent.values[entity]
        this.log.addMessage(`The ${info.name} is no longer confused`)

        removeComponent(world, entity, ConfusionComponent)
      }
    }
  }
}
