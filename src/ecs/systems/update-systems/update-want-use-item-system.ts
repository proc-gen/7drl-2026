import {
  addComponent,
  addEntity,
  hasComponent,
  query,
  type EntityId,
  type World,
} from 'bitecs'
import type { MessageLog } from '../../../utils/message-log'
import type { UpdateSystem } from './update-system'
import {
  ActionComponent,
  EquipmentComponent,
  EquippableComponent,
  SuitStatsComponent,
  InfoComponent,
  OwnerComponent,
  PositionComponent,
  RangedWeaponComponent,
  RemoveComponent,
  TargetingComponent,
  WantAttackComponent,
  WantCauseEffectComponent,
  WantUseItemComponent,
  WeaponComponent,
  type Equipment,
  type Info,
  type Targeting,
  type WantUseItem,
  CauseEffectComponent,
  type Weapon,
  StatsComponent,
} from '../../components'
import type { Map } from '../../../map'
import {
  AttackTypes,
  type AttackType,
} from '../../../constants'
import { processFOV } from '../../../utils/fov-funcs'
import type { GameStats, Vector2 } from '../../../types'
import { createAnimation } from '../../templates'
import { add, getPointsInLine, mulConst } from '../../../utils/vector-2-funcs'
import { getWeaponClassStatsForWeapon } from '../../../utils/weapon-class-funcs'

export class UpdateWantUseItemSystem implements UpdateSystem {
  log: MessageLog
  map: Map
  gameStats: GameStats

  constructor(log: MessageLog, map: Map, gameStats: GameStats) {
    this.log = log
    this.map = map
    this.gameStats = gameStats
  }

  update(world: World, _entity: EntityId) {
    for (const eid of query(world, [WantUseItemComponent])) {
      const useItem = WantUseItemComponent.values[eid]
      if (this.checkOwnerOwnsItem(world, useItem)) {
        if (hasComponent(world, useItem.item, EquippableComponent)) {
          this.useEquippableItem(world, useItem)
        } else {
          this.actionError(useItem.owner, 'Invalid item type to use')
        }
      }
      addComponent(world, eid, RemoveComponent)
    }
  }

  checkOwnerOwnsItem(world: World, useItem: WantUseItem) {
    let ownerOwnsItem = true
    if (!hasComponent(world, useItem.item, OwnerComponent)) {
      this.actionError(useItem.owner, 'Invalid item selected')
      ownerOwnsItem = false
    } else {
      const itemOwner = OwnerComponent.values[useItem.item]
      if (itemOwner.owner !== useItem.owner) {
        this.actionError(useItem.owner, 'Invalid item selected')
        ownerOwnsItem = false
      }
    }
    return ownerOwnsItem
  }

  useEquippableItem(world: World, useItem: WantUseItem) {
    const equipment = EquipmentComponent.values[useItem.owner]
    const weapon = WeaponComponent.values[useItem.item]

    if (
      weapon.attackType === AttackTypes.RangedEnergy &&
      equipment.rangedWeapon !== useItem.item
    ) {
      this.equipItem(world, useItem, equipment, weapon)
    } else if (
      weapon.attackType === AttackTypes.RangedPhysical &&
      equipment.secondaryRangedWeapon !== useItem.item
    ) {
      this.equipItem(world, useItem, equipment, weapon)
    } else if (
      weapon.attackType === AttackTypes.Melee &&
      equipment.meleeWeapon !== useItem.item
    ) {
      this.equipItem(world, useItem, equipment, weapon)
    } else {
      this.attackWithEquippedWeapon(world, useItem)
    }
  }

  attackWithEquippedWeapon(world: World, useItem: WantUseItem) {
    if (hasComponent(world, useItem.item, RangedWeaponComponent)) {
      const weapon = WeaponComponent.values[useItem.item]
      const rangedWeapon = RangedWeaponComponent.values[useItem.item]
      const targeting = TargetingComponent.values[useItem.item]
      const weaponStats = getWeaponClassStatsForWeapon(
        weapon,
        StatsComponent.values[useItem.owner],
      )
      this.processSingleTargetEntityAttack(
        world,
        useItem,
        targeting,
        weapon.attackType,
        weapon.attack,
        weaponStats.splashRadius + weapon.splashRadius,
        rangedWeapon.pierce,
      )
    } else {
      this.actionError(useItem.owner, `Invalid weapon used`)
    }
  }

