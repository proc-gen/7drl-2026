import {
  addComponent,
  hasComponent,
  query,
  type EntityId,
  type World,
} from 'bitecs'
import type { MessageLog } from '../../../utils/message-log'
import type { UpdateSystem } from './update-system'
import {
  BlindComponent,
  CauseEffectComponent,
  DeadComponent,
  FieldOfViewComponent,
  RemoveComponent,
  WantCauseEffectComponent,
  type CauseEffect,
  type WantCauseEffect,
} from '../../components'

export class UpdateWantCauseEffectSystem implements UpdateSystem {
  log: MessageLog

  constructor(log: MessageLog) {
    this.log = log
  }

  update(world: World, _entity: EntityId) {
    for (const eid of query(world, [WantCauseEffectComponent])) {
      const effect = WantCauseEffectComponent.values[eid]
      if (!hasComponent(world, effect.defender, DeadComponent)) {
        const causeEffect = CauseEffectComponent.values[effect.effectItem]

        if (causeEffect.effectName === 'Blind') {
          this.processBlind(world, effect, causeEffect)
        }
      }
      addComponent(world, eid, RemoveComponent)
    }
  }

  processBlind(
    world: World,
    effect: WantCauseEffect,
    causeEffect: CauseEffect,
  ) {

    if (hasComponent(world, effect.defender, BlindComponent)) {
      const defenderBlind = BlindComponent.values[effect.defender]
      defenderBlind.turnsLeft = causeEffect.effectTurns
    } else {
      addComponent(world, effect.defender, BlindComponent)
      BlindComponent.values[effect.defender] = { turnsLeft: causeEffect.effectTurns }
    }

    const fov = FieldOfViewComponent.values[effect.defender]
    fov.currentFOV = Math.floor(0.1 * fov.baseFOV) 
  }
}
