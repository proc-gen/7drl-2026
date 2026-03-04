import {
  addComponent,
  hasComponent,
  query,
  type EntityId,
  type World,
} from 'bitecs'
import type { Map } from '../../../map'
import type { GameStats, Vector2 } from '../../../types'
import type { MessageLog } from '../../../utils/message-log'
import type { UpdateSystem } from './update-system'
import {
  ActionComponent,
  ActorComponent,
  InfoComponent,
  InteractableComponent,
  ItemComponent,
  OwnerComponent,
  PositionComponent,
  RemoveComponent,
  RenderableComponent,
  SuitStatsComponent,
  WantInteractComponent,
  type Info,
  type Interactable,
  type WantInteract,
} from '../../components'
import { Colors, InteractableTypes, PersonalityTypes } from '../../../constants'
import { getRandomNumber } from '../../../utils/random'
import { createAnimation, createItem } from '../../templates'
import { equal } from '../../../utils/vector-2-funcs'

export class UpdateWantInteractSystem implements UpdateSystem {
  log: MessageLog
  map: Map
  gameStats: GameStats
  playerFOV: Vector2[]

  constructor(
    log: MessageLog,
    map: Map,
    gameStats: GameStats,
    playerFOV: Vector2[],
  ) {
    this.log = log
    this.map = map
    this.gameStats = gameStats
    this.playerFOV = playerFOV
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
            this.useSecurityCrate(
              world,
              wantInteract,
              interactable,
              interactableInfo,
            )
            break
          case InteractableTypes.EnergyStation:
            this.useEnergyStation(
              world,
              wantInteract,
              interactable,
              interactableInfo,
            )
            break
          case InteractableTypes.EnergyRemnants:
            this.useEnergyRemnants(
              world,
              wantInteract,
              interactable,
              interactableInfo,
            )
            break
          case InteractableTypes.ShieldRemnants:
            this.useShieldRemnants(
              world,
              wantInteract,
              interactable,
              interactableInfo,
            )
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
    world: World,
    wantInteract: WantInteract,
    interactable: Interactable,
    info: Info,
  ) {
    const ownedItems = this.entityOwnedItems(world, wantInteract.user)
    const allowedItems = this.allowableItemsForLevel()
    const itemChoices = allowedItems.filter((a) => !ownedItems.includes(a))
    const suit = SuitStatsComponent.values[wantInteract.user]

    if (itemChoices.length === 0) {
      if (
        allowedItems.includes('Rocket Launcher') &&
        suit.currentRockets < suit.maxRockets
      ) {
        suit.currentRockets = suit.maxRockets
        this.actionSuccess(
          'Rockets have been replenished',
          interactable,
          wantInteract,
        )
        createAnimation(
          world,
          this.map,
          -1,
          PositionComponent.values[wantInteract.user],
          'Weapon Pickup',
        )
      } else if (
        allowedItems.includes('Exploding Discs') &&
        suit.currentDiscs < suit.maxDiscs
      ) {
        suit.currentDiscs = suit.maxDiscs
        this.actionSuccess(
          'Exploding Discs have been replenished',
          interactable,
          wantInteract,
        )
        createAnimation(
          world,
          this.map,
          -1,
          PositionComponent.values[wantInteract.user],
          'Weapon Pickup',
        )
      } else if (
        allowedItems.includes('Flash Grenade') &&
        suit.currentGrenades < suit.maxGrenades
      ) {
        suit.currentGrenades = suit.maxGrenades
        this.actionSuccess(
          'Flash Grenades have been replenished',
          interactable,
          wantInteract,
        )
        createAnimation(
          world,
          this.map,
          -1,
          PositionComponent.values[wantInteract.user],
          'Weapon Pickup',
        )
      } else if (
        suit.currentEnergy < suit.maxEnergy ||
        suit.currentShield < suit.maxShield
      ) {
        if (suit.currentEnergy > suit.currentShield) {
          const value = Math.min(25, suit.maxShield - suit.currentShield)

          suit.currentShield += value
          this.actionSuccess(
            `You recharged ${value} of your shield at the ${info.name}`,
            interactable,
            wantInteract,
          )
          createAnimation(
            world,
            this.map,
            -1,
            PositionComponent.values[wantInteract.user],
            'Shield Pickup',
          )
        } else {
          const value = Math.min(25, suit.maxEnergy - suit.currentEnergy)

          suit.currentEnergy += value
          this.actionSuccess(
            `You recharged ${value} energy at the ${info.name}`,
            interactable,
            wantInteract,
          )
          createAnimation(
            world,
            this.map,
            -1,
            PositionComponent.values[wantInteract.user],
            'Energy Pickup',
          )
        }
      } else {
        this.actionError(
          wantInteract.user,
          `You're already full of everything!`,
        )
      }
    } else {
      const choice = itemChoices[getRandomNumber(0, itemChoices.length - 1)]
      const newItem = createItem(
        world,
        choice,
        undefined,
        wantInteract.user,
        false,
      )
      if (newItem !== undefined) {
        const newInfo = InfoComponent.values[newItem]
        this.actionSuccess(
          `You've acquired the ${newInfo.name}!`,
          interactable,
          wantInteract,
        )

        switch (newInfo.name) {
          case 'Rocket Launcher':
            suit.currentRockets = suit.maxRockets
            break
          case 'Exploding Discs':
            suit.currentDiscs = suit.maxDiscs
            break
          case 'Flash Grenade':
            suit.currentGrenades = suit.maxGrenades
            break
          case 'Laser Rifle':
          case 'Energy Ripper':
          case 'Plasma Cannon':
          case 'Beam Saw':
          case 'Energy Sword':
            const value = Math.min(25, suit.maxEnergy - suit.currentEnergy)
            suit.currentEnergy += value
            break
        }

        createAnimation(
          world,
          this.map,
          -1,
          PositionComponent.values[wantInteract.user],
          'Weapon Pickup',
        )
      }
    }
  }

