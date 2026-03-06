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
  PlayerComponent,
} from '../../components'
import type { MessageLog } from '../../../utils/message-log'
import type { Vector2 } from '../../../types'
import { processPlayerFOV } from '../../../utils/fov-funcs'
import type { Map } from '../../../map'

export class UpdateTurnsLeftSystem implements UpdateSystem {
  log: MessageLog
  map: Map
  playerFOV: Vector2[]

  constructor(log: MessageLog, map: Map, playerFOV: Vector2[]) {
    this.log = log
    this.map = map
    this.playerFOV = playerFOV
  }

  update(world: World, entity: EntityId) {
    if (hasComponent(world, entity, BlindComponent)) {
      const blind = BlindComponent.values[entity]
      const fov = FieldOfViewComponent.values[entity]

      fov.currentFOV = Math.min(1.5 * fov.currentFOV, fov.baseFOV)
      blind.turnsLeft--

      if (hasComponent(world, entity, PlayerComponent)) {
        processPlayerFOV(this.map, entity, this.playerFOV)
      }

      if (blind.turnsLeft === 0) {
        fov.currentFOV = fov.baseFOV
        removeComponent(world, entity, BlindComponent)
      }
    }
  }
}
