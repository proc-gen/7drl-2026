import { addComponents, addEntity, type World } from 'bitecs'
import type { Vector2 } from '../../types'
import {
  ActionComponent,
  AliveComponent,
  BlockerComponent,
  EquipmentComponent,
  FieldOfViewComponent,
  HealthComponent,
  InfoComponent,
  PlayerComponent,
  PositionComponent,
  RenderableComponent,
  RenderLayerBlockerComponent,
  StatsComponent,
} from '../components'
import { Colors } from '../../constants'

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
    HealthComponent,
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
  HealthComponent.values[player] = { current: 30, max: 30 }
  StatsComponent.values[player] = {
    strength: 3,
    currentStrength: 3,
    rangedPower: 0,
    currentRangedPower: 0,
    defense: 1,
    currentDefense: 1,
    xpGiven: 0,
  }
  EquipmentComponent.values[player] = {
    armor: -1,
    weapon: -1,
  }
  FieldOfViewComponent.values[player] = {
    baseFOV: 99,
    currentFOV: 99,
  }
  return player
}
