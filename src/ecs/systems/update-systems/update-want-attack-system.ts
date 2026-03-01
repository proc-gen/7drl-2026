import {
  addComponent,
  addComponents,
  hasComponent,
  query,
  removeComponent,
  type EntityId,
  type World,
} from 'bitecs'
import type { UpdateSystem } from './update-system'
import {
  AliveComponent,
  DeadComponent,
  SuitStatsComponent,
  InfoComponent,
  PlayerComponent,
  RangedWeaponComponent,
  RemoveComponent,
  SpellComponent,
  StatsComponent,
  WantAttackComponent,
  type Info,
  type Stats,
  type WantAttack,
  WeaponComponent,
  type Weapon,
  MeleeWeaponComponent,
} from '../../components'
import { MessageLog } from '../../../utils/message-log'
import { AmmunitionTypes, AttackTypes, isRanged } from '../../../constants'
import type { GameStats } from '../../../types'

export class UpdateWantAttackSystem implements UpdateSystem {
  log: MessageLog
  gameStats: GameStats

  constructor(log: MessageLog, gameStats: GameStats) {
    this.log = log
    this.gameStats = gameStats
  }

  update(world: World, _entity: EntityId) {
    for (const eid of query(world, [WantAttackComponent])) {
      const attack = WantAttackComponent.values[eid]
      const infoActor = InfoComponent.values[attack.attacker]
      const statsAttacker = StatsComponent.values[attack.attacker]
      const weapon =
        attack.itemUsed !== undefined
          ? WeaponComponent.values[attack.itemUsed]
          : undefined
      const numAttacks = weapon?.attacksPerTurn ?? 1

      if (isRanged(attack.attackType)) {
        const rangedWeapon = RangedWeaponComponent.values[attack.itemUsed!]
        switch (rangedWeapon.ammunitionType) {
          case AmmunitionTypes.Energy:
          case AmmunitionTypes.Rockets:
            rangedWeapon.currentAmmunition -= weapon!.attacksPerTurn
            break
          case AmmunitionTypes.Grenades:
            SuitStatsComponent.values[attack.attacker].currentGrenades -= 1
            break
          case AmmunitionTypes.Discs:
            SuitStatsComponent.values[attack.attacker].currentDiscs -= 1
            break
        }
      }
      attack.defender.forEach((defender) => {
        const infoBlocker = InfoComponent.values[defender]
        const statsBlocker = StatsComponent.values[defender]
        const healthBlocker = SuitStatsComponent.values[defender]

        for (let i = 0; i < numAttacks; i++) {
          let processedAttack: { damage: number; message: string } | undefined =
            {
              damage: 0,
              message: '',
            }
          if (attack.attackType === AttackTypes.Melee) {
            processedAttack = this.processMeleeAttack(
              attack,
              statsAttacker,
              statsBlocker,
              infoActor,
              infoBlocker,
              weapon,
            )
          } else if (isRanged(attack.attackType)) {
            processedAttack = this.processRangedAttack(
              attack,
              statsAttacker,
              statsBlocker,
              infoActor,
              infoBlocker,
              weapon,
              world,
              defender,
            )
          }

          if (processedAttack !== undefined) {
            this.log.addMessage(processedAttack.message)
            if (processedAttack.damage > 0) {
              healthBlocker.currentShield = Math.max(
                0,
                healthBlocker.currentShield - processedAttack.damage,
              )

              if (healthBlocker.currentShield === 0) {
                this.log.addMessage(`${infoBlocker.name} has died.`)
                if (hasComponent(world, defender, PlayerComponent)) {
                  addComponent(world, defender, DeadComponent)
                  this.gameStats.killedBy = infoActor.name
                } else {
                  const gainedXp = StatsComponent.values[defender].xpGiven
                  PlayerComponent.values[attack.attacker].currentXp += gainedXp
                  this.log.addMessage(`You gain ${gainedXp} experience points`)
                  this.gameStats.enemiesKilled++

                  addComponents(world, defender, RemoveComponent, DeadComponent)
                }

                removeComponent(world, defender, AliveComponent)
              }
            }
          }
        }
      })

      addComponent(world, eid, RemoveComponent)
    }
  }

  processMeleeAttack(
    attack: WantAttack,
    statsAttacker: Stats,
    _statsBlocker: Stats,
    infoActor: Info,
    infoBlocker: Info,
    weapon: Weapon | undefined,
  ) {
    let damage = statsAttacker.currentStrength
    if (weapon !== undefined && weapon.attackType === AttackTypes.Melee) {
      damage = weapon.attack
    }
    const attackDescription = `${infoActor.name} attacks ${infoBlocker.name}`
    let message = ''
    if (damage > 0) {
      message = `${attackDescription} for ${damage} damage.`
    } else {
      message = `${attackDescription} but can't seem to leave a mark.`
    }

    return { damage, message }
  }

  processRangedAttack(
    attack: WantAttack,
    statsAttacker: Stats,
    _statsBlocker: Stats,
    infoActor: Info,
    infoBlocker: Info,
    weapon: Weapon | undefined,
    world: World,
    defender: EntityId,
  ) {
    if (hasComponent(world, defender, AliveComponent)) {
      const damage = weapon!.attack

      let attackVerb = 'shoots'

      const attackDescription = `${infoActor.name} ${attackVerb} ${infoBlocker.name}`
      let message = ''
      if (damage > 0) {
        message = `${attackDescription} for ${damage} damage.`
      } else {
        message = `${attackDescription} but couldn't hit the target.`
      }

      return { damage, message }
    }
    return undefined
  }
}
