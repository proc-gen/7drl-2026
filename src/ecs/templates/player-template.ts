import { addComponents, addEntity, type World } from 'bitecs'
import type { Vector2 } from '../../types'
import {
  ActionComponent,
  AliveComponent,
  BlockerComponent,
  EquipmentComponent,
  FieldOfViewComponent,
  SuitStatsComponent,
  InfoComponent,
  PlayerComponent,
  PositionComponent,
  RenderableComponent,
  RenderLayerBlockerComponent,
  StatsComponent,
} from '../components'
import { Colors } from '../../constants'
import { createItem } from './item-template'

export const createPlayer = (world: World, startPosition: Vector2) => {
  const player = addEntity(world)

  addComponents(
    world,
    player,
    ActionComponent,
    BlockerComponent,
    InfoComponent,
    PlayerComponent,
    PositionComponent,
    RenderableComponent,
    RenderLayerBlockerComponent,
    AliveComponent,
    SuitStatsComponent,
    StatsComponent,
    EquipmentComponent,
    FieldOfViewComponent,
  )
  PlayerComponent.values[player] = {
    levelUpBase: 0,
    currentLevel: 1,
    currentXp: 0,
    levelUpFactor: 100,
    experienceToNextLevel: 100,
  }
  ActionComponent.values[player] = {
    processed: true,
    xOffset: 0,
    yOffset: 0,
    useItem: undefined,
    actionSuccessful: true,
    itemActionType: undefined,
    pickUpItem: false,
  }
  InfoComponent.values[player] = { name: 'Player' }
  PositionComponent.values[player] = { ...startPosition }
  RenderableComponent.values[player] = {
    char: '@',
    fg: Colors.Player,
    bg: null,
  }
  SuitStatsComponent.values[player] = {
    currentShield: 100,
    maxShield: 100,
    currentEnergy: 100,
    maxEnergy: 100,
  }
  StatsComponent.values[player] = {
    strength: 3,
    currentStrength: 3,
    rangedPower: 0,
    currentRangedPower: 0,
    xpGiven: 0,
  }
  EquipmentComponent.values[player] = {
    meleeWeapon: -1,
    rangedWeapon: createItem(world, 'Blaster', undefined, player)!,
    secondaryRangedWeapon: -1,
  }
  FieldOfViewComponent.values[player] = {
    baseFOV: 99,
    currentFOV: 99,
  }
  return player
}
