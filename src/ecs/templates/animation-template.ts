import {
  addComponents,
  addEntity,
  hasComponent,
  type EntityId,
  type World,
} from 'bitecs'
import type { Vector2 } from '../../types'
import type { Map } from '../../map'
import {
  AnimationComponent,
  HealthComponent,
  InfoComponent,
  LightComponent,
  PositionComponent,
  RenderableComponent,
  RenderLayerAboveComponent,
} from '../components'
import {
  AnimationTypes,
  Colors,
  LightTypes,
  type AnimationType,
  type LightType,
} from '../../constants'
import { getPointsInLine, ZeroVector } from '../../utils/vector-2-funcs'
import { processFOV } from '../../utils/fov-funcs'

export const createAnimation = (
  world: World,
  map: Map,
  entity: EntityId,
  position: Vector2,
  animationNameOverride: string = '',
  subAnimation: string | undefined = undefined,
  positionEnd: Vector2 = ZeroVector,
) => {
  const name =
    animationNameOverride.length > 0
      ? animationNameOverride
      : InfoComponent.values[entity].name

  switch (name) {
    case 'Health Potion':
      createHealthPotionAnimation(world, position)
      break
    case 'Lightning Scroll':
      createLightningAnimation(world, positionEnd)
      break
    case 'Confusion Scroll':
      createConfusionScrollAnimation(world, map, position, positionEnd)
      break
    case 'Fireball Scroll':
      createFireballScrollAnimation(
        world,
        map,
        position,
        positionEnd,
        subAnimation,
      )
      break
    case 'Melee':
      createMeleeAnimation(world, positionEnd)
      break
    case 'Bow':
      createBowAnimation(world, map, position, positionEnd)
      break
    case 'Sling':
      createSlingAnimation(world, map, position, positionEnd)
      break
  }
}

const createHealthPotionAnimation = (world: World, position: Vector2) => {
  animateCharacterLightCombination(world, position, '¡', Colors.HealthBar)
}

const createLightningAnimation = (world: World, position: Vector2) => {
  for (let i = -1; i < 2; i++) {
    animateCharacterLightCombination(
      world,
      position,
      '~',
      Colors.LightningScroll,
      10,
    )
  }
}

const createConfusionScrollAnimation = (
  world: World,
  map: Map,
  position: Vector2,
  positionEnd: Vector2,
) => {
  createProjectileLightAnimation(
    world,
    map,
    position,
    positionEnd,
    '~',
    Colors.ConfusionScroll,
  )
}

const createFireballScrollAnimation = (
  world: World,
  map: Map,
  position: Vector2,
  positionEnd: Vector2,
  subAnimation?: string,
) => {
  if (subAnimation === undefined) {
    const animation = createProjectileLightAnimation(
      world,
      map,
      position,
      positionEnd,
      '~',
      Colors.FireballScroll,
    )
    AnimationComponent.values[animation].nextAnimation = 'Fireball Scroll'
    AnimationComponent.values[animation].nextSubAnimation = 'Explode'
  } else if (subAnimation === 'Explode') {
    const radius = 3
    const targets = processFOV(map, position, radius)

    targets.forEach((t) => {
      const entities = map.getEntitiesAtLocation(t)
      const targetEntity = entities.find((a) =>
        hasComponent(world, a, HealthComponent),
      )
      if (targetEntity !== undefined) {
        createMeleeAnimation(world, t)
      }
      animateLight(world, t, Colors.FireballScroll, 3)
    })
  }
}

const createBowAnimation = (
  world: World,
  map: Map,
  position: Vector2,
  positionEnd: Vector2,
) => {
  createProjectileAnimation(
    world,
    map,
    position,
    positionEnd,
    '¥',
    Colors.White,
  )
}

const createSlingAnimation = (
  world: World,
  map: Map,
  position: Vector2,
  positionEnd: Vector2,
) => {
  createProjectileAnimation(
    world,
    map,
    position,
    positionEnd,
    '∙',
    Colors.White,
  )
}

