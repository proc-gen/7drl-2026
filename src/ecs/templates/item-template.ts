import {
  addComponent,
  addComponents,
  addEntity,
  type EntityId,
  type World,
} from 'bitecs'
import type { Vector2 } from '../../types'
import {
  AmmunitionComponent,
  ArmorComponent,
  ConfusionComponent,
  ConsumableComponent,
  EquippableComponent,
  HealComponent,
  InfoComponent,
  ItemComponent,
  OwnerComponent,
  PositionComponent,
  RangedWeaponComponent,
  RenderableComponent,
  RenderLayerItemComponent,
  SpellComponent,
  TargetingComponent,
  WeaponComponent,
} from '../components'
import {
  TargetingTypes,
  type TargetingType,
  EquipmentTypes,
  ConsumableTypes,
  ItemTypes,
  Colors,
  AttackTypes,
  type AttackType,
  AmmunitionTypes,
  type AmmunitionType,
} from '../../constants'
import { ZeroVector } from '../../utils/vector-2-funcs'

export const createItem = (
  world: World,
  name: string,
  position: Vector2 | undefined,
  owner: EntityId | undefined,
) => {
  const itemStats = itemStatLookup(name)
  if (itemStats === undefined) {
    return
  }

  const item = addEntity(world)

  addComponents(
    world,
    item,
    InfoComponent,
    ItemComponent,
    RenderableComponent,
    RenderLayerItemComponent,
  )

  InfoComponent.values[item] = { name }
  RenderableComponent.values[item] = {
    char: itemStats.char,
    fg: itemStats.fg,
    bg: itemStats.bg,
  }

  if (position !== undefined) {
    addComponent(world, item, PositionComponent)
    PositionComponent.values[item] = { ...position }
  }

  if (owner !== undefined) {
    addComponent(world, item, OwnerComponent)
    OwnerComponent.values[item] = { owner }
  }

  if (itemStats.itemType === ItemTypes.Consumable) {
    createConsumableComponents(world, item, name)
  } else if (itemStats.itemType === ItemTypes.Equipment) {
    createEquipmentComponents(world, item, name, owner)
  } else if(itemStats.itemType === ItemTypes.Ammunition) {
    createAmmunitionComponents(world, item, name)
  }

  createEffectComponents(world, item, name)

  return item
}

const createConsumableComponents = (
  world: World,
  item: EntityId,
  name: string,
) => {
  const consumableStats = consumableStatLookup(name)
  if (consumableStats === undefined) {
    return
  }

  addComponent(world, item, ConsumableComponent)

  if (consumableStats.consumableType === ConsumableTypes.Heal) {
    addComponent(world, item, HealComponent)
    HealComponent.values[item] = { amount: consumableStats.damage * -1 }
  } else if (consumableStats.consumableType === ConsumableTypes.Spell) {
    addComponent(world, item, SpellComponent)
    SpellComponent.values[item] = {
      range: consumableStats.range,
      damage: consumableStats.damage,
      spellName: consumableStats.spellName,
    }
  }
}

const createAmmunitionComponents = (world: World, item: EntityId, name: string) => {
  let ammunitionType: AmmunitionType | undefined = undefined
  if(name === "Arrows"){
    ammunitionType = AmmunitionTypes.Arrow as AmmunitionType
  } else if(name === "Stones"){
    ammunitionType = AmmunitionTypes.Stone as AmmunitionType
  }

  if(ammunitionType !== undefined){
    addComponent(world, item, AmmunitionComponent)
    AmmunitionComponent.values[item] = {
      projectileCount: 20,
      ammunitionType 
    }
  }
}

const createEquipmentComponents = (
  world: World,
  item: EntityId,
  name: string,
  owner: EntityId | undefined,
) => {
  const eqipmentStats = equipmentStatLookup(name)
  if (eqipmentStats === undefined) {
    return
  }

  addComponent(world, item, EquippableComponent)
  EquippableComponent.values[item] = {
    equipped: owner !== undefined,
  }
  if (eqipmentStats.equipmentType === EquipmentTypes.Armor) {
    addComponent(world, item, ArmorComponent)
    ArmorComponent.values[item] = { defense: eqipmentStats.amount }
  } else if (eqipmentStats.equipmentType === EquipmentTypes.Weapon) {
    addComponent(world, item, WeaponComponent)
    const attackType = weaponAttackTypeLookup(name)!
    WeaponComponent.values[item] = {
      attack: eqipmentStats.amount,
      attackType: attackType as AttackType,
    }

    if (attackType === AttackTypes.Ranged) {
      const rangedStats = rangedWeaponStatLookup(name)
      if (rangedStats !== undefined) {
        addComponents(world, item, RangedWeaponComponent, TargetingComponent)
        RangedWeaponComponent.values[item] = {
          range: rangedStats.range,
          ammunitionType: rangedStats.ammunitionType as AmmunitionType,
          currentAmmunition: rangedStats.currentAmmunition,
          maxAmmunition: rangedStats.maxAmmunition,
        }
        TargetingComponent.values[item] = {
          targetingType: rangedStats.targetingType as TargetingType,
          position: { ...ZeroVector },
        }
      }
    }
  }
}

