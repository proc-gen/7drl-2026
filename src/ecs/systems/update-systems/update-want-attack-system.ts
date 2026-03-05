import {
  addComponent,
  addComponents,
  hasComponent,
  Not,
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
  StatsComponent,
  WantAttackComponent,
  type Info,
  type Stats,
  WeaponComponent,
  type Weapon,
  TargetingComponent,
  PositionComponent,
  type SuitStats,
  ActorComponent,
  PathfinderComponent,
  EnragedComponent,
  RenderableComponent,
} from '../../components'
import { MessageLog } from '../../../utils/message-log'
import {
  AmmunitionTypes,
  AttackTypes,
  Colors,
  isRanged,
  PersonalityTypes,
  WeaponClasses,
} from '../../../constants'
import type { GameStats, Vector2, WeaponClassStats } from '../../../types'
import {
  add,
  equal,
  getPointsInLine,
  mulConst,
  ZeroVector,
} from '../../../utils/vector-2-funcs'
import type { Map } from '../../../map'
import { getWeaponClassStatsForWeapon } from '../../../utils/weapon-class-funcs'
import { getRandomNumber } from '../../../utils/random'

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
    for (const eid of query(world, [
      WantAttackComponent,
      Not(RemoveComponent),
    ])) {
      const attack = WantAttackComponent.values[eid]
      const infoActor = InfoComponent.values[attack.attacker]
      const statsAttacker = StatsComponent.values[attack.attacker]
      const suitStats = SuitStatsComponent.values[attack.attacker]
      const weapon =
        attack.itemUsed !== undefined
          ? WeaponComponent.values[attack.itemUsed]
          : undefined
      let numAttacks = weapon?.attacksPerTurn ?? 1

      if (isRanged(attack.attackType)) {
        const rangedWeapon = RangedWeaponComponent.values[attack.itemUsed!]
        switch (rangedWeapon.ammunitionType) {
          case AmmunitionTypes.Energy:
          case AmmunitionTypes.Rockets:
            rangedWeapon.currentAmmunition -= numAttacks
            break
          case AmmunitionTypes.Grenades:
            suitStats.currentGrenades -= numAttacks
            break
          case AmmunitionTypes.Discs:
            suitStats.currentDiscs -= numAttacks
            break
        }
      }

    let weaponStats = getWeaponClassStatsForWeapon(weapon, statsAttacker)
      if(weaponStats.additionalShotChance > 0){
        if(getRandomNumber(0, 100) < weaponStats.additionalShotChance * 100){
          numAttacks++
          this.log.addMessage(`Your Single Target proficiency allowed you to take an extra shot for free`)
        }
      }

      attack.defender.forEach((defender) => {
        const infoBlocker = InfoComponent.values[defender]
        const healthBlocker = SuitStatsComponent.values[defender]

        for (let i = 0; i < numAttacks; i++) {
          let processedAttack: { damage: number; message: string } | undefined =
            {
              damage: 0,
              message: '',
            }
          if (attack.attackType === AttackTypes.Melee) {
            processedAttack = this.processMeleeAttack(
              statsAttacker,
              suitStats,
              infoActor,
              infoBlocker,
              weapon,
              world,
              attack.attacker,
              defender,
              PositionComponent.values[defender],
              weaponStats
            )
          } else if (isRanged(attack.attackType)) {
            processedAttack = this.processRangedAttack(
              infoActor,
              infoBlocker,
              weapon,
              world,
              attack.attacker,
              defender,
              attack.itemUsed !== undefined
                ? TargetingComponent.values[attack.itemUsed].position
                : ZeroVector,
              weaponStats,
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
                  if (hasComponent(world, attack.attacker, PlayerComponent)) {
                    const gainedXp = StatsComponent.values[defender].xpGiven
                    this.processExperience(statsAttacker, weapon, gainedXp)

                    this.gameStats.enemiesKilled++
                  }

                  addComponents(world, defender, RemoveComponent, DeadComponent)
                }

                removeComponent(world, defender, AliveComponent)
              }
            }
          }
        }

        this.handleOnHit(world, attack.attacker, defender, infoBlocker)
      })

      addComponent(world, eid, RemoveComponent)
    }
  }

  processExperience(
    stats: Stats,
    weapon: Weapon | undefined,
    gainedXp: number,
  ) {
    if (weapon !== undefined) {
      weapon.weaponClasses.forEach((w) => {
        let levelUp = false
        switch (w) {
          case WeaponClasses.Melee:
            stats.meleeXp += gainedXp
            levelUp = stats.meleeMaxXp <= stats.meleeXp
            if (levelUp) {
              stats.meleeLevel++
              stats.meleeXp = 0
              stats.meleeMaxXp *= 2
            }
            break
          case WeaponClasses.SingleTarget:
            stats.singleTargetXp += gainedXp
            levelUp = stats.singleTargetMaxXp <= stats.singleTargetXp
            if (levelUp) {
              stats.singleTargetLevel++
              stats.singleTargetXp = 0
              stats.singleTargetMaxXp *= 2
            }
            break
          case WeaponClasses.Explosive:
            stats.explosiveWeaponXp += gainedXp
            levelUp = stats.explosiveWeaponMaxXp <= stats.explosiveWeaponXp
            if (levelUp) {
              stats.explosiveWeaponLevel++
              stats.explosiveWeaponXp = 0
              stats.explosiveWeaponMaxXp *= 2
            }
            break
          case WeaponClasses.Thrown:
            stats.thrownWeaponXp += gainedXp
            levelUp = stats.thrownWeaponMaxXp <= stats.thrownWeaponXp
            if (levelUp) {
              stats.thrownWeaponLevel++
              stats.thrownWeaponXp = 0
              stats.thrownWeaponMaxXp *= 2
            }
            break
        }

        this.log.addMessage(
          `You gain ${gainedXp} experience points towards ${w}`,
        )

        if (levelUp) {
          this.log.addMessage(`You've gained a level of proficiency in ${w}`)
        }
      })
    } else {
      stats.meleeXp += gainedXp
      const levelUp = stats.meleeMaxXp === stats.meleeXp
      if (levelUp) {
        stats.meleeLevel++
        stats.meleeXp = 0
        stats.meleeMaxXp *= 2
      }
      this.log.addMessage(
        `You gain ${gainedXp} experience points towards ${WeaponClasses.Melee}`,
      )

      if (levelUp) {
        this.log.addMessage(
          `You've gained a level of proficiency in ${WeaponClasses.Melee}`,
        )
      }
    }
  }

  handleOnHit(
    world: World,
    attacker: EntityId,
    defender: EntityId,
    infoDefender: Info,
  ) {
    if (
      hasComponent(world, attacker, PlayerComponent) &&
      hasComponent(world, defender, ActorComponent)
    ) {
      const actor = ActorComponent.values[defender]
      if (actor.personality === PersonalityTypes.Clean) {
        if (hasComponent(world, defender, AliveComponent)) {
          let distance = 9999
          let helper: EntityId | undefined = undefined
          for (const eid of query(world, [
            ActorComponent,
            SuitStatsComponent,
            AliveComponent,
          ])) {
            if (
              [
                PersonalityTypes.Thief,
                PersonalityTypes.SentryBoss,
                PersonalityTypes.CyborgBoss,
              ].includes(ActorComponent.values[eid].personality)
            ) {
              const curDistance = this.map.getPath(
                PositionComponent.values[eid],
                PositionComponent.values[defender],
                true,
              ).length
              if (curDistance > 0 && curDistance < distance) {
                distance = curDistance
                helper = eid
              }
            }
          }

          if (helper !== undefined) {
            PathfinderComponent.values[helper].lastKnownTargetPosition =
              PositionComponent.values[defender]
            this.log.addMessage(`${infoDefender.name} calls for help`)
          }
        } else {
          for (const eid of query(world, [
            ActorComponent,
            SuitStatsComponent,
            AliveComponent,
          ])) {
            if (
              ![PersonalityTypes.Clean, PersonalityTypes.Thief].includes(
                ActorComponent.values[eid].personality,
              )
            ) {
              addComponent(world, eid, EnragedComponent)
              RenderableComponent.values[eid].fg = Colors.Enraged
            }
          }

          this.log.addMessage(
            `The death of the ${infoDefender.name} enrages all remaining enemies on the level`,
          )
        }
      }
    }
  }

  processMeleeAttack(
    statsAttacker: Stats,
    suitStats: SuitStats,
    infoActor: Info,
    infoBlocker: Info,
    weapon: Weapon | undefined,
    world: World,
    attacker: EntityId,
    defender: EntityId,
    targetLocation: Vector2,
    weaponStats: WeaponClassStats,
  ) {
    

    let baseDamage = statsAttacker.currentStrength
    let knockback = 0
    if (
      weapon !== undefined &&
      weapon.attackType === AttackTypes.Melee &&
      suitStats.currentEnergy >= (weapon.energyCost - weaponStats.energyDiscount)
    ) {
      baseDamage = weapon.attack
      knockback = weapon.knockback
      suitStats.currentEnergy -= (weapon.energyCost - weaponStats.energyDiscount)
    }

    baseDamage = Math.ceil(baseDamage *= weaponStats.damageMultiplier)
    knockback += weaponStats.knockback

    const { damage, knockBackDamage } = this.processAttackValues(
      world,
      attacker,
      defender,
      targetLocation,
      baseDamage,
      knockback,
    )

    const attackDescription = `${infoActor.name} attacks ${infoBlocker.name}`
    let message = ''
    if (damage > 0) {
      message = `${attackDescription} for ${damage} damage.`
      if (knockBackDamage > 0) {
        message += ` ${infoBlocker.name} also takes an additional ${knockBackDamage} damage from being thrown into the wall.`
      }
    } else {
      message = `${attackDescription} but can't seem to leave a mark.`
    }

    return { damage, message }
  }

  processRangedAttack(
    infoActor: Info,
    infoBlocker: Info,
    weapon: Weapon | undefined,
    world: World,
    attacker: EntityId,
    defender: EntityId,
    targetLocation: Vector2,
    weaponStats: WeaponClassStats
  ) {
    if (hasComponent(world, defender, AliveComponent)) {
      let baseDamage = Math.ceil(weapon!.attack * weaponStats.damageMultiplier) 
      let knockback = weapon!.knockback + weaponStats.knockback

      const { damage, knockBackDamage } = this.processAttackValues(
        world,
        attacker,
        defender,
        targetLocation,
        baseDamage,
        knockback,
      )

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

  processAttackValues(
    world: World,
    attacker: EntityId,
    defender: EntityId,
    targetLocation: Vector2,
    damage: number,
    knockback: number,
  ) {
    if (hasComponent(world, attacker, EnragedComponent)) {
      damage = Math.ceil(damage * 1.2)
    }
    let knockBackDamage = 0
    if (knockback !== 0) {
      const defenderLocation = PositionComponent.values[defender]
      if (!equal(defenderLocation, targetLocation)) {
        const slopeVector = add(defenderLocation, mulConst(targetLocation, -1))
        const line = getPointsInLine(
          targetLocation,
          add(targetLocation, mulConst(slopeVector, 2)),
        )

        const index = line.findIndex((a) => equal(a, defenderLocation))
        if (index > -1) {
          const nextPoint = line[index + knockback]
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
              this.map.moveEntity(defender, PositionComponent.values[defender], nextPoint)
              PositionComponent.values[defender] = { ...nextPoint }
            }
          }
        }
      }
    }

    return { damage, knockBackDamage }
  }
}
