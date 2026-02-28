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
  HealthComponent,
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
} from '../../components'
import { MessageLog } from '../../../utils/message-log'
import { AmmunitionTypes, AttackTypes } from '../../../constants'
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
      const healthBlocker = HealthComponent.values[attack.defender]

      let processedAttack = { damage: 0, message: '' }
      if (attack.attackType === AttackTypes.Melee) {
        processedAttack = this.processMeleeAttack(
          statsAttacker,
          statsBlocker,
          infoActor,
          infoBlocker,
        )
      } else if (attack.attackType === AttackTypes.Spell) {
        processedAttack = this.processSpellAttack(
          attack,
          statsAttacker,
          statsBlocker,
          infoActor,
          infoBlocker,
        )
      } else if(attack.attackType === AttackTypes.Ranged) {
        processedAttack = this.processRangedAttack(
          attack,
          statsAttacker,
          statsBlocker,
          infoActor,
          infoBlocker,
        )
      }

      this.log.addMessage(processedAttack.message)
      if (processedAttack.damage > 0) {
        healthBlocker.current = Math.max(
          0,
          healthBlocker.current - processedAttack.damage,
        )

        if (healthBlocker.current === 0) {
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

      addComponent(world, eid, RemoveComponent)
    }
  }

  processMeleeAttack(
    statsAttacker: Stats,
    statsBlocker: Stats,
    infoActor: Info,
    infoBlocker: Info,
  ) {
    const damage = statsAttacker.currentStrength - statsBlocker.currentDefense
    const attackDescription = `${infoActor.name} attacks ${infoBlocker.name}`
    let message = ''
    if (damage > 0) {
      message = `${attackDescription} for ${damage} health.`
    } else {
      message = `${attackDescription} but can't seem to leave a mark.`
    }

    return { damage, message }
  }

  processRangedAttack(
    attack: WantAttack,
    statsAttacker: Stats,
    statsBlocker: Stats,
    infoActor: Info,
    infoBlocker: Info,
  ) {
    const damage = statsAttacker.currentRangedPower
    const rangedWeapon = RangedWeaponComponent.values[attack.itemUsed!]
    rangedWeapon.currentAmmunition -= 1
    
    let attackVerb = ''
    if(rangedWeapon.ammunitionType === AmmunitionTypes.Arrow){
      attackVerb = 'shoots'
    }else if(rangedWeapon.ammunitionType === AmmunitionTypes.Stone){
      attackVerb = 'lobs a stone at'
    }
    const attackDescription = `${infoActor.name} ${attackVerb} ${infoBlocker.name}`
    let message = ''
    if(damage > 0){
      message = `${attackDescription} for ${damage} health.`
    }else {
      message = `${attackDescription} but couldn't hit the target.`
    }

    return { damage, message }
  }

  processSpellAttack(
    attack: WantAttack,
    statsAttacker: Stats,
    statsBlocker: Stats,
    infoActor: Info,
    infoBlocker: Info,
  ) {
    const spell = SpellComponent.values[attack.itemUsed!]
    const damage = spell.damage
    let message = ''

    switch (spell.spellName) {
      case 'Lightning':
        message = `A lightning bolt strikes the ${infoBlocker.name} with loud thunder, for ${damage} damage!`
        break
      case 'Fireball':
        message = `The ${infoBlocker.name} is engulfed in a fiery explosion, taking ${damage} damage!`
        break
    }

    return { damage, message }
  }
}
