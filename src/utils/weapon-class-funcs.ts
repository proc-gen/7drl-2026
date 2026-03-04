import { WeaponClasses, type WeaponClass } from '../constants'
import type { Stats, Weapon } from '../ecs/components'

export const getWeaponClassStatsForWeapon = (
  weapon: Weapon | undefined,
  stats: Stats,
  weaponClassOverride: WeaponClass[] = [WeaponClasses.Melee] as WeaponClass[],
) => {
  let classStats = {
    damageMultiplier: 1,
    additionalShotChance: 0,
    splashRadius: 0,
    knockback: 0,
    energyDiscount: 0,
  }

  const classes = weapon?.weaponClasses ?? weaponClassOverride
  classes.forEach((weaponClass) => {
    if (weaponClass === WeaponClasses.Melee) {
      switch (stats.meleeLevel) {
        case 0:
          break
        case 1:
          classStats.damageMultiplier += 0.1
          break
        case 2:
          classStats.damageMultiplier += 0.2
          break
        case 3:
          classStats.damageMultiplier += 0.2
          classStats.energyDiscount -= 1
          break
        case 4:
          classStats.damageMultiplier += 0.4
          classStats.energyDiscount -= 1
          break
        default:
          classStats.damageMultiplier += 0.4
          classStats.energyDiscount -= 2
          break
      }
    } else if (weaponClass === WeaponClasses.SingleTarget) {
      switch (stats.singleTargetLevel) {
        case 0:
          break
        case 1:
          classStats.damageMultiplier += 0.05
          break
        case 2:
          classStats.damageMultiplier += 0.1
          break
        case 3:
          classStats.damageMultiplier += 0.1
          classStats.additionalShotChance += 0.25
          break
        case 4:
          classStats.damageMultiplier += 0.2
          classStats.additionalShotChance += 0.25
          break
        default:
          classStats.damageMultiplier += 0.2
          classStats.additionalShotChance += 0.5
          break
      }
    } else if (weaponClass === WeaponClasses.Thrown) {
      switch (stats.thrownWeaponLevel) {
        case 0:
          break
        case 1:
          classStats.damageMultiplier += 0.05
          break
        case 2:
          classStats.damageMultiplier += 0.1
          break
        case 3:
          classStats.damageMultiplier += 0.1
          classStats.splashRadius += 1
          break
        case 4:
          classStats.damageMultiplier += 0.2
          classStats.splashRadius += 1
          break
        default:
          classStats.damageMultiplier += 0.2
          classStats.splashRadius += 2
          break
      }
    } else if (weaponClass === WeaponClasses.Explosive) {
      switch (stats.explosiveWeaponLevel) {
        case 0:
          break
        case 1:
          classStats.damageMultiplier += 0.05
          break
        case 2:
          classStats.damageMultiplier += 0.1
          break
        case 3:
          classStats.damageMultiplier += 0.1
          classStats.splashRadius += 1
          break
        case 4:
          classStats.damageMultiplier += 0.2
          classStats.splashRadius += 1
          break
        default:
          classStats.damageMultiplier += 0.2
          classStats.splashRadius += 2
          classStats.knockback += 1 * ((weapon?.knockback ?? 1) > 0 ? 1 : -1)
          break
      }
    }
  })

  return classStats
}
