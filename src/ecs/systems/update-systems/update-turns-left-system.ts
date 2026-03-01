import {
  hasComponent,
  removeComponent,
  type EntityId,
  type World,
} from 'bitecs'
import type { UpdateSystem } from './update-system'
import {
  BlindComponent,
  FieldOfViewComponent,
} from '../../components'
import type { MessageLog } from '../../../utils/message-log'

export class UpdateTurnsLeftSystem implements UpdateSystem {
  log: MessageLog

  constructor(log: MessageLog) {
    this.log = log
  }

  update(world: World, entity: EntityId) {
    if (hasComponent(world, entity, BlindComponent)) {
      const blind = BlindComponent.values[entity]
      const fov = FieldOfViewComponent.values[entity]

      fov.currentFOV = Math.min(1.5 * fov.currentFOV, fov.baseFOV)
      blind.turnsLeft--

      if (blind.turnsLeft === 0) {
        fov.currentFOV = fov.baseFOV
        removeComponent(world, entity, BlindComponent)
      }
    }
  }
}