const createMeleeAnimation = (world: World, position: Vector2) => {
  const animation = animateCharacter(world, position, '‼', Colors.ErrorLocation)
  AnimationComponent.values[animation].animationTimeLeft = 500
}

const createProjectileAnimation = (
  world: World,
  map: Map,
  position: Vector2,
  positionEnd: Vector2,
  char: string,
  color: string,
) => {
  const path = getPointsInLine(position, positionEnd)

  const animateCharacter = addEntity(world)
  addComponents(
    world,
    animateCharacter,
    AnimationComponent,
    RenderableComponent,
    PositionComponent,
    RenderLayerAboveComponent,
  )

  AnimationComponent.values[animateCharacter] = {
    animationRate: 50,
    animationType: AnimationTypes.FollowPath as AnimationType,
    numFrames: path.length,
    positions: path,
    framesProcessed: 0,
    toNextFrame: 50,
    animationTimeLeft: 50 * path.length,
    nextAnimation: 'Melee',
  }
  RenderableComponent.values[animateCharacter] = {
    char,
    fg: color,
    bg: null,
    alwaysShow: true,
  }
  PositionComponent.values[animateCharacter] = { ...path[0] }
}

const createProjectileLightAnimation = (
  world: World,
  map: Map,
  position: Vector2,
  positionEnd: Vector2,
  char: string,
  color: string,
) => {
  const path = getPointsInLine(position, positionEnd)

  const animateCharacter = addEntity(world)
  addComponents(
    world,
    animateCharacter,
    AnimationComponent,
    RenderableComponent,
    LightComponent,
    PositionComponent,
    RenderLayerAboveComponent,
  )

  AnimationComponent.values[animateCharacter] = {
    animationRate: 100,
    animationType: AnimationTypes.FollowPath as AnimationType,
    numFrames: path.length,
    positions: path,
    framesProcessed: 0,
    toNextFrame: 100,
    animationTimeLeft: 100 * path.length,
  }
  RenderableComponent.values[animateCharacter] = {
    char,
    fg: color,
    bg: null,
    alwaysShow: true,
  }
  LightComponent.values[animateCharacter] = {
    color: color,
    intensity: 3,
    lightType: LightTypes.Point as LightType,
    blockable: true,
  }
  PositionComponent.values[animateCharacter] = { ...path[0] }

  return animateCharacter
}

const animateCharacterLightCombination = (
  world: World,
  position: Vector2,
  char: string,
  color: string,
  lightIntensity: number = 3,
) => {
  animateCharacter(world, position, char, color)
  animateLight(world, position, color, lightIntensity)
}

const animateCharacter = (
  world: World,
  position: Vector2,
  char: string,
  color: string,
) => {
  const animateCharacter = addEntity(world)
  addComponents(
    world,
    animateCharacter,
    AnimationComponent,
    RenderableComponent,
    PositionComponent,
    RenderLayerAboveComponent,
  )

  AnimationComponent.values[animateCharacter] = {
    animationRate: 50,
    animationType: AnimationTypes.FlashCharacter as AnimationType,
    numFrames: 20,
    framesProcessed: 0,
    toNextFrame: 50,
    animationTimeLeft: 1000,
  }
  RenderableComponent.values[animateCharacter] = {
    char,
    fg: color,
    bg: null,
    alwaysShow: true,
  }
  PositionComponent.values[animateCharacter] = { ...position }

  return animateCharacter
}

const animateLight = (
  world: World,
  position: Vector2,
  color: string,
  lightIntensity: number = 3,
) => {
  const animateLight = addEntity(world)
  addComponents(
    world,
    animateLight,
    AnimationComponent,
    LightComponent,
    PositionComponent,
  )

  AnimationComponent.values[animateLight] = {
    animationRate: 50,
    animationType: AnimationTypes.FlashLight as AnimationType,
    numFrames: 20,
    framesProcessed: 0,
    toNextFrame: 50,
    animationTimeLeft: 1000,
  }
  LightComponent.values[animateLight] = {
    color,
    intensity: lightIntensity,
    lightType: LightTypes.Point as LightType,
    blockable: false,
  }
  PositionComponent.values[animateLight] = { ...position }
}
