import { addComponents, addEntity, type World } from 'bitecs'
import type { Vector2 } from '../../types'
import {
  ActionComponent,
  BlockerComponent,
  InfoComponent,
  ActorComponent,
  PositionComponent,
  RenderableComponent,
  AliveComponent,
  SuitStatsComponent,
  StatsComponent,
  RenderLayerBlockerComponent,
  EquipmentComponent,
  FieldOfViewComponent,
  PathfinderComponent,
} from '../components'
import { Colors, PersonalityTypes, type PersonalityType } from '../../constants'
import { createItem } from './item-template'

export const createActor = (
  world: World,
  startPosition: Vector2,
  name: string,
) => {
  const enemyStats = enemyStatLookup(name)
  if (enemyStats === undefined) {
    return
  }

  const enemy = addEntity(world)

  addComponents(
    world,
    enemy,
    ActionComponent,
    BlockerComponent,
    InfoComponent,
    ActorComponent,
    PositionComponent,
    RenderableComponent,
    RenderLayerBlockerComponent,
    AliveComponent,
    SuitStatsComponent,
    StatsComponent,
    EquipmentComponent,
    FieldOfViewComponent,
    PathfinderComponent,
  )
  ActionComponent.values[enemy] = {
    processed: true,
    didNothing: true,
    xOffset: 0,
    yOffset: 0,
    useItem: undefined,
    actionSuccessful: true,
    pickUpItem: false,
    itemActionType: undefined,
  }
  InfoComponent.values[enemy] = { name }
  PositionComponent.values[enemy] = { ...startPosition }
  RenderableComponent.values[enemy] = {
    char: enemyStats.char,
    fg:
      enemyStats.personalityType === PersonalityTypes.Clean
        ? Colors.Peaceful
        : Colors.Hostile,
    bg: null,
  }
  ActorComponent.values[enemy] = {
    personality: enemyStats.personalityType as PersonalityType,
    hostile: ![PersonalityTypes.Clean].includes(enemyStats.personalityType),
  }
  SuitStatsComponent.values[enemy] = {
    currentShield: enemyStats.health,
    maxShield:
      enemyStats.personalityType === PersonalityTypes.Clean
        ? 999
        : enemyStats.health,
    currentEnergy: 100,
    maxEnergy:
      enemyStats.personalityType === PersonalityTypes.Clean ? 999 : 100,
    currentRockets: 0,
    maxRockets: 0,
    currentDiscs: 0,
    maxDiscs: 0,
    currentGrenades: 0,
    maxGrenades: 0,
  }
  StatsComponent.values[enemy] = {
    strength: 0,
    currentStrength: 0,
    singleTargetXp: 0,
    singleTargetMaxXp: 0,
    singleTargetLevel: 0,
    thrownWeaponXp: 0,
    thrownWeaponMaxXp: 0,
    thrownWeaponLevel: 0,
    explosiveWeaponXp: 0,
    explosiveWeaponMaxXp: 0,
    explosiveWeaponLevel: 0,
    meleeXp: 0,
    meleeMaxXp: 0,
    meleeLevel: 0,
    moveSpeed: enemyStats.moveSpeed,
    xpGiven: enemyStats.xpGiven,
  }

  const meleeWeapon = createItem(world, `${name}-Melee`, undefined, enemy) ?? -1
  const rangedWeapon =
    createItem(world, `${name}-Ranged`, undefined, enemy) ?? -1
  const secondaryRangedWeapon =
    createItem(world, `${name}-Secondary`, undefined, enemy) ?? -1

  EquipmentComponent.values[enemy] = {
    meleeWeapon,
    rangedWeapon,
    secondaryRangedWeapon,
  }
  FieldOfViewComponent.values[enemy] = {
    baseFOV: enemyStats.fov,
    currentFOV: enemyStats.fov,
  }
  PathfinderComponent.values[enemy] = {
    lastKnownTargetPosition: undefined,
  }

  return enemy
}

const enemyStatLookup = (name: string) => {
  switch (name) {
    case 'Sentry Bot':
      return {
        char: 'Θ',
        health: 12,
        xpGiven: 1,
        fov: 10,
        moveSpeed: 2,
        personalityType: PersonalityTypes.Ranged,
      }
    case 'Cyborg':
      return {
        char: 'Σ',
        health: 24,
        xpGiven: 1,
        fov: 10,
        moveSpeed: 1,
        personalityType: PersonalityTypes.Ranged,
      }
    case 'Damaged Cyborg':
      return {
        char: 'σ',
        health: 6,
        xpGiven: 1,
        fov: 10,
        moveSpeed: 0,
        personalityType: PersonalityTypes.Ranged,
      }
    case 'Exploding Spider':
      return {
        char: '*',
        health: 5,
        xpGiven: 1,
        fov: 10,
        moveSpeed: 2,
        personalityType: PersonalityTypes.Melee,
      }
    case 'Pickpocket Bot':
      return {
        char: 'π',
        health: 60,
        xpGiven: 2,
        fov: 10,
        moveSpeed: 2,
        personalityType: PersonalityTypes.Thief,
      }
    case 'Sweeper':
      return {
        char: 'δ',
        health: 100,
        xpGiven: 3,
        fov: 10,
        moveSpeed: 1,
        personalityType: PersonalityTypes.Clean,
      }
    case 'Special Cyborg':
      return {
        char: 'φ',
        health: 72,
        xpGiven: 3,
        fov: 10,
        moveSpeed: 1,
        personalityType: PersonalityTypes.Ranged,
      }
    case 'Sentry Boss':
      return {
        char: 'Φ',
        health: 144,
        xpGiven: 10,
        fov: 12,
        moveSpeed: 1,
        personalityType: PersonalityTypes.SentryBoss,
      }
    case 'Boss Cyborg':
      return {
        char: 'Ω',
        health: 216,
        xpGiven: 15,
        fov: 12,
        moveSpeed: 1,
        personalityType: PersonalityTypes.CyborgBoss,
      }
  }

  return undefined
}
