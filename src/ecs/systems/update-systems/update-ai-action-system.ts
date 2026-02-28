import { hasComponent, query, type EntityId, type World } from 'bitecs'
import type { UpdateSystem } from './update-system'
import {
  ActionComponent,
  AmmunitionComponent,
  ConfusionComponent,
  EquipmentComponent,
  FieldOfViewComponent,
  ItemComponent,
  OwnerComponent,
  PathfinderComponent,
  PlayerComponent,
  PositionComponent,
  RangedWeaponComponent,
  TargetingComponent,
  WeaponComponent,
  type Action,
  type Equipment,
  type Pathfinder,
} from '../../components'
import { Map } from '../../../map'
import { getRandomNumber } from '../../../utils/random'
import { processFOV } from '../../../utils/fov-funcs'
import type { Vector2 } from '../../../types'
import { distance, equal } from '../../../utils/vector-2-funcs'
import {
  AiActionTypes,
  AttackTypes,
  ItemActionTypes,
  type AmmunitionType,
  type ItemActionType,
} from '../../../constants'

export class UpdateAiActionSystem implements UpdateSystem {
  map: Map
  player: EntityId

  constructor(map: Map, player: EntityId) {
    this.map = map
    this.player = player
  }

  update(world: World, entity: EntityId) {
    if (
      hasComponent(world, entity, ActionComponent) &&
      !hasComponent(world, entity, PlayerComponent)
    ) {
      const aiPosition = PositionComponent.values[entity]
      const aiPathfinder = PathfinderComponent.values[entity]
      const aiFOV = FieldOfViewComponent.values[entity]
      const fov = processFOV(this.map, aiPosition, aiFOV.currentFOV)
      const aiAction = ActionComponent.values[entity]
      aiAction.processed = false
      const playerPosition = PositionComponent.values[this.player]
      const equipment = EquipmentComponent.values[entity]

      if (hasComponent(world, entity, ConfusionComponent)) {
        this.processConfusion(aiAction)
      } else if (this.fovContainsPlayer(fov, playerPosition)) {
        this.processPlayerInFOV(
          world,
          entity,
          aiAction,
          aiPosition,
          aiPathfinder,
          playerPosition,
          equipment,
        )
      } else if (aiPathfinder.lastKnownTargetPosition !== undefined) {
        this.processGoToLastKnownTargetPosition(
          aiAction,
          aiPosition,
          aiPathfinder,
        )
      } else {
        aiAction.processed = true
      }
    }
  }

  processConfusion(aiAction: Action) {
    aiAction.xOffset = getRandomNumber(-1, 1)
    aiAction.yOffset = aiAction.xOffset === 0 ? getRandomNumber(-1, 1) : 0
  }

  processPlayerInFOV(
    world: World,
    entity: EntityId,
    aiAction: Action,
    aiPosition: Vector2,
    aiPathfinder: Pathfinder,
    playerPosition: Vector2,
    aiEquipment: Equipment,
  ) {
    aiPathfinder.lastKnownTargetPosition = playerPosition
    let action = AiActionTypes.Move
    if (aiEquipment.weapon > -1) {
      const weapon = WeaponComponent.values[aiEquipment.weapon]
      if (weapon.attackType === AttackTypes.Ranged) {
        const rangedWeapon = RangedWeaponComponent.values[aiEquipment.weapon]
        const playerDistance = distance(aiPosition, playerPosition)
        if (playerDistance === 1) {
          action = AiActionTypes.AttackMelee
        } else if (playerDistance <= rangedWeapon.range) {
          if (rangedWeapon.currentAmmunition > 0) {
            action = AiActionTypes.AttackRanged
          } else {
            const ammunition = this.getAmmunitionItemForActor(
              world,
              entity,
              rangedWeapon.ammunitionType,
            )
            if (ammunition !== undefined) {
              action = AiActionTypes.Reload
            }
          }
        }
      }
    }

    if (action === AiActionTypes.Move || action === AiActionTypes.AttackMelee) {
      const next = this.nextPosition(aiPosition, playerPosition)

      if (next !== undefined) {
        aiAction.xOffset = next.x - aiPosition.x
        aiAction.yOffset = next.y - aiPosition.y
      }
    } else if (action === AiActionTypes.AttackRanged) {
      aiAction.useItem = aiEquipment.weapon
      aiAction.itemActionType = ItemActionTypes.Attack as ItemActionType
      TargetingComponent.values[aiEquipment.weapon].position = playerPosition
    } else if (action === AiActionTypes.Reload) {
      aiAction.useItem = aiEquipment.weapon
      aiAction.itemActionType = ItemActionTypes.Reload as ItemActionType
    }
  }

  processGoToLastKnownTargetPosition(
    aiAction: Action,
    aiPosition: Vector2,
    aiPathfinder: Pathfinder,
  ) {
    if (aiPosition === aiPathfinder.lastKnownTargetPosition) {
      aiPathfinder.lastKnownTargetPosition = undefined
      aiAction.processed = true
    } else {
      const next = this.nextPosition(
        aiPosition,
        aiPathfinder.lastKnownTargetPosition!,
      )

      if (next !== undefined) {
        aiAction.xOffset = next.x - aiPosition.x
        aiAction.yOffset = next.y - aiPosition.y
      }
    }
  }

  nextPosition(current: Vector2, next: Vector2) {
    const path = this.map.getPath(current, next)
    return path.length > 0 ? path[0] : undefined
  }

  fovContainsPlayer(fov: Vector2[], playerPosition: Vector2) {
    return fov.find((p) => equal(p, playerPosition)) !== undefined
  }

  getAmmunitionItemForActor(
    world: World,
    entity: EntityId,
    ammunitionType: AmmunitionType,
  ) {
    let ammunition = undefined
    for (const eid of query(world, [
      OwnerComponent,
      ItemComponent,
      AmmunitionComponent,
    ])) {
      if (ammunition === undefined) {
        if (OwnerComponent.values[eid].owner === entity) {
          const thisAmmunition = AmmunitionComponent.values[eid]
          if (thisAmmunition.ammunitionType === ammunitionType) {
            ammunition = eid
          }
        }
      }
    }

    return ammunition
  }
}
