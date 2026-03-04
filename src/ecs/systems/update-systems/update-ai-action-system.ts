import { hasComponent, query, type EntityId, type World } from 'bitecs'
import type { UpdateSystem } from './update-system'
import {
  ActionComponent,
  ActorComponent,
  AliveComponent,
  BlockerComponent,
  CorpseComponent,
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
  type Position,
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
  PersonalityTypes,
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
      const actor = ActorComponent.values[entity]
      const aiPosition = PositionComponent.values[entity]
      const aiPathfinder = PathfinderComponent.values[entity]
      const aiFOV = FieldOfViewComponent.values[entity]

      const fov = processFOV(this.map, aiPosition, aiFOV.currentFOV)
      const aiAction = ActionComponent.values[entity]
      aiAction.processed = false
      const playerPosition = PositionComponent.values[this.player]
      const equipment = EquipmentComponent.values[entity]
      const stats = StatsComponent.values[entity]

      if (!actor.hostile) {
        if (actor.personality === PersonalityTypes.Clean) {
          this.processCleaner(
            world,
            entity,
            aiPosition,
            aiPathfinder,
            aiAction,
            stats,
            fov,
          )
        } else {
          aiAction.processed = true
        }
      } else {
        switch (actor.personality) {
          case PersonalityTypes.Melee:
            this.processMelee(
              world,
              playerPosition,
              fov,
              aiPathfinder,
              aiAction,
              aiPosition,
              stats,
            )
            break
          case PersonalityTypes.Ranged:
            this.processRanged(
              world,
              entity,
              playerPosition,
              fov,
              aiPathfinder,
              aiAction,
              aiPosition,
              stats,
              equipment,
            )
            break
          case PersonalityTypes.Thief:
            this.processThief(
              world,
              entity,
              playerPosition,
              aiPosition,
              aiPathfinder,
              aiAction,
              stats,
              fov,
            )
            break
        }
      }
    }
  }

  processMelee(
    world: World,
    playerPosition: Vector2,
    fov: Vector2[],
    aiPathfinder: Pathfinder,
    aiAction: Action,
    aiPosition: Position,
    stats: Stats,
  ) {
    if (this.fovContainsPlayer(fov, playerPosition)) {
      aiPathfinder.lastKnownTargetPosition = playerPosition
      let action = AiActionTypes.Move
      const playerDistance = Math.ceil(distance(aiPosition, playerPosition))
      if (playerDistance === 1) {
        action = AiActionTypes.AttackMelee
      }

      if (action === AiActionTypes.AttackMelee) {
        aiAction.xOffset = playerPosition.x - aiPosition.x
        aiAction.yOffset = playerPosition.y - aiPosition.y
      } else {
        const next = this.nextPosition(
          world,
          aiPosition,
          playerPosition,
          fov,
          stats,
        )
        if (next !== undefined) {
          aiAction.xOffset = next.x - aiPosition.x
          aiAction.yOffset = next.y - aiPosition.y
        }
      }
    } else if (aiPathfinder.lastKnownTargetPosition !== undefined) {
      this.processGoToLastKnownTargetPosition(
        world,
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

  processRanged(
    world: World,
    entity: EntityId,
    playerPosition: Vector2,
    fov: Vector2[],
    aiPathfinder: Pathfinder,
    aiAction: Action,
    aiPosition: Position,
    stats: Stats,
    equipment: Equipment,
  ) {
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
        world,
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

  processThief(
    world: World,
    entity: EntityId,
    playerPosition: Vector2,
    aiPosition: Position,
    aiPathfinder: Pathfinder,
    aiAction: Action,
    stats: Stats,
    fov: Vector2[],
  ) {
    let hasItem = false
    for (const eid of query(world, [OwnerComponent, ItemComponent])) {
      if (OwnerComponent.values[eid].owner === entity) {
        hasItem = true
      }
    }

    if (!hasItem) {
      if (this.fovContainsPlayer(fov, playerPosition)) {
        aiPathfinder.lastKnownTargetPosition = playerPosition
        let action = AiActionTypes.Move
        const playerDistance = Math.ceil(distance(aiPosition, playerPosition))
        if (playerDistance === 1) {
          action = AiActionTypes.Steal
        }

        if (action === AiActionTypes.Steal) {
          aiAction.xOffset = playerPosition.x - aiPosition.x
          aiAction.yOffset = playerPosition.y - aiPosition.y
          aiAction.itemActionType = ItemActionTypes.Steal as ItemActionType
        } else {
          const next = this.nextPosition(
            world,
            aiPosition,
            playerPosition,
            fov,
            stats,
          )
          if (next !== undefined) {
            aiAction.xOffset = next.x - aiPosition.x
            aiAction.yOffset = next.y - aiPosition.y
          }
        }
      } else if (aiPathfinder.lastKnownTargetPosition !== undefined) {
        this.processGoToLastKnownTargetPosition(
          world,
          aiAction,
          aiPosition,
          aiPathfinder,
          fov,
          stats,
        )
      } else {
        aiAction.processed = true
      }
    } else {
      let helperDistance = 1
      let helper: EntityId | undefined = undefined
      for (const eid of query(world, [
        ActorComponent,
        SuitStatsComponent,
        AliveComponent,
      ])) {
        if (eid !== entity) {
          const curDistance = this.map.getPath(
            PositionComponent.values[eid],
            PositionComponent.values[entity],
            true,
          ).length
          if (curDistance > 0 && curDistance > helperDistance) {
            helperDistance = curDistance
            helper = eid
          }
        }
      }

      if (helper !== undefined) {
        const next = this.nextPosition(
          world,
          aiPosition,
          PositionComponent.values[helper],
          fov,
          stats,
        )
        if (next !== undefined) {
          aiAction.xOffset = next.x - aiPosition.x
          aiAction.yOffset = next.y - aiPosition.y
        } else {
          aiAction.processed = true
        }
      } else {
        if (this.fovContainsPlayer(fov, playerPosition)) {
          const pDistance = Math.ceil(distance(aiPosition, playerPosition))
          if (pDistance < 6) {
            let escapeDistance = 0
            let escapePosition = aiPosition
            fov.forEach((p) => {
              const eCurDistance = distance(p, playerPosition)
              if (eCurDistance > escapeDistance) {
                escapeDistance = eCurDistance
                escapePosition = p
              }
            })
            const next = this.nextPosition(
              world,
              aiPosition,
              escapePosition,
              fov,
              stats,
            )
            if (next !== undefined) {
              aiAction.xOffset = next.x - aiPosition.x
              aiAction.yOffset = next.y - aiPosition.y
            } else {
              aiAction.processed = true
            }
          }
        } else {
          aiAction.processed = true
        }
      }
    }
  }

  processCleaner(
    world: World,
    _entity: EntityId,
    aiPosition: Position,
    aiPathfinder: Pathfinder,
    aiAction: Action,
    stats: Stats,
    fov: Vector2[],
  ) {
    if (aiPathfinder.lastKnownTargetPosition !== undefined) {
      const entitiesAtPosition = this.map.getEntitiesAtLocation(
        aiPathfinder.lastKnownTargetPosition,
      )
      if (
        entitiesAtPosition.find((a) =>
          hasComponent(world, a, CorpseComponent),
        ) === undefined
      ) {
        aiPathfinder.lastKnownTargetPosition = undefined
      }
    }

    if (aiPathfinder.lastKnownTargetPosition === undefined) {
      let distance = 9999
      let targetPosition: Vector2 | undefined = undefined

      for (const eid of query(world, [CorpseComponent])) {
        const position = PositionComponent.values[eid]
        const curDistance = this.map.getPath(
          aiPosition,
          position,
          true,
          false,
          true,
        ).length

        if (curDistance > 0 && curDistance < distance) {
          distance = curDistance
          targetPosition = position
        }
      }

      aiPathfinder.lastKnownTargetPosition = targetPosition
    }

    if (aiPathfinder.lastKnownTargetPosition !== undefined) {
      if (equal(aiPosition, aiPathfinder.lastKnownTargetPosition)) {
        aiAction.pickUpItem = true
        aiAction.itemActionType = ItemActionTypes.PickUp as ItemActionType
      } else {
        this.processGoToLastKnownTargetPosition(
          world,
          aiAction,
          aiPosition,
          aiPathfinder,
          fov,
          stats,
        )
      }
    } else {
      aiAction.processed = true
    }
  }

  processSentryBoss() {}

  processCyborgBoss() {}

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
        const playerDistance = Math.ceil(distance(aiPosition, playerPosition))
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
            } else if (
              rangedWeapon.ammunitionType === AmmunitionTypes.Rockets
            ) {
              if (suit.currentRockets > 0) {
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
        const next = this.nextPosition(
          world,
          aiPosition,
          playerPosition,
          fov,
          stats,
        )
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
    world: World,
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
          world,
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

  nextPosition(
    world: World,
    current: Vector2,
    next: Vector2,
    fov: Vector2[],
    stats: Stats,
  ) {
    let path = this.map.getPath(current, next, true)
    if (path.length === 0) {
      const positionsNearTarget = processFOV(this.map, next, 5).filter((a) =>
        fov.find((b) => equal(a, b)),
      )

      let paths = positionsNearTarget
        .map((a) => {
          return this.map.getPath(current, a, true)
        })
        .filter((a) => a.length > 0)
        .toSorted((a, b) => a.length - b.length)
      if (paths.length > 0) {
        path = paths[0]
      }
    }

    if (path.length > 0) {
      let position = path[0]
      if (path.length > 1 && stats.moveSpeed > 1) {
        const entities = this.map.getEntitiesAtLocation(path[1])
        if (this.map.tiles[position.x][position.y].name === 'Door Closed') {
          position = path[0]
        } else if (entities.length === 0) {
          position = path[1]
        } else if (
          entities.find((e) => hasComponent(world, e, BlockerComponent)) ===
          undefined
        ) {
          position = path[1]
        }
      }
      return position
    } else {
      return undefined
    }
  }

  fovContainsPlayer(fov: Vector2[], playerPosition: Vector2) {
    return fov.find((p) => equal(p, playerPosition)) !== undefined
  }
}
