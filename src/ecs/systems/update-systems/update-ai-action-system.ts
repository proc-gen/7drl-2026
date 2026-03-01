import { hasComponent, query, type EntityId, type World } from 'bitecs'
import type { UpdateSystem } from './update-system'
import {
  ActionComponent,
  ActorComponent,
  AmmunitionComponent,
  EquipmentComponent,
  FieldOfViewComponent,
  ItemComponent,
  OwnerComponent,
  PathfinderComponent,
  PositionComponent,
  RangedWeaponComponent,
  StatsComponent,
  SuitStatsComponent,
  TargetingComponent,
  WeaponComponent,
  type Action,
  type Equipment,
  type Pathfinder,
  type Stats,
} from '../../components'
import { Map } from '../../../map'
import { processFOV } from '../../../utils/fov-funcs'
import type { Vector2 } from '../../../types'
import { distance, equal } from '../../../utils/vector-2-funcs'
import {
  AiActionTypes,
  AmmunitionTypes,
  isRanged,
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
      hasComponent(world, entity, ActorComponent)
    ) {
      const aiPosition = PositionComponent.values[entity]
      const aiPathfinder = PathfinderComponent.values[entity]
      const aiFOV = FieldOfViewComponent.values[entity]
      const fov = processFOV(this.map, aiPosition, aiFOV.currentFOV)
      const aiAction = ActionComponent.values[entity]
      aiAction.processed = false
      const playerPosition = PositionComponent.values[this.player]
      const equipment = EquipmentComponent.values[entity]
      const stats = StatsComponent.values[entity]

      if (this.fovContainsPlayer(fov, playerPosition)) {
        this.processPlayerInFOV(
          world,
          entity,
          aiAction,
          aiPosition,
          aiPathfinder,
          playerPosition,
          equipment,
          fov,
          stats,
        )
      } else if (aiPathfinder.lastKnownTargetPosition !== undefined) {
        this.processGoToLastKnownTargetPosition(
          aiAction,
          aiPosition,
          aiPathfinder,
          fov,
          stats,
        )
      } else {
        aiAction.processed = true
      }
    }
  }

  processPlayerInFOV(
    world: World,
    entity: EntityId,
    aiAction: Action,
    aiPosition: Vector2,
    aiPathfinder: Pathfinder,
    playerPosition: Vector2,
    aiEquipment: Equipment,
    fov: Vector2[],
    stats: Stats,
  ) {
    aiPathfinder.lastKnownTargetPosition = playerPosition
    let action = AiActionTypes.Move
    if (aiEquipment.rangedWeapon > -1) {
      const weapon = WeaponComponent.values[aiEquipment.rangedWeapon]
      if (isRanged(weapon.attackType)) {
        const rangedWeapon =
          RangedWeaponComponent.values[aiEquipment.rangedWeapon]
        const playerDistance = distance(aiPosition, playerPosition)
        if (playerDistance <= rangedWeapon.range) {
          if (rangedWeapon.currentAmmunition > 0) {
            action = AiActionTypes.AttackRanged
          } else {
            const suit = SuitStatsComponent.values[entity]
            if (rangedWeapon.ammunitionType === AmmunitionTypes.Energy) {
              if (suit.currentEnergy >= weapon.energyCost) {
                action = AiActionTypes.Reload
              } else {
                if (playerDistance === 1) {
                  action = AiActionTypes.AttackMelee
                }
              }
            }
          }
        }
      }
    }

    if (action === AiActionTypes.Move || action === AiActionTypes.AttackMelee) {
      if (stats.moveSpeed === 0) {
        aiAction.xOffset = 0
        aiAction.yOffset = 0
      } else {
        const next = this.nextPosition(aiPosition, playerPosition, fov, stats)
        console.log(next)
        if (next !== undefined) {
          aiAction.xOffset = next.x - aiPosition.x
          aiAction.yOffset = next.y - aiPosition.y
        }
      }
    } else if (action === AiActionTypes.AttackRanged) {
      aiAction.useItem = aiEquipment.rangedWeapon
      aiAction.itemActionType = ItemActionTypes.Attack as ItemActionType
      TargetingComponent.values[aiEquipment.rangedWeapon].position =
        playerPosition
    } else if (action === AiActionTypes.Reload) {
      aiAction.useItem = aiEquipment.rangedWeapon
      aiAction.itemActionType = ItemActionTypes.Reload as ItemActionType
    }
  }

  processGoToLastKnownTargetPosition(
    aiAction: Action,
    aiPosition: Vector2,
    aiPathfinder: Pathfinder,
    fov: Vector2[],
    stats: Stats,
  ) {
    if (aiPosition === aiPathfinder.lastKnownTargetPosition) {
      aiPathfinder.lastKnownTargetPosition = undefined
      aiAction.processed = true
    } else {
      if (stats.moveSpeed === 0) {
        aiAction.xOffset = 0
        aiAction.yOffset = 0
      } else {
        const next = this.nextPosition(
          aiPosition,
          aiPathfinder.lastKnownTargetPosition!,
          fov,
          stats,
        )

        if (next !== undefined) {
          aiAction.xOffset = next.x - aiPosition.x
          aiAction.yOffset = next.y - aiPosition.y
        }
      }
    }
  }

  nextPosition(current: Vector2, next: Vector2, fov: Vector2[], stats: Stats) {
    let path = this.map.getPath(current, next)
    if (path.length === 0) {
      const positionsNearTarget = processFOV(this.map, next, 5).filter((a) =>
        fov.find((b) => equal(a, b)),
      )

      let paths = positionsNearTarget
        .map((a) => {
          return this.map.getPath(current, a)
        })
        .filter((a) => a.length > 0)
        .toSorted((a, b) => a.length - b.length)
      if (paths.length > 0) {
        path = paths[0]
      }
    }

    return path.length > 0
      ? path[Math.min(stats.moveSpeed - 1, path.length - 1)]
      : undefined
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
