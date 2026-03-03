import {
  addComponent,
  addEntity,
  hasComponent,
  removeComponent,
  type EntityId,
  type World,
} from 'bitecs'
import { type UpdateSystem } from './'
import {
  ActionComponent,
  type Action,
  PositionComponent,
  PlayerComponent,
  type Position,
  BlockerComponent,
  WantAttackComponent,
  InfoComponent,
  WantUseItemComponent,
  ItemComponent,
  OwnerComponent,
  SuitStatsComponent,
  DoorComponent,
  RangedWeaponComponent,
  WeaponComponent,
  InteractableComponent,
  WantInteractComponent,
  EquipmentComponent,
  ActorComponent,
} from '../../components'
import { Map } from '../../../map'
import type { GameStats, Vector2 } from '../../../types'
import type { MessageLog } from '../../../utils/message-log'
import { distance, equal } from '../../../utils/vector-2-funcs'
import { processFOV, processPlayerFOV } from '../../../utils/fov-funcs'
import {
  OPEN_DOOR_TILE,
  AttackTypes,
  ItemActionTypes,
  type AttackType,
  AmmunitionTypes,
  PersonalityTypes,
} from '../../../constants'
import { createAnimation } from '../../templates'

export class UpdateActionSystem implements UpdateSystem {
  map: Map
  playerFOV: Vector2[]
  log: MessageLog
  gameStats: GameStats

  constructor(
    log: MessageLog,
    map: Map,
    playerFOV: Vector2[],
    gameStats: GameStats,
  ) {
    this.log = log
    this.map = map
    this.playerFOV = playerFOV
    this.gameStats = gameStats
  }

  update(world: World, entity: EntityId) {
    const position = PositionComponent.values[entity]
    const action = ActionComponent.values[entity]

    if (!action.processed) {
      const newPosition = {
        x: position.x + action.xOffset,
        y: position.y + action.yOffset,
      }

      if (action.useItem !== undefined) {
        this.handleTryUseItem(world, entity, action, position)
      } else if (action.itemActionType === ItemActionTypes.PickUp) {
        this.handleTryPickUpItem(world, entity, action, position)
      } else if (
        !equal(position, newPosition) &&
        this.map.isWalkable(newPosition.x, newPosition.y)
      ) {
        this.handleTryMove(world, entity, action, position, newPosition)
      } else {
        if (equal(position, newPosition)) {
          const info = InfoComponent.values[entity]
          this.addMessage(`${info.name} does nothing.`, position)
          this.resetAction(action, true)
        } else {
          this.addMessage('That direction is blocked', position)
          this.resetAction(action, false)
        }
      }
    }
  }

  addMessage(message: string, position: Vector2) {
    if (this.playerFOV.find((p) => equal(p, position))) {
      this.log.addMessage(message)
    }
  }

  handleTryMove(
    world: World,
    entity: EntityId,
    action: Action,
    position: Position,
    newPosition: Position,
  ) {
    const entities = this.map.getEntitiesAtLocation(newPosition)

    if (
      entities.length === 0 ||
      entities.find((a) => hasComponent(world, a, BlockerComponent)) ===
        undefined
    ) {
      this.handleMove(world, entity, position, newPosition)
      this.resetAction(action, true)
    } else if (entities.length > 0) {
      const blocker = entities.find((a) =>
        hasComponent(world, a, BlockerComponent),
      )
      if (blocker !== undefined) {
        if (hasComponent(world, blocker, SuitStatsComponent)) {
          this.handleMelee(world, entity, blocker, position, newPosition)
        } else if (hasComponent(world, blocker, DoorComponent)) {
          if (
            hasComponent(world, entity, PlayerComponent) ||
            (hasComponent(world, entity, ActorComponent) &&
              [PersonalityTypes.Clean, PersonalityTypes.Thief].includes(
                ActorComponent.values[entity].personality,
              ))
          ) {
            DoorComponent.values[blocker].open = true
            removeComponent(world, blocker, BlockerComponent)
            const doorPosition = PositionComponent.values[blocker]
            const oldTile = this.map.tiles[doorPosition.x][doorPosition.y]
            this.map.tiles[doorPosition.x][doorPosition.y] = {
              ...OPEN_DOOR_TILE,
              fg: oldTile.fg,
              bg: oldTile.bg,
              seen: true,
            }
            if (hasComponent(world, entity, PlayerComponent)) {
              processPlayerFOV(this.map, entity, this.playerFOV)
            }
            const info = InfoComponent.values[entity]

            this.addMessage(`${info.name} opens the door`, position)
          }
        } else if (hasComponent(world, blocker, InteractableComponent)) {
          const interact = addEntity(world)
          addComponent(world, interact, WantInteractComponent)
          WantInteractComponent.values[interact] = {
            user: entity,
            interactable: blocker,
          }
        }

        this.resetAction(action, true)
      }
    }
  }

