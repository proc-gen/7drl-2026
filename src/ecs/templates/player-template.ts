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
    maxShield: 200,
    currentEnergy: 100,
    maxEnergy: 200,
    currentRockets: 0,
    maxRockets: 8,
    currentDiscs: 0,
    maxDiscs: 10,
    currentGrenades: 0,
    maxGrenades: 5,
  }
  StatsComponent.values[player] = {
    strength: 3,
    currentStrength: 3,
    singleTargetXp: 0,
    singleTargetMaxXp: 4,
    singleTargetLevel: 0,
    thrownWeaponXp: 0,
    thrownWeaponMaxXp: 4,
    thrownWeaponLevel: 0,
    explosiveWeaponXp: 0,
    explosiveWeaponMaxXp: 4,
    explosiveWeaponLevel: 0,
    meleeXp: 0,
    meleeMaxXp: 4,
    meleeLevel: 0,
    moveSpeed: 1,
    xpGiven: 0,
  }
  EquipmentComponent.values[player] = {
    meleeWeapon: -1,
    rangedWeapon: createItem(world, 'Blaster', undefined, player)!,
    secondaryRangedWeapon: -1,
  }

  FieldOfViewComponent.values[player] = {
    baseFOV: 12,
    currentFOV: 12,
  }
  return player
}
