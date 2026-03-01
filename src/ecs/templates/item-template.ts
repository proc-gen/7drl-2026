import {
  addComponent,
  addComponents,
  addEntity,
  type EntityId,
  type World,
} from 'bitecs'
import type { Vector2 } from '../../types'
import {
  CauseEffectComponent,
  EquippableComponent,
  InfoComponent,
  ItemComponent,
  OwnerComponent,
  PositionComponent,
  RangedWeaponComponent,
  RenderableComponent,
  RenderLayerItemComponent,
  TargetingComponent,
  WeaponComponent,
} from '../components'
import {
  TargetingTypes,
  type TargetingType,
  EquipmentTypes,
  ItemTypes,
  Colors,
  AttackTypes,
  type AttackType,
  AmmunitionTypes,
  type AmmunitionType,
  type ItemType,
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

  if (itemStats.itemType === ItemTypes.Equipment) {
    createEquipmentComponents(world, item, name, owner)
  }

  return item
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
  if (eqipmentStats === EquipmentTypes.Weapon) {
    addComponent(world, item, WeaponComponent)
    const attackType = weaponAttackTypeLookup(name)!

    if (attackType === AttackTypes.Melee) {
      const meleeStats = meleeWeaponStatLookup(name)
      if (meleeStats !== undefined) {
        WeaponComponent.values[item] = {
          attack: meleeStats.attackPower,
          attackType: attackType as AttackType,
          energyCost: meleeStats.energyDrain,
          knockback: 0,
          attacksPerTurn: 1,
          splashRadius: 0,
        }
      }
    } else if (
      [
        AttackTypes.Ranged,
        AttackTypes.RangedEnergy,
        AttackTypes.RangedPhysical,
      ].includes(attackType)
    ) {
      const rangedStats = rangedWeaponStatLookup(name)
      if (rangedStats !== undefined) {
        WeaponComponent.values[item] = {
          attack: rangedStats.attackPower,
          attackType: attackType as AttackType,
          energyCost: rangedStats.energyDrain,
          knockback: rangedStats.knockback,
          attacksPerTurn: rangedStats.shotsPerTurn,
          splashRadius: rangedStats.splashRadius,
        }

        addComponents(world, item, RangedWeaponComponent, TargetingComponent)
        RangedWeaponComponent.values[item] = {
          range: rangedStats.range,
          ammunitionType: rangedStats.ammunitionType as AmmunitionType,
          currentAmmunition: rangedStats.currentAmmunition,
          maxAmmunition: rangedStats.maxAmmunition,
          pierce: rangedStats.pierce
        }
        TargetingComponent.values[item] = {
          targetingType: rangedStats.targetingType as TargetingType,
          position: { ...ZeroVector },
        }

        if(rangedStats.effect !== undefined){
          addComponent(world, item, CauseEffectComponent)
          CauseEffectComponent.values[item] = {
            effectName: rangedStats.effect,
            effectTurns: 3
          }
        }
      }
    }
  }
}

const itemStatLookup = (name: string) => {
  let char: string | undefined = undefined
  let fg: string = Colors.WeaponPickup
  let itemType: ItemType = ItemTypes.Equipment as ItemType

  switch (name) {
    case 'Blaster':
      char = 'b'
      break
    case 'Laser Rifle':
      char = 'l'
      break
    case 'Energy Ripper':
      char = 'e'
      break
    case 'Rocket Launcher':
      char = 'r'
      break
    case 'Plasma Cannon':
      char = 'p'
      break
    case 'Exploding Discs':
      char = 'd'
      break
    case 'Beam Saw':
      char = 's'
      break
    case 'Flash Grenade':
      char = 'f'
      break
    case 'Sentry Bot-Ranged':
    case 'Sentry Boss-Ranged':
    case 'Cyborg-Ranged':
    case 'Damaged Cyborg-Ranged':
    case 'Exploding Spider-Melee':
    case 'Special Cyborg-Ranged':
    case 'Special Cyborg-Secondary':
    case 'Boss Cyborg-Ranged':
    case 'Boss Cyborg-Secondary':
      char = ''
      break
  }

  if (char !== undefined) {
    return {
      char,
      fg,
      itemType,
      bg: null,
    }
  }

  return undefined
}

const equipmentStatLookup = (name: string) => {
  switch (name) {
    case 'Blaster':
    case 'Laser Rifle':
    case 'Energy Ripper':
    case 'Rocket Launcher':
    case 'Plasma Cannon':
    case 'Exploding Discs':
    case 'Beam Saw':
    case 'Flash Grenade':
    case 'Sentry Bot-Ranged':
    case 'Sentry Boss-Ranged':
    case 'Cyborg-Ranged':
    case 'Damaged Cyborg-Ranged':
    case 'Exploding Spider-Melee':
    case 'Special Cyborg-Ranged':
    case 'Special Cyborg-Secondary':
    case 'Boss Cyborg-Ranged':
    case 'Boss Cyborg-Secondary':
      return EquipmentTypes.Weapon
  }

  return undefined
}

const weaponAttackTypeLookup = (name: string) => {
  switch (name) {
    case 'Beam Saw':
    case 'Exploding Spider-Melee':
      return AttackTypes.Melee
    case 'Blaster':
    case 'Laser Rifle':
    case 'Energy Ripper':
    case 'Plasma Cannon':
    case 'Sentry Bot-Ranged':
    case 'Sentry Boss-Ranged':
    case 'Cyborg-Ranged':
    case 'Damaged Cyborg-Ranged':
    case 'Special Cyborg-Ranged':
    case 'Boss Cyborg-Ranged':
      return AttackTypes.RangedEnergy
    case 'Rocket Launcher':
    case 'Exploding Discs':
    case 'Flash Grenade':
    case 'Special Cyborg-Secondary':
    case 'Boss Cyborg-Secondary':
      return AttackTypes.RangedPhysical
  }
  return AttackTypes.Melee
}