  handleMelee(
    world: World,
    entity: EntityId,
    blocker: EntityId,
    position: Vector2,
    newPosition: Vector2,
  ) {
    const equipment = EquipmentComponent.values[entity]
    let radius = 0
    let targetEntities: EntityId[] = []
    let targetLocations: Vector2[] = []

    if (equipment.meleeWeapon > -1) {
      const weapon = WeaponComponent.values[equipment.meleeWeapon]
      radius = weapon.splashRadius
      if (radius === 0) {
        targetEntities.push(blocker)
        targetLocations.push(newPosition)
      } else {
        const targets = processFOV(this.map, position, radius)
        targets.forEach((t) => {
          const entities = this.map.getEntitiesAtLocation(t)
          const targetEntity = entities.find((a) =>
            hasComponent(world, a, SuitStatsComponent),
          )
          if (targetEntity !== undefined) {
            targetEntities.push(targetEntity)
            targetLocations.push(t)
          }
        })
      }
    }

    const attack = addEntity(world)
    addComponent(world, attack, WantAttackComponent)

    WantAttackComponent.values[attack] = {
      attackType: AttackTypes.Melee as AttackType,
      attacker: entity,
      defender: targetEntities,
      itemUsed: equipment.meleeWeapon > -1 ? equipment.meleeWeapon : undefined,
    }

    targetLocations.forEach((p) => {
      createAnimation(world, this.map, entity, position, 'Melee', undefined, p)
    })
  }

  handleTryPickUpItem(
    world: World,
    entity: EntityId,
    action: Action,
    position: Position,
  ) {
    const info = InfoComponent.values[entity]
    if (action.pickUpItem) {
      const entities = this.map.getEntitiesAtLocation(position)
      if (entities.length === 0) {
        this.addMessage('There is no item to pick up', position)
        this.resetAction(action, false)
      }
      if (
        entities.find((a) => hasComponent(world, a, InteractableComponent)) !==
        undefined
      ) {
        const interactable = entities.find((a) =>
          hasComponent(world, a, InteractableComponent),
        )!
        const interact = addEntity(world)
        addComponent(world, interact, WantInteractComponent)
        WantInteractComponent.values[interact] = {
          user: entity,
          interactable,
        }
      } else if (
        entities.find((a) => hasComponent(world, a, ItemComponent)) !==
        undefined
      ) {
        const item = entities.find((a) =>
          hasComponent(world, a, ItemComponent),
        )!
        removeComponent(world, item, PositionComponent)
        addComponent(world, item, OwnerComponent)
        OwnerComponent.values[item] = { owner: entity }
        const itemInfo = InfoComponent.values[item]
        this.log.addMessage(`${info.name} picks up ${itemInfo.name}`)
        this.resetAction(action, true)
      } else {
        this.addMessage("This isn't something you can pick up", position)
        this.resetAction(action, false)
      }
    }
  }