const createEffectComponents = (world: World, item: EntityId, name: string) => {
  if (name === 'Confusion Scroll') {
    addComponents(world, item, ConfusionComponent, TargetingComponent)
    ConfusionComponent.values[item] = { turnsLeft: 10 }
    TargetingComponent.values[item] = {
      targetingType: TargetingTypes.SingleTargetEntity as TargetingType,
      position: { ...ZeroVector },
    }
  } else if (name === 'Fireball Scroll') {
    addComponent(world, item, TargetingComponent)
    TargetingComponent.values[item] = {
      targetingType: TargetingTypes.SingleTargetPosition as TargetingType,
      position: { ...ZeroVector },
    }

    SpellComponent.values[item].radius = 3
  }
}

const itemStatLookup = (name: string) => {
  if (name === 'Health Potion') {
    return {
      char: '¡',
      itemType: ItemTypes.Consumable,
      fg: Colors.HealthBar,
      bg: null,
    }
  } else if (name === 'Lightning Scroll') {
    return {
      char: '~',
      itemType: ItemTypes.Consumable,
      fg: Colors.LightningScroll,
      bg: null,
    }
  } else if (name === 'Confusion Scroll') {
    return {
      char: '~',
      itemType: ItemTypes.Consumable,
      fg: Colors.ConfusionScroll,
      bg: null,
    }
  } else if (name === 'Fireball Scroll') {
    return {
      char: '~',
      itemType: ItemTypes.Consumable,
      fg: Colors.FireballScroll,
      bg: null,
    }
  } else if (name === 'Dagger') {
    return {
      char: '/',
      itemType: ItemTypes.Equipment,
      fg: Colors.WeaponPickup,
      bg: null,
    }
  } else if (name === 'Sword') {
    return {
      char: '/',
      itemType: ItemTypes.Equipment,
      fg: Colors.WeaponPickup,
      bg: null,
    }
  } else if (name === 'Sling') {
    return {
      char: 'δ',
      itemType: ItemTypes.Equipment,
      fg: Colors.WeaponPickup,
      bg: null,
    }
  } else if (name === 'Bow') {
    return {
      char: ')',
      itemType: ItemTypes.Equipment,
      fg: Colors.WeaponPickup,
      bg: null,
    }
  } else if (name === 'Stones') {
    return {
      char: ':',
      itemType: ItemTypes.Ammunition,
      fg: Colors.AmmunitionPickup,
      bg: null,
    }
  } else if (name === 'Arrows') {
    return {
      char: '¥',
      itemType: ItemTypes.Ammunition,
      fg: Colors.AmmunitionPickup,
      bg: null,
    }
  } else if (name === 'Leather Armor') {
    return {
      char: '[',
      itemType: ItemTypes.Equipment,
      fg: Colors.ArmorPickup,
      bg: null,
    }
  } else if (name === 'Chain Mail') {
    return {
      char: '[',
      itemType: ItemTypes.Equipment,
      fg: Colors.ArmorPickup,
      bg: null,
    }
  }

  return undefined
}

const consumableStatLookup = (name: string) => {
  if (name === 'Health Potion') {
    return {
      consumableType: ConsumableTypes.Heal,
      damage: -4,
      amount: 1,
      range: 0,
      spellName: '',
    }
  } else if (name === 'Lightning Scroll') {
    return {
      consumableType: ConsumableTypes.Spell,
      amount: 1,
      damage: 20,
      range: 5,
      spellName: 'Lightning',
    }
  } else if (name === 'Confusion Scroll') {
    return {
      consumableType: ConsumableTypes.Spell,
      amount: 1,
      damage: 0,
      range: 8,
      spellName: 'Confusion',
    }
  } else if (name === 'Fireball Scroll') {
    return {
      consumableType: ConsumableTypes.Spell,
      amount: 1,
      damage: 12,
      range: 8,
      spellName: 'Fireball',
    }
  }

  return undefined
}

const equipmentStatLookup = (name: string) => {
  if (name === 'Dagger') {
    return {
      equipmentType: EquipmentTypes.Weapon,
      amount: 2,
    }
  } else if (name === 'Sword') {
    return {
      equipmentType: EquipmentTypes.Weapon,
      amount: 4,
    }
  } else if (name === 'Sling') {
    return {
      equipmentType: EquipmentTypes.Weapon,
      amount: 1,
    }
  } else if (name === 'Bow') {
    return {
      equipmentType: EquipmentTypes.Weapon,
      amount: 3,
    }
  } else if (name === 'Leather Armor') {
    return {
      equipmentType: EquipmentTypes.Armor,
      amount: 1,
    }
  } else if (name === 'Chain Mail') {
    return {
      equipmentType: EquipmentTypes.Armor,
      amount: 3,
    }
  }

  return undefined
}

const weaponAttackTypeLookup = (name: string) => {
  switch (name) {
    case 'Dagger':
    case 'Sword':
      return AttackTypes.Melee
    case 'Sling':
    case 'Bow':
      return AttackTypes.Ranged
  }
  return AttackTypes.Melee
}

const rangedWeaponStatLookup = (name: string) => {
  if (name === 'Sling') {
    return {
      range: 4,
      ammunitionType: AmmunitionTypes.Stone,
      currentAmmunition: 1,
      maxAmmunition: 1,
      targetingType: TargetingTypes.SingleTargetEntity,
    }
  } else if (name === 'Bow') {
    return {
      range: 6,
      ammunitionType: AmmunitionTypes.Arrow,
      currentAmmunition: 1,
      maxAmmunition: 1,
      targetingType: TargetingTypes.SingleTargetEntity,
    }
  }

  return undefined
}
