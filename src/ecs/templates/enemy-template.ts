import { addComponents, addEntity, type World } from 'bitecs'
import type { Vector2 } from '../../types'
import {
  ActionComponent,
  BlockerComponent,
  InfoComponent,
  EnemyComponent,
  PositionComponent,
  RenderableComponent,
  AliveComponent,
  HealthComponent,
  StatsComponent,
  RenderLayerBlockerComponent,
  EquipmentComponent,
  FieldOfViewComponent,
  PathfinderComponent,
} from '../components'
import { Colors } from '../../constants'
import { createItem } from './item-template'

export const createEnemy = (
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
    EnemyComponent,
    PositionComponent,
    RenderableComponent,
    RenderLayerBlockerComponent,
    AliveComponent,
    HealthComponent,
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
    fg: enemyStats.fg,
    bg: enemyStats.bg,
  }
  HealthComponent.values[enemy] = {
    current: enemyStats.health,
    max: enemyStats.health,
  }
  StatsComponent.values[enemy] = {
    strength: enemyStats.strength,
    currentStrength: enemyStats.strength,
    rangedPower: enemyStats.ranged,
    currentRangedPower: enemyStats.ranged,
    defense: enemyStats.defense,
    currentDefense: enemyStats.defense,
    xpGiven: enemyStats.xpGiven,
  }
  EquipmentComponent.values[enemy] = {
    armor: -1,
    weapon: -1,
  }
  FieldOfViewComponent.values[enemy] = {
    baseFOV: enemyStats.fov,
    currentFOV: enemyStats.fov,
  }
  PathfinderComponent.values[enemy] = {
    lastKnownTargetPosition: undefined
  }

  if(enemyStats.weapon !== undefined){
    const weapon = createItem(world, enemyStats.weapon, undefined, enemy)
    if(weapon !== undefined){
      EquipmentComponent.values[enemy].weapon = weapon
    }
  }
  if(enemyStats.ammo !== undefined){
    createItem(world, enemyStats.ammo, undefined, enemy)
  }

  return enemy
}

const enemyStatLookup = (name: string) => {
  if (name === 'Orc') {
    return {
      char: 'o',
      fg: Colors.Orc,
      bg: null,
      health: 10,
      strength: 4,
      ranged: 0,
      defense: 0,
      xpGiven: 50,
      fov: 8,
      weapon: undefined,
      ammo: undefined,
    }
  } else if (name === 'Troll') {
    return {
      char: 't',
      fg: Colors.Troll,
      bg: null,
      health: 20,
      strength: 5,
      ranged: 0,
      defense: 1,
      xpGiven: 100,
      fov: 8,
      weapon: undefined,
      ammo: undefined,
    }
  } else if (name === 'Troll Archer') {
    return {
      char: 'a',
      fg: Colors.Troll,
      bg: null,
      health: 16,
      strength: 3,
      ranged: 1,
      defense: 0,
      xpGiven: 150,
      fov: 10,
      weapon: 'Bow',
      ammo: 'Arrows',
    }
  } else if (name === 'Goblin') {
    return {
      char: 'g',
      fg: Colors.Goblin,
      bg: null,
      health: 8,
      strength: 2,
      ranged: 0,
      defense: 0,
      xpGiven: 20,
      fov: 6,
      weapon: undefined,
      ammo: undefined,
    }
  } else if (name === 'Goblin Slinger') {
    return {
      char: 's',
      fg: Colors.Goblin,
      bg: null,
      health: 6,
      strength: 2,
      ranged: 1,
      defense: 0,
      xpGiven: 30,
      fov: 10,
      weapon: 'Sling',
      ammo: 'Stones',
    }
  }

  return undefined
}
