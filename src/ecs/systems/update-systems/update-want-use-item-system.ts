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
  ArmorComponent,
  ConsumableComponent,
  EquipmentComponent,
  EquippableComponent,
  HealComponent,
  HealthComponent,
  InfoComponent,
  OwnerComponent,
  PlayerComponent,
  PositionComponent,
  RangedWeaponComponent,
  RemoveComponent,
  SpellComponent,
  StatsComponent,
  TargetingComponent,
  WantAttackComponent,
  WantCauseSpellEffectComponent,
  WantUseItemComponent,
  WeaponComponent,
  type Equipment,
  type Info,
  type Spell,
  type Targeting,
  type WantUseItem,
} from '../../components'
import type { Map } from '../../../map'
import { distance } from '../../../utils/vector-2-funcs'
import {
  AttackTypes,
  TargetingTypes,
  EquipmentTypes,
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
        if (hasComponent(world, useItem.item, ConsumableComponent)) {
          this.useConsumableItem(world, useItem)
        } else if (hasComponent(world, useItem.item, EquippableComponent)) {
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

  useConsumableItem(world: World, useItem: WantUseItem) {
    if (hasComponent(world, useItem.item, HealComponent)) {
      this.processHeal(world, useItem)
    } else if (hasComponent(world, useItem.item, SpellComponent)) {
      this.processSpell(world, useItem)
    } else {
      this.actionError(useItem.owner, 'Invalid consumable item selected')
    }
  }

  useEquippableItem(world: World, useItem: WantUseItem) {
    const equipment = EquipmentComponent.values[useItem.owner]

    if (equipment.weapon !== useItem.item) {
      this.equipItem(world, useItem, equipment)
    } else {
      this.attackWithEquippedWeapon(world, useItem)
    }
  }

  attackWithEquippedWeapon(world: World, useItem: WantUseItem) {
    if (hasComponent(world, useItem.item, RangedWeaponComponent)) {
      const weapon = WeaponComponent.values[useItem.item]
      const targeting = TargetingComponent.values[useItem.item]
      this.processSingleTargetEntityAttack(
        world,
        useItem,
        targeting,
        weapon.attackType,
        weapon.attack,
      )
    } else {
      this.actionError(useItem.owner, `Invalid weapon used`)
    }
  }

  equipItem(world: World, useItem: WantUseItem, equipment: Equipment) {
    const ownerInfo = InfoComponent.values[useItem.owner]
    let equipmentType = EquipmentTypes.Armor
    if (hasComponent(world, useItem.item, WeaponComponent)) {
      equipmentType = EquipmentTypes.Weapon
    }

    if (equipmentType === EquipmentTypes.Armor) {
      this.setEquippedForItem(equipment.armor, false, ownerInfo)
      equipment.armor = useItem.item
      this.setEquippedForItem(equipment.armor, true, ownerInfo)
    } else {
      this.setEquippedForItem(equipment.weapon, false, ownerInfo)
      equipment.weapon = useItem.item
      this.setEquippedForItem(equipment.weapon, true, ownerInfo)
    }

    const stats = StatsComponent.values[useItem.owner]
    const weaponMod =
      equipment.weapon !== -1 &&
      WeaponComponent.values[equipment.weapon].attackType === AttackTypes.Melee
        ? WeaponComponent.values[equipment.weapon].attack
        : 0
    const rangedWeaponMod =
      equipment.weapon !== -1 &&
      WeaponComponent.values[equipment.weapon].attackType === AttackTypes.Ranged
        ? WeaponComponent.values[equipment.weapon].attack
        : 0
    const armorMod =
      equipment.armor !== -1
        ? ArmorComponent.values[equipment.armor].defense
        : 0
    stats.currentDefense = stats.defense + armorMod
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

  processHeal(world: World, useItem: WantUseItem) {
    const heal = HealComponent.values[useItem.item]
    const health = HealthComponent.values[useItem.owner]
    if (health.current === health.max) {
      this.actionError(useItem.owner, 'Health is already full')
    } else {
      const healAmount = Math.floor(
        Math.min(health.max - health.current, heal.amount),
      )
      health.current += healAmount
      const infoOwner = InfoComponent.values[useItem.owner]
      const infoItem = InfoComponent.values[useItem.item]

      createAnimation(
        world,
        this.map,
        useItem.item,
        PositionComponent.values[useItem.owner],
      )

      if(hasComponent(world, useItem.owner, PlayerComponent)){
        this.gameStats.healthPotionsDrank++
      }

      this.actionSuccess(
        world,
        useItem.item,
        `${infoOwner.name} uses ${infoItem.name} to heal ${healAmount} hp`,
      )
    }
  }

  processSpell(world: World, useItem: WantUseItem) {
    const spell = SpellComponent.values[useItem.item]
    if (!hasComponent(world, useItem.item, TargetingComponent)) {
      this.processRandomTargetSpell(world, useItem, spell)
    } else if (hasComponent(world, useItem.item, TargetingComponent)) {
      const targeting = TargetingComponent.values[useItem.item]
      if (targeting.targetingType === TargetingTypes.SingleTargetEntity) {
        this.processSingleTargetEntitySpell(world, useItem, spell, targeting)
      } else if (
        targeting.targetingType === TargetingTypes.SingleTargetPosition
      ) {
        this.processSingleTargetPositionSpell(world, useItem, spell, targeting)
      }
    } else {
      this.actionError(useItem.owner, 'Invalid consumable item selected')
    }
  }

  processRandomTargetSpell(world: World, useItem: WantUseItem, spell: Spell) {
    const position = PositionComponent.values[useItem.owner]
    const fov = processFOV(this.map, position, spell.range)
    const sortedFov = fov.toSorted((a, b) => {
      return distance(a, position) - distance(b, position)
    })

    let targetEntity: EntityId | undefined = undefined
    let i = 0
    do {
      const entities = this.map.getEntitiesAtLocation(sortedFov[i])
      targetEntity = entities.find((a) =>
        hasComponent(world, a, HealthComponent),
      )

      if (targetEntity === useItem.owner) {
        targetEntity = undefined
      }

      i++
    } while (targetEntity === undefined && i < sortedFov.length)

    if (targetEntity !== undefined) {
      if (spell.damage > 0) {
        this.processWantAttack(
          world,
          useItem,
          targetEntity,
          AttackTypes.Spell as AttackType,
        )
      }
      if (this.hasSpellEffect(spell.spellName)) {
        this.processWantSpellEffect(world, useItem, targetEntity)
      }
      createAnimation(
        world,
        this.map,
        useItem.item,
        PositionComponent.values[useItem.owner],
        '',
        undefined,
        PositionComponent.values[targetEntity],
      )
      this.actionSuccess(world, useItem.item, '')
    } else {
      this.actionError(useItem.owner, 'No one in targeting range')
    }
  }

  processSingleTargetEntitySpell(
    world: World,
    useItem: WantUseItem,
    spell: Spell,
    targeting: Targeting,
  ) {
    this.processSingleTargetEntityAttack(
      world,
      useItem,
      targeting,
      AttackTypes.Spell as AttackType,
      spell.damage,
      spell.radius ?? 0,
      spell.spellName,
    )
  }

  processSingleTargetEntityAttack(
    world: World,
    useItem: WantUseItem,
    targeting: Targeting,
    attackType: AttackType,
    baseDamage: number,
    radius: number = 0,
    spellName: string = '',
  ) {
    let targets: Vector2[] = [targeting.position]
    const targetEntities: EntityId[] = []

    if (radius > 0) {
      targets = processFOV(this.map, targeting.position, radius)
    }

    targets.forEach((t) => {
      const entities = this.map.getEntitiesAtLocation(t)
      const targetEntity = entities.find((a) =>
        hasComponent(world, a, HealthComponent),
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
        if (this.hasSpellEffect(spellName)) {
          this.processWantSpellEffect(world, useItem, e)
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

  processSingleTargetPositionSpell(
    world: World,
    useItem: WantUseItem,
    spell: Spell,
    targeting: Targeting,
  ) {
    let targets: Vector2[] = [targeting.position]
    const targetEntities: EntityId[] = []

    if (spell.radius !== undefined) {
      targets = processFOV(this.map, targeting.position, spell.radius)
    }
    targets.forEach((t) => {
      const entities = this.map.getEntitiesAtLocation(t)
      const targetEntity = entities.find((a) =>
        hasComponent(world, a, HealthComponent),
      )
      if (targetEntity !== undefined) {
        targetEntities.push(targetEntity)
      }
    })

    if (targetEntities.length > 0) {
      targetEntities.forEach((e) => {
        if (spell.damage > 0) {
          this.processWantAttack(
            world,
            useItem,
            e,
            AttackTypes.Spell as AttackType,
          )
        }
        if (this.hasSpellEffect(spell.spellName)) {
          this.processWantSpellEffect(world, useItem, e)
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

  processWantSpellEffect(
    world: World,
    useItem: WantUseItem,
    targetEntity: EntityId,
  ) {
    const effect = addEntity(world)
    addComponent(world, effect, WantCauseSpellEffectComponent)
    WantCauseSpellEffectComponent.values[effect] = {
      attacker: useItem.owner,
      defender: targetEntity,
      spell: useItem.item,
    }
  }

  hasSpellEffect(spellName: string) {
    let hasEffect = false
    if (spellName === 'Confusion') {
      hasEffect = true
    }
    return hasEffect
  }

  actionSuccess(world: World, item: EntityId, message: string) {
    if (message.length > 0) {
      this.log.addMessage(message)
    }
    if (hasComponent(world, item, ConsumableComponent)) {
      addComponent(world, item, RemoveComponent)
    }
  }

  actionError(owner: EntityId, error: string) {
    this.log.addMessage(error)
    const action = ActionComponent.values[owner]
    action.actionSuccessful = false
  }
}
