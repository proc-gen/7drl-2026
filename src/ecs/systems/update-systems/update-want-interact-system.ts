import { addComponent, query, type EntityId, type World } from 'bitecs'
import type { Map } from '../../../map'
import type { GameStats } from '../../../types'
import type { MessageLog } from '../../../utils/message-log'
import type { UpdateSystem } from './update-system'
import {
  ActionComponent,
  InfoComponent,
  InteractableComponent,
  RemoveComponent,
  SuitStatsComponent,
  WantInteractComponent,
  type Info,
  type Interactable,
  type WantInteract,
} from '../../components'
import { InteractableTypes } from '../../../constants'

export class UpdateWantInteractSystem implements UpdateSystem {
  log: MessageLog
  map: Map
  gameStats: GameStats

  constructor(log: MessageLog, map: Map, gameStats: GameStats) {
    this.log = log
    this.map = map
    this.gameStats = gameStats
  }

  update(world: World, _entity: EntityId) {
    for (const eid of query(world, [WantInteractComponent])) {
      const wantInteract = WantInteractComponent.values[eid]
      const interactable =
        InteractableComponent.values[wantInteract.interactable]
      const interactableInfo = InfoComponent.values[wantInteract.interactable]
      if (!interactable.used) {
        switch (interactable.interactableType) {
          case InteractableTypes.SecurityCrate:
            this.useSecurityCrate(wantInteract, interactable, interactableInfo)
            break
          case InteractableTypes.EnergyStation:
            this.useEnergyStation(wantInteract, interactable, interactableInfo)
            break
          case InteractableTypes.RandomCrate:
            this.useRandomCrate(wantInteract, interactable, interactableInfo)
            break
        }
      } else {
        this.actionError(
          wantInteract.user,
          `${interactableInfo.name} has already been used`,
        )
      }

      addComponent(world, eid, RemoveComponent)
    }
  }

  useSecurityCrate(
    wantInteract: WantInteract,
    interactable: Interactable,
    info: Info,
  ) {
    interactable.used = true
  }

  useEnergyStation(
    wantInteract: WantInteract,
    interactable: Interactable,
    info: Info,
  ) {
    const suit = SuitStatsComponent.values[wantInteract.user]
    const value = Math.min(50, suit.maxEnergy - suit.currentEnergy)
    if (value > 0) {
      suit.currentEnergy += value
      interactable.used = true
      this.actionSuccess(`You recharged ${value} energy at the ${info.name}`)
    } else {
      this.actionError(wantInteract.user, `You're already full on energy`)
    }
  }

  useRandomCrate(
    wantInteract: WantInteract,
    interactable: Interactable,
    info: Info,
  ) {
    interactable.used = true
    this.actionSuccess(`You used the ${info.name}`)
  }

  actionSuccess(message: string) {
    if (message.length > 0) {
      this.log.addMessage(message)
    }
  }

  actionError(owner: EntityId, error: string) {
    this.log.addMessage(error)
    const action = ActionComponent.values[owner]
    action.actionSuccessful = false
  }
}