  handleTryUseItem(
    world: World,
    entity: EntityId,
    action: Action,
    position: Position,
  ) {
    const useItem = action.useItem!
    if (
      action.itemActionType === ItemActionTypes.Use ||
      action.itemActionType === ItemActionTypes.Attack
    ) {
      const item = addEntity(world)
      addComponent(world, item, WantUseItemComponent)
      WantUseItemComponent.values[item] = {
        owner: entity,
        item: useItem,
        itemActionType: action.itemActionType,
      }
      this.resetAction(action, true)
    } else if (action.itemActionType === ItemActionTypes.Drop) {
      const fov = hasComponent(world, entity, PlayerComponent)
        ? this.playerFOV
        : processFOV(this.map, position, 8)
      const sortedFov = fov.toSorted((a, b) => {
        return distance(a, position) - distance(b, position)
      })

      let dropped = false
      let i = 0
      do {
        if (this.map.isWalkable(sortedFov[i].x, sortedFov[i].y)) {
          const entities = this.map.getEntitiesAtLocation(sortedFov[i])
          if (
            entities.length === 0 ||
            !entities.find((a) => hasComponent(world, a, ItemComponent))
          ) {
            dropped = true

            removeComponent(world, useItem, OwnerComponent)
            addComponent(world, useItem, PositionComponent)
            PositionComponent.values[useItem] = { ...sortedFov[i] }
            this.map.addEntityAtLocation(useItem, sortedFov[i])
          }
        }
        i++
      } while (!dropped && i < sortedFov.length)

      this.resetAction(action, true)
    } else if (
      action.itemActionType === ItemActionTypes.Reload ||
      action.itemActionType === ItemActionTypes.ReloadSecondary
    ) {
      if (hasComponent(world, useItem, RangedWeaponComponent)) {
        const weapon = WeaponComponent.values[useItem]
        const rangedWeapon = RangedWeaponComponent.values[useItem]
        const suitStats = SuitStatsComponent.values[entity]
        const info = InfoComponent.values[entity]
        const itemInfo = InfoComponent.values[useItem]

        if (rangedWeapon.currentAmmunition === rangedWeapon.maxAmmunition) {
          switch (rangedWeapon.ammunitionType) {
            case AmmunitionTypes.Energy:
              this.addMessage(
                `${itemInfo.name} does not need recharged`,
                position,
              )
              break
            case AmmunitionTypes.Rockets:
              this.addMessage(
                `${itemInfo.name} does not need reloaded`,
                position,
              )
              break
            case AmmunitionTypes.Grenades:
            case AmmunitionTypes.Discs:
              this.addMessage(`You are full of ${itemInfo.name}`, position)
              break
          }

          this.resetAction(action, false)
        } else if (rangedWeapon.ammunitionType === AmmunitionTypes.Energy) {
          if (suitStats.currentEnergy >= weapon.energyCost) {
            suitStats.currentEnergy -= weapon.energyCost
            rangedWeapon.currentAmmunition = rangedWeapon.maxAmmunition

            this.addMessage(
              `${info.name} recharged their ${itemInfo.name}`,
              position,
            )
            this.resetAction(action, true)
          } else {
            this.addMessage(
              `Not enough energy to recharge ${itemInfo.name}`,
              position,
            )
            this.resetAction(action, false)
          }
        } else if (rangedWeapon.ammunitionType === AmmunitionTypes.Rockets) {
          if (suitStats.currentRockets > 0) {
            const amount = Math.min(
              rangedWeapon.maxAmmunition - rangedWeapon.currentAmmunition,
              suitStats.currentRockets,
            )
            suitStats.currentRockets -= amount
            rangedWeapon.currentAmmunition += amount

            this.addMessage(
              `${info.name} reloaded their ${itemInfo.name}`,
              position,
            )
            this.resetAction(action, true)
          } else {
            this.addMessage(`You have no more rockets`, position)
            this.resetAction(action, false)
          }
        } else {
          this.addMessage(
            `Find more ${rangedWeapon.ammunitionType.toLowerCase()} to use them`,
            position,
          )
          this.resetAction(action, false)
        }
      } else {
        this.addMessage("Can't reload this weapon", position)
        this.resetAction(action, false)
      }
    } else {
      this.addMessage('Invalid action for an item', position)
      this.resetAction(action, false)
    }
  }

  handleMove(
    world: World,
    eid: EntityId,
    position: Position,
    newPosition: Vector2,
  ) {
    this.map.moveEntity(eid, position, newPosition)
    position.x = newPosition.x
    position.y = newPosition.y

    if (hasComponent(world, eid, PlayerComponent)) {
      this.gameStats.stepsWalked++
      processPlayerFOV(this.map, eid, this.playerFOV)
    }
  }

  resetAction(action: Action, success: boolean) {
    action.processed = true
    action.xOffset = 0
    action.yOffset = 0
    action.useItem = undefined
    action.pickUpItem = false
    action.itemActionType = undefined
    action.actionSuccessful = success
  }
}
