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
      const infoBlocker = InfoComponent.values[attack.defender]
      const statsBlocker = StatsComponent.values[attack.defender]
      const healthBlocker = SuitStatsComponent.values[attack.defender]
      const weapon =
        attack.itemUsed !== undefined
          ? WeaponComponent.values[attack.itemUsed]
          : undefined
      const numAttacks = weapon?.attacksPerTurn ?? 1

      for (let i = 0; i < numAttacks; i++) {
        let processedAttack: { damage: number; message: string } | undefined = {
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
              if (hasComponent(world, attack.defender, PlayerComponent)) {
                addComponent(world, attack.defender, DeadComponent)
                this.gameStats.killedBy = infoActor.name
              } else {
                const gainedXp = StatsComponent.values[attack.defender].xpGiven
                PlayerComponent.values[attack.attacker].currentXp += gainedXp
                this.log.addMessage(`You gain ${gainedXp} experience points`)
                this.gameStats.enemiesKilled++

                addComponents(
                  world,
                  attack.defender,
                  RemoveComponent,
                  DeadComponent,
                )
              }

              removeComponent(world, attack.defender, AliveComponent)
            }
          }
        }
      }
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
  ) {
    const rangedWeapon = RangedWeaponComponent.values[attack.itemUsed!]
    if (rangedWeapon.currentAmmunition > 0) {
      const damage = weapon!.attack
      rangedWeapon.currentAmmunition -= 1

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
