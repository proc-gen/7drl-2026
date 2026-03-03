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
  KeyComponent,
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
import { ConstMultiplyColor } from '../../utils/color-funcs'

export const createItem = (
  world: World,
  name: string,
  position: Vector2 | undefined,
  owner: EntityId | undefined,
  equippedOverride: boolean | undefined = undefined,
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

  InfoComponent.values[item] = { name, description: itemStats.description }
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
    createEquipmentComponents(world, item, name, owner, equippedOverride)
  } else if (itemStats.itemType === ItemTypes.Key) {
    let level = 1
    switch (name) {
      case 'Level 2 Key':
        level = 2
        break
      case 'Level 3 Key':
        level = 3
        break
    }
    addComponent(world, item, KeyComponent)
    KeyComponent.values[item] = {
      level,
    }
  }

  return item
}

const createEquipmentComponents = (
  world: World,
  item: EntityId,
  name: string,
  owner: EntityId | undefined,
  equippedOverride: boolean | undefined = undefined,
) => {
  const eqipmentStats = equipmentStatLookup(name)
  if (eqipmentStats === undefined) {
    return
  }

  addComponent(world, item, EquippableComponent)
  EquippableComponent.values[item] = {
    equipped:
      equippedOverride !== undefined ? equippedOverride : owner !== undefined,
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
          knockback: meleeStats.knockback,
          attacksPerTurn: 1,
          splashRadius: meleeStats.splashRadius,
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
          pierce: rangedStats.pierce,
        }
        TargetingComponent.values[item] = {
          targetingType: rangedStats.targetingType as TargetingType,
          position: { ...ZeroVector },
        }

        if (rangedStats.effect !== undefined) {
          addComponent(world, item, CauseEffectComponent)
          CauseEffectComponent.values[item] = {
            effectName: rangedStats.effect,
            effectTurns: 6,
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
  let description: string | undefined = undefined

  switch (name) {
    case 'Blaster':
      char = 'b'
      description = 'Standard issue energy pistol\n'
      description += '\nRange: 5              Clip Size: 6'
      description += '\nPower: 5              Recharge: 6 e'
      description += '\nShots Per Turn: 1     Piercing: 0'
      description += '\nKnockback: 0          Splash Radius: 0'
      break
    case 'Laser Rifle':
      char = 'l'
      description =
        'High powered energy rifle that pierces through all targets in a line\n'
      description += '\nRange: 99             Clip Size: 4'
      description += '\nPower: 15             Recharge: 12 e'
      description += '\nShots Per Turn: 1     Piercing: 99'
      description += '\nKnockback: 0          Splash Radius: 0'
      break
    case 'Energy Ripper':
      char = 'e'
      description = 'Burst fire energy weapon\n'
      description += '\nRange: 6              Clip Size: 24'
      description += '\nPower: 7              Recharge: 18 e'
      description += '\nShots Per Turn: 3     Piercing: 0'
      description += '\nKnockback: 0          Splash Radius: 0'
      break
    case 'Rocket Launcher':
      char = 'r'
      description = 'High powered explosive gun that requires rockets to fire\n'
      description += '\nRange: 10             Clip Size: 1'
      description += '\nPower: 50             Reload: 1 Rocket'
      description += '\nShots Per Turn: 1     Piercing: 0'
      description += '\nKnockback: 1          Splash Radius: 3'
      break
    case 'Plasma Cannon':
      char = 'p'
      description = 'Energy based explosive gun\n'
      description += '\nRange: 10             Clip Size: 1'
      description += '\nPower: 35             Recharge: 10 e'
      description += '\nShots Per Turn: 1     Piercing: 0'
      description += '\nKnockback: 1          Splash Radius: 3'
      break
    case 'Exploding Discs':
      char = 'd'
      description =
        'Thrown discs that explode and pull enemies towards the center\n'
      description += '\nRange: 12             Clip Size: N/A'
      description += '\nPower: 15             Reload: N/A'
      description += '\nAttacks Per Turn: 1   Piercing: N/A'
      description += '\nKnockback: -1         Splash Radius: 2'
      break
    case 'Beam Saw':
      char = 's'
      description =
        'Deadly melee weapon that uses energy to cut through the target\n'
      description += '\nRange: N/A            Clip Size: N/A'
      description += '\nPower: 25             Recharge: 4 e'
      description += '\nAttacks Per Turn: 1   Piercing: N/A'
      description += '\nKnockback: 0          Splash Radius: 0'
      break
    case 'Flash Grenade':
      char = 'f'
      description =
        'Low damage grenade that will blind all targets within visible range for 5 turns\n'
      description += '\nRange: 10             Clip Size: N/A'
      description += '\nPower: 10             Reload: N/A'
      description += '\nAttacks Per Turn: 1   Piercing: N/A'
      description += '\nKnockback: 0          Splash Radius: 1'
      break
    case 'Level 1 Key':
      char = '▄'
      description = 'The keycard to access level 2'
      fg = ConstMultiplyColor(Colors.L2Wall, 2)
      itemType = ItemTypes.Key as ItemType
      break
    case 'Level 2 Key':
      char = '▄'
      description = 'The keycard to access level 3'
      fg = ConstMultiplyColor(Colors.L2Wall, 3)
      itemType = ItemTypes.Key as ItemType
      break
    case 'Level 3 Key':
      char = '▄'
      description = 'The keycard to access level 4'
      fg = ConstMultiplyColor(Colors.L2Wall, 4)
      itemType = ItemTypes.Key as ItemType
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
      description,
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
      knockback: 0,
      splashRadius: 0,
    }
  } else if(name === 'Exploding Spider-Melee'){
    return {
      attackPower: 5,
      energyDrain: 0,
      knockback: 1,
      splashRadius: 2,
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
        range: 10,
        ammunitionType: AmmunitionTypes.Energy,
        currentAmmunition: 1,
        maxAmmunition: 1,
        targetingType: TargetingTypes.SingleTargetPosition,
        energyDrain: 10,
        attackPower: 15,
        shotsPerTurn: 1,
        knockback: 1,
        splashRadius: 3,
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