  equipItem(
    _world: World,
    useItem: WantUseItem,
    equipment: Equipment,
    weapon: Weapon,
  ) {
    const ownerInfo = InfoComponent.values[useItem.owner]

    if (weapon.attackType === AttackTypes.RangedEnergy) {
      this.setEquippedForItem(equipment.rangedWeapon, false, ownerInfo)
      equipment.rangedWeapon = useItem.item
      this.setEquippedForItem(equipment.rangedWeapon, true, ownerInfo)
    } else if (weapon.attackType === AttackTypes.RangedPhysical) {
      this.setEquippedForItem(equipment.secondaryRangedWeapon, false, ownerInfo)
      equipment.secondaryRangedWeapon = useItem.item
      this.setEquippedForItem(equipment.secondaryRangedWeapon, true, ownerInfo)
    } else if (weapon.attackType === AttackTypes.Melee) {
      this.setEquippedForItem(equipment.meleeWeapon, false, ownerInfo)
      equipment.meleeWeapon = useItem.item
      this.setEquippedForItem(equipment.meleeWeapon, true, ownerInfo)
    }
  }

  setEquippedForItem(item: EntityId, equipped: boolean, ownerInfo: Info) {
    if (item === -1) {
      return
    }
    const itemInfo = InfoComponent.values[item]

    this.log.addMessage(
      `${ownerInfo.name} ${equipped ? '' : 'un'}equipped ${itemInfo.name}`,
    )

    EquippableComponent.values[item].equipped = equipped
  }

  processSingleTargetEntityAttack(
    world: World,
    useItem: WantUseItem,
    targeting: Targeting,
    attackType: AttackType,
    baseDamage: number,
    radius: number,
    pierce: number,
  ) {
    let targets: Vector2[] = []
    const targetEntities: EntityId[] = []

    if (radius > 0) {
      targets = processFOV(this.map, targeting.position, radius)
    } else if (pierce > 0) {
      const startPosition = PositionComponent.values[useItem.owner]
      const slopeVector = {
        x: targeting.position.x - startPosition.x,
        y: targeting.position.y - startPosition.y,
      }
      const points = getPointsInLine(
        startPosition,
        add(startPosition, mulConst(slopeVector, 99)),
      )
      let i = 0
      let hitWall = false
      let pierceCount = 0
      do {
        i++
        const point = points[i]
        if (
          !this.map.isWalkable(point.x, point.y) ||
          (this.map.isInBounds(point.x, point.y) &&
            this.map.tiles[point.x][point.y].name === 'Door Closed')
        ) {
          hitWall = true
        } else {
          const entities = this.map.getEntitiesAtLocation(point)
          const blocker = entities.find((a) =>
            hasComponent(world, a, SuitStatsComponent),
          )
          if (blocker !== undefined) {
            pierceCount++
            targets.push(point)
          }
        }
      } while (i < points.length && !hitWall && pierceCount < pierce)
    } else {
      targets.push(targeting.position)
    }

    targets.forEach((t) => {
      const entities = this.map.getEntitiesAtLocation(t)
      const targetEntity = entities.find((a) =>
        hasComponent(world, a, SuitStatsComponent),
      )
      if (targetEntity !== undefined) {
        targetEntities.push(targetEntity)
      }
    })

    if (targetEntities.length > 0) {
      if (baseDamage > 0) {
        this.processWantAttack(world, useItem, targetEntities, attackType)
      }
      targetEntities.forEach((e) => {
        if (
          e !== useItem.owner &&
          hasComponent(world, useItem.item, CauseEffectComponent)
        ) {
          this.processWantEffect(world, useItem, e)
        }
      })
      createAnimation(
        world,
        this.map,
        useItem.item,
        PositionComponent.values[useItem.owner],
        '',
        undefined,
        targeting.position,
      )
      this.actionSuccess(world, useItem.item, '')
    } else {
      this.actionError(useItem.owner, 'Invalid target selected')
    }
  }

  processWantAttack(
    world: World,
    useItem: WantUseItem,
    targetEntity: EntityId[],
    attackType: AttackType,
  ) {
    const attack = addEntity(world)
    addComponent(world, attack, WantAttackComponent)
    WantAttackComponent.values[attack] = {
      attackType,
      attacker: useItem.owner,
      defender: targetEntity,
      itemUsed: useItem.item,
    }
  }

  processWantEffect(
    world: World,
    useItem: WantUseItem,
    targetEntity: EntityId,
  ) {
    const effect = addEntity(world)
    addComponent(world, effect, WantCauseEffectComponent)
    WantCauseEffectComponent.values[effect] = {
      attacker: useItem.owner,
      defender: targetEntity,
      effectItem: useItem.item,
    }
  }

  actionSuccess(_world: World, _item: EntityId, message: string) {
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