  entityOwnedItems(world: World, entity: EntityId) {
    const items: string[] = []
    for (const eid of query(world, [OwnerComponent, ItemComponent])) {
      if (OwnerComponent.values[eid].owner === entity) {
        items.push(InfoComponent.values[eid].name)
      }
    }
    return items
  }

  allowableItemsForLevel() {
    const items: string[] = []

    switch (this.map.level) {
      case 1:
        items.push('Laser Rifle')
        items.push('Exploding Discs')
        items.push('Beam Saw')
        break
      case 2:
        items.push('Laser Rifle')
        items.push('Exploding Discs')
        items.push('Energy Ripper')
        items.push('Beam Saw')
        break
      case 3:
        items.push('Laser Rifle')
        items.push('Exploding Discs')
        items.push('Energy Ripper')
        items.push('Flash Grenade')
        items.push('Beam Saw')
        break
      case 4:
        items.push('Laser Rifle')
        items.push('Exploding Discs')
        items.push('Energy Ripper')
        items.push('Flash Grenade')
        items.push('Plasma Cannon')
        items.push('Beam Saw')
        break
      default:
        items.push('Laser Rifle')
        items.push('Exploding Discs')
        items.push('Energy Ripper')
        items.push('Flash Grenade')
        items.push('Plasma Cannon')
        items.push('Rocket Launcher')
        items.push('Beam Saw')
        items.push('Energy Sword')
        break
    }

    return items
  }

  useEnergyStation(
    world: World,
    wantInteract: WantInteract,
    interactable: Interactable,
    info: Info,
  ) {
    const suit = SuitStatsComponent.values[wantInteract.user]
    const value = Math.min(50, suit.maxEnergy - suit.currentEnergy)
    if (value > 0) {
      suit.currentEnergy += value
      this.actionSuccess(
        `You recharged ${value} energy at the ${info.name}`,
        interactable,
        wantInteract,
      )
      createAnimation(
        world,
        this.map,
        -1,
        PositionComponent.values[wantInteract.user],
        'Energy Pickup',
      )
    } else {
      this.actionError(wantInteract.user, `You're already full on energy`)
    }
  }

  useEnergyRemnants(
    world: World,
    wantInteract: WantInteract,
    interactable: Interactable,
    info: Info,
  ) {
    const suit = SuitStatsComponent.values[wantInteract.user]
    const value = Math.min(8, suit.maxEnergy - suit.currentEnergy)
    const userInfo = InfoComponent.values[wantInteract.user]
    if (value > 0) {
      suit.currentEnergy += value
      let message = `${userInfo.name} recharged ${value} energy from ${info.name}`
      if (hasComponent(world, wantInteract.user, ActorComponent)) {
        const actor = ActorComponent.values[wantInteract.user]
        if (actor.personality === PersonalityTypes.Clean) {
          message = `${userInfo.name} cleaned up the ${info.name}`
        }
      }
      this.actionSuccess(message, interactable, wantInteract)
      addComponent(world, wantInteract.interactable, RemoveComponent)
      createAnimation(
        world,
        this.map,
        -1,
        PositionComponent.values[wantInteract.user],
        'Energy Pickup',
      )
    } else {
      this.actionError(wantInteract.user, `You're already full on energy`)
    }
  }

  useShieldRemnants(
    world: World,
    wantInteract: WantInteract,
    interactable: Interactable,
    info: Info,
  ) {
    const suit = SuitStatsComponent.values[wantInteract.user]
    const value = Math.min(8, suit.maxShield - suit.currentShield)
    const userInfo = InfoComponent.values[wantInteract.user]
    if (value > 0) {
      suit.currentShield += value
      let message = `${userInfo.name} recharged ${value} shields from ${info.name}`
      if (hasComponent(world, wantInteract.user, ActorComponent)) {
        const actor = ActorComponent.values[wantInteract.user]
        if (actor.personality === PersonalityTypes.Clean) {
          message = `${userInfo.name} cleaned up the ${info.name}`
        }
      }
      this.actionSuccess(message, interactable, wantInteract)
      addComponent(world, wantInteract.interactable, RemoveComponent)
      createAnimation(
        world,
        this.map,
        -1,
        PositionComponent.values[wantInteract.user],
        'Shield Pickup',
      )
    } else {
      this.actionError(wantInteract.user, `Your shields area already full`)
    }
  }

  useRandomCrate(
    wantInteract: WantInteract,
    interactable: Interactable,
    info: Info,
  ) {
    this.actionSuccess(`You used the ${info.name}`, interactable, wantInteract)
  }

  actionSuccess(
    message: string,
    interactable: Interactable,
    wantInteract: WantInteract,
  ) {
    interactable.used = true
    const renderable = RenderableComponent.values[wantInteract.interactable]
    renderable.fg = Colors.InteractableUsed
    if (
      message.length > 0 &&
      this.playerFOV.find((p) =>
        equal(p, PositionComponent.values[wantInteract.user]),
      )
    ) {
      this.log.addMessage(message)
    }
  }

  actionError(owner: EntityId, error: string) {
    this.log.addMessage(error)
    const action = ActionComponent.values[owner]
    action.actionSuccessful = false
  }
}
