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
import { Colors } from '../../constants'

export const createActor = (
  world: World,
  startPosition: Vector2,
  name: string,
  hostileOverride?: boolean
) => {
  const enemyStats = enemyStatLookup(name)
  if (enemyStats === undefined) {
    return
  }

  const hostile: boolean = hostileOverride !== undefined ? hostileOverride : true
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
    fg: hostile ? Colors.Hostile : Colors.Peaceful,
    bg: null,
  }
  SuitStatsComponent.values[enemy] = {
    currentShield: enemyStats.health,
    maxShield: enemyStats.health,
    currentEnergy: 100,
    maxEnergy: 100,
  }
  StatsComponent.values[enemy] = {
    strength: 0,
    currentStrength: 0,
    rangedPower: 0,
    currentRangedPower: 0,
    xpGiven: enemyStats.xpGiven,
  }
  EquipmentComponent.values[enemy] = {
    weapon: -1,
  }
  FieldOfViewComponent.values[enemy] = {
    baseFOV: enemyStats.fov,
    currentFOV: enemyStats.fov,
  }
  PathfinderComponent.values[enemy] = {
    lastKnownTargetPosition: undefined
  }

  return enemy
}

const enemyStatLookup = (name: string) => {
  switch(name){
    case 'Sentry Bot':
      return {
        char: 'Θ',
        health: 15,
        xpGiven: 1,
        fov: 10,
        moveSpeed: 2,
      }
    case 'Cyborg':
      return {
        char: 'Σ',
        health: 40,
        xpGiven: 1,
        fov: 10,
        moveSpeed: 1,
      }
    case 'Damaged Cyborg':
      return {
        char: 'σ',
        health: 10,
        xpGiven: 1,
        fov: 10,
        moveSpeed: 0,
      }
    case 'Exploding Spider':
      return {
        char: '*',
        health: 5,
        xpGiven: 1,
        fov: 10,
        moveSpeed: 2,
      }
    case 'Pickpocket Bot':
      return {
        char: 'π',
        health: 60,
        xpGiven: 2,
        fov: 10,
        moveSpeed: 2,
      }
    case 'Sweeper':
      return {
        char: 'δ',
        health: 100,
        xpGiven: 3,
        fov: 10,
        moveSpeed: 1,
      }
    case 'Special Cyborg':
      return {
        char: 'φ',
        health: 100,
        xpGiven: 3,
        fov: 12,
        moveSpeed: 1,
      }
    case 'Sentry Boss':
      return {
        char: 'Φ',
        health: 150,
        xpGiven: 3,
        fov: 12,
        moveSpeed: 1,
      }
    case 'Boss Cyborg':
      return {
        char: 'Ω',
        health: 250,
        xpGiven: 3,
        fov: 12,
        moveSpeed: 1,
      }
  }

  return undefined
}
