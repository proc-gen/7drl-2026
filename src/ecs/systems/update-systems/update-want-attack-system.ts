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
  TargetingComponent,
  PositionComponent,
} from '../../components'
import { MessageLog } from '../../../utils/message-log'
import { AmmunitionTypes, AttackTypes, isRanged } from '../../../constants'
import type { GameStats, Vector2 } from '../../../types'
import {
  add,
  equal,
  getPointsInLine,
  mulConst,
  ZeroVector,
} from '../../../utils/vector-2-funcs'
import type { Map } from '../../../map'

export class UpdateWantAttackSystem implements UpdateSystem {
  log: MessageLog
  gameStats: GameStats
  map: Map

  constructor(log: MessageLog, gameStats: GameStats, map: Map) {
    this.log = log
    this.gameStats = gameStats
    this.map = map
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
              attack.itemUsed !== undefined
                ? TargetingComponent.values[attack.itemUsed].position
                : ZeroVector,
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
    targetLocation: Vector2,
  ) {
    if (hasComponent(world, defender, AliveComponent)) {
      const damage = weapon!.attack
      let knockBackDamage = 0
      if (weapon!.knockback !== 0) {
        const defenderLocation = PositionComponent.values[defender]
        if (!equal(defenderLocation, targetLocation)) {
          const slopeVector = add(
            defenderLocation,
            mulConst(targetLocation, -1),
          )
          const line = getPointsInLine(
            targetLocation,
            add(targetLocation, mulConst(slopeVector, 2)),
          )

          const index = line.findIndex((a) => equal(a, defenderLocation))
          if (index > -1) {
            const nextPoint = line[index + weapon!.knockback]
            if (
              !this.map.isWalkable(nextPoint.x, nextPoint.y) ||
              (this.map.isInBounds(nextPoint.x, nextPoint.y) &&
                this.map.tiles[nextPoint.x][nextPoint.y].name === 'Door Closed')
            ) {
              knockBackDamage = Math.floor(damage * 0.25)
            } else {
              const entities = this.map.getEntitiesAtLocation(nextPoint)
              const blocker = entities.find((a) =>
                hasComponent(world, a, SuitStatsComponent),
              )
              if (blocker === undefined) {
                PositionComponent.values[defender] = { ...nextPoint }
              }
            }
          }
        }
      }

      let attackVerb = 'shoots'

      const attackDescription = `${infoActor.name} ${attackVerb} ${infoBlocker.name}`
      let message = ''
      if (damage > 0) {
        message = `${attackDescription} for ${damage} damage.`
        if (knockBackDamage > 0) {
          message += ` ${infoBlocker.name} also takes an additional ${knockBackDamage} damage from being thrown into the wall.`
        }
      } else {
        message = `${attackDescription} but couldn't hit the target.`
      }

      return { damage: damage + knockBackDamage, message }
    }
    return undefined
  }
}