const meleeWeaponStatLookup = (name: string) => {
  if (name === 'Beam Saw') {
    return {
      attackPower: 25,
      energyDrain: 4,
    }
  }
}

const rangedWeaponStatLookup = (name: string) => {
  switch (name) {
    case 'Blaster':
      return {
        range: 5,
        ammunitionType: AmmunitionTypes.Energy,
        currentAmmunition: 6,
        maxAmmunition: 6,
        targetingType: TargetingTypes.SingleTargetEntity,
        energyDrain: 6,
        attackPower: 5,
        shotsPerTurn: 1,
        knockback: 0,
        splashRadius: 0,
        pierce: 0,
        effect: undefined,
      }
    case 'Sentry Bot-Ranged':
      return {
        range: 3,
        ammunitionType: AmmunitionTypes.Energy,
        currentAmmunition: 2,
        maxAmmunition: 2,
        targetingType: TargetingTypes.SingleTargetEntity,
        energyDrain: 2,
        attackPower: 2,
        shotsPerTurn: 1,
        knockback: 0,
        splashRadius: 0,
        pierce: 0,
        effect: undefined,
      }
    case 'Sentry Boss-Ranged':
      return {
        range: 4,
        ammunitionType: AmmunitionTypes.Energy,
        currentAmmunition: 4,
        maxAmmunition: 4,
        targetingType: TargetingTypes.SingleTargetEntity,
        energyDrain: 4,
        attackPower: 4,
        shotsPerTurn: 2,
        knockback: 0,
        splashRadius: 0,
        pierce: 0,
        effect: undefined,
      }
    case 'Laser Rifle':
      return {
        range: 99,
        ammunitionType: AmmunitionTypes.Energy,
        currentAmmunition: 4,
        maxAmmunition: 4,
        targetingType: TargetingTypes.SingleTargetPosition,
        energyDrain: 12,
        attackPower: 15,
        shotsPerTurn: 1,
        knockback: 0,
        splashRadius: 0,
        pierce: 99,
        effect: undefined,
      }
    case 'Energy Ripper':
      return {
        range: 6,
        ammunitionType: AmmunitionTypes.Energy,
        currentAmmunition: 24,
        maxAmmunition: 24,
        targetingType: TargetingTypes.SingleTargetEntity,
        energyDrain: 18,
        attackPower: 7,
        shotsPerTurn: 3,
        knockback: 0,
        splashRadius: 0,
        pierce: 0,
        effect: undefined,
      }
    case 'Cyborg-Ranged':
    case 'Damaged Cyborg-Ranged':
      return {
        range: 5,
        ammunitionType: AmmunitionTypes.Energy,
        currentAmmunition: 12,
        maxAmmunition: 12,
        targetingType: TargetingTypes.SingleTargetEntity,
        energyDrain: 9,
        attackPower: 2,
        shotsPerTurn: 3,
        knockback: 0,
        splashRadius: 0,
        pierce: 0,
        effect: undefined,
      }
    case 'Special Cyborg-Ranged':
      return {
        range: 6,
        ammunitionType: AmmunitionTypes.Energy,
        currentAmmunition: 12,
        maxAmmunition: 12,
        targetingType: TargetingTypes.SingleTargetEntity,
        energyDrain: 9,
        attackPower: 3,
        shotsPerTurn: 3,
        knockback: 0,
        splashRadius: 0,
        pierce: 0,
        effect: undefined,
      }
    case 'Boss Cyborg-Ranged':
      return {
        range: 6,
        ammunitionType: AmmunitionTypes.Energy,
        currentAmmunition: 15,
        maxAmmunition: 15,
        targetingType: TargetingTypes.SingleTargetEntity,
        energyDrain: 9,
        attackPower: 5,
        shotsPerTurn: 3,
        knockback: 0,
        splashRadius: 0,
        pierce: 0,
        effect: undefined,
      }
    case 'Rocket Launcher':
      return {
        range: 10,
        ammunitionType: AmmunitionTypes.Rockets,
        currentAmmunition: 1,
        maxAmmunition: 1,
        targetingType: TargetingTypes.SingleTargetPosition,
        energyDrain: 0,
        attackPower: 50,
        shotsPerTurn: 1,
        knockback: 1,
        splashRadius: 3,
        pierce: 0,
        effect: undefined,
      }
    case 'Plasma Cannon':
      return {
        range: 10,
        ammunitionType: AmmunitionTypes.Energy,
        currentAmmunition: 1,
        maxAmmunition: 1,
        targetingType: TargetingTypes.SingleTargetPosition,
        energyDrain: 10,
        attackPower: 35,
        shotsPerTurn: 1,
        knockback: 1,
        splashRadius: 3,
        pierce: 0,
        effect: undefined,
      }
    case 'Exploding Discs':
      return {
        range: 12,
        ammunitionType: AmmunitionTypes.Discs,
        currentAmmunition: 10,
        maxAmmunition: 10,
        targetingType: TargetingTypes.SingleTargetPosition,
        energyDrain: 0,
        attackPower: 15,
        shotsPerTurn: 1,
        knockback: -1,
        splashRadius: 2,
        pierce: 0,
        effect: undefined,
      }
    case 'Flash Grenade':
      return {
        range: 10,
        ammunitionType: AmmunitionTypes.Grenades,
        currentAmmunition: 5,
        maxAmmunition: 5,
        targetingType: TargetingTypes.SingleTargetPosition,
        energyDrain: 0,
        attackPower: 10,
        shotsPerTurn: 1,
        knockback: 0,
        splashRadius: 1,
        pierce: 0,
        effect: 'Blind',
      }
  }

  return undefined
}
