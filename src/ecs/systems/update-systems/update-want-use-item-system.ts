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
  StatsComponent,
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
} from '../../components'
import type { Map } from '../../../map'
import {
  AttackTypes,
  TargetingTypes,
  type AttackType,
} from '../../../constants'
import { processFOV } from '../../../utils/fov-funcs'
import type { GameStats, Vector2 } from '../../../types'
import { createAnimation } from '../../templates'

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

    if (equipment.rangedWeapon !== useItem.item) {
      this.equipItem(world, useItem, equipment)
    } else {
      this.attackWithEquippedWeapon(world, useItem)
    }
  }

  attackWithEquippedWeapon(world: World, useItem: WantUseItem) {
    if (hasComponent(world, useItem.item, RangedWeaponComponent)) {
      const weapon = WeaponComponent.values[useItem.item]
      const targeting = TargetingComponent.values[useItem.item]
      if (targeting.targetingType === TargetingTypes.SingleTargetEntity) {
        this.processSingleTargetEntityAttack(
          world,
          useItem,
          targeting,
          weapon.attackType,
          weapon.attack,
          weapon.splashRadius,
        )
      } else if (
        targeting.targetingType === TargetingTypes.SingleTargetPosition
      ) {
        this.processSingleTargetEntityAttack(
          world,
          useItem,
          targeting,
          weapon.attackType,
          weapon.attack,
          weapon.splashRadius,
        )
      }
    } else {
      this.actionError(useItem.owner, `Invalid weapon used`)
    }
  }

  equipItem(world: World, useItem: WantUseItem, equipment: Equipment) {
    const ownerInfo = InfoComponent.values[useItem.owner]

    this.setEquippedForItem(equipment.rangedWeapon, false, ownerInfo)
    equipment.rangedWeapon = useItem.item
    this.setEquippedForItem(equipment.rangedWeapon, true, ownerInfo)

    const stats = StatsComponent.values[useItem.owner]
    const weaponMod =
      equipment.rangedWeapon !== -1 &&
      WeaponComponent.values[equipment.rangedWeapon].attackType ===
        AttackTypes.Melee
        ? WeaponComponent.values[equipment.rangedWeapon].attack
        : 0
    const rangedWeaponMod =
      equipment.rangedWeapon !== -1 &&
      WeaponComponent.values[equipment.rangedWeapon].attackType ===
        AttackTypes.Ranged
        ? WeaponComponent.values[equipment.rangedWeapon].attack
        : 0
    stats.currentStrength = stats.strength + weaponMod
    stats.currentRangedPower = stats.rangedPower + rangedWeaponMod
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
  ) {
    let targets: Vector2[] = [targeting.position]
    const targetEntities: EntityId[] = []

    if (radius > 0) {
      targets = processFOV(this.map, targeting.position, radius)
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
      targetEntities.forEach((e) => {
        if (baseDamage > 0) {
          this.processWantAttack(world, useItem, e, attackType)
        }
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
    targetEntity: EntityId,
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

  actionSuccess(world: World, item: EntityId, message: string) {
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
