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
  SuitStatsComponent,
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
    case 'Shield Pickup':
      createShieldPickupAnimation(world, position)
      break
    case 'Energy Pickup':
      createEnergyPickupAnimation(world, position)
      break
    case 'Weapon Pickup':
      createWeaponPickupAnimation(world, position)
      break
    case 'Melee':
      createMeleeAnimation(world, positionEnd)
      break
    case 'Blaster':
    case 'Sentry Bot-Ranged':
    case 'Sentry Boss-Ranged':
      createBlasterAnimation(world, map, position, positionEnd)
      break
    case 'Laser Rifle':
      createLaserRifleAnimation(world, map, position, positionEnd)
      break
    case 'Energy Ripper':
    case 'Cyborg-Ranged':
    case 'Damaged Cyborg-Ranged':
    case 'Special Cyborg-Ranged':
    case 'Boss Cyborg-Ranged':
      createEnergyRipperAnimation(world, map, position, positionEnd)
      break
    case 'Plasma Cannon':
      createPlasmaCannonAnimation(
        world,
        map,
        position,
        positionEnd,
        subAnimation,
      )
      break
    case 'Rocket Launcher':
      createRocketLauncherAnimation(
        world,
        map,
        position,
        positionEnd,
        subAnimation,
      )
      break
    case 'Singularity Discs':
      createExplodingDiscsAnimation(world, map, position, positionEnd, subAnimation)
      break
    case 'Flash Grenade':
      createFlashGrenadeAnimation(world, map, position, positionEnd, subAnimation)
      break
  }
}

const createShieldPickupAnimation = (world: World, position: Vector2) => {
  animateCharacterLightCombination(world, position, 's', Colors.ShieldDrop, 1.5, 500)
}

const createEnergyPickupAnimation = (world: World, position: Vector2) => {
  animateCharacterLightCombination(world, position, 'e', Colors.EnergyBar, 1.5, 500)
}

const createWeaponPickupAnimation = (world: World, position: Vector2) => {
  animateCharacterLightCombination(world, position, 'w', Colors.WeaponPickup, 1.5, 500)
}

const createBlasterAnimation = (
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
    '∙',
    Colors.Blaster,
    0.5,
  )
}

const createLaserRifleAnimation = (
  world: World,
  map: Map,
  position: Vector2,
  positionEnd: Vector2,
) => {
  const char =
    Math.abs(positionEnd.x - position.x) > Math.abs(positionEnd.y - position.y)
      ? '═'
      : '║'
  createProjectileLightAnimation(
    world,
    map,
    position,
    positionEnd,
    char,
    Colors.LaserRifle,
    1,
  )
}

const createEnergyRipperAnimation = (
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
    '∙',
    Colors.EnergyRipper,
    0.25,
  )
}

const createPlasmaCannonAnimation = (
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
      '•',
      Colors.PlasmaCannon,
      2,
    )

    AnimationComponent.values[animation].nextAnimation = 'Plasma Cannon'
    AnimationComponent.values[animation].nextSubAnimation = 'Explode'
  } else if (subAnimation === 'Explode') {
    const radius = 3
    const targets = processFOV(map, position, radius)

    targets.forEach((t) => {
      const entities = map.getEntitiesAtLocation(t)
      const targetEntity = entities.find((a) =>
        hasComponent(world, a, SuitStatsComponent),
      )
      if (targetEntity !== undefined) {
        createMeleeAnimation(world, t)
      }
      animateLight(world, t, Colors.PlasmaCannon, 3)
    })
  }
}

const createRocketLauncherAnimation = (
  world: World,
  map: Map,
  position: Vector2,
  positionEnd: Vector2,
  subAnimation?: string,
) => {
  if (subAnimation === undefined) {
    let char = ''
    const xDiff = positionEnd.x - position.x
    const yDiff = positionEnd.y - position.y
    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      char = xDiff > 0 ? '→' : '←'
    } else {
      char = yDiff > 0 ? '↑' : '↓'
    }

    const animation = createProjectileAnimation(
      world,
      map,
      position,
      positionEnd,
      char,
      Colors.Rocket,
    )
    AnimationComponent.values[animation].nextAnimation = 'Rocket Launcher'
    AnimationComponent.values[animation].nextSubAnimation = 'Explode'
  } else if (subAnimation === 'Explode') {
    const radius = 3
    const targets = processFOV(map, position, radius)

    targets.forEach((t) => {
      const entities = map.getEntitiesAtLocation(t)
      const targetEntity = entities.find((a) =>
        hasComponent(world, a, SuitStatsComponent),
      )
      if (targetEntity !== undefined) {
        createMeleeAnimation(world, t)
      }
      animateLight(world, t, Colors.RocketExplode, 3)
    })
  }
}

const createExplodingDiscsAnimation = (
  world: World,
  map: Map,
  position: Vector2,
  positionEnd: Vector2,
  subAnimation?: string,
) => {
  if (subAnimation === undefined) {
    const animation = createProjectileAnimation(
      world,
      map,
      position,
      positionEnd,
      '⦿',
      Colors.Disc,
    )

    AnimationComponent.values[animation].nextAnimation = 'Singularity Discs'
    AnimationComponent.values[animation].nextSubAnimation = 'Explode'
  } else if (subAnimation === 'Explode') {
    const radius = 2
    const targets = processFOV(map, position, radius)
    animateLight(world, position, Colors.Disc, 2)

    targets.forEach((t) => {
      const entities = map.getEntitiesAtLocation(t)
      const targetEntity = entities.find((a) =>
        hasComponent(world, a, SuitStatsComponent),
      )
      if (targetEntity !== undefined) {
        createMeleeAnimation(world, t)
      }
    })
  }
}

const createFlashGrenadeAnimation = (
  world: World,
  map: Map,
  position: Vector2,
  positionEnd: Vector2,
  subAnimation?: string,
) => {
  if (subAnimation === undefined) {
    const animation = createProjectileAnimation(
      world,
      map,
      position,
      positionEnd,
      '○',
      Colors.FlashGrenade,
    )

    AnimationComponent.values[animation].nextAnimation = 'Flash Grenade'
    AnimationComponent.values[animation].nextSubAnimation = 'Explode'
  } else if (subAnimation === 'Explode') {
    const radius = 1
    const targets = processFOV(map, position, radius)
    animateLight(world, position, Colors.FlashGrenade, 10)

    targets.forEach((t) => {
      const entities = map.getEntitiesAtLocation(t)
      const targetEntity = entities.find((a) =>
        hasComponent(world, a, SuitStatsComponent),
      )
      if (targetEntity !== undefined) {
        createMeleeAnimation(world, t)
      }
    })
  }
}

const createMeleeAnimation = (world: World, position: Vector2) => {
  const animation = animateCharacter(world, position, '‼', Colors.ErrorLocation)
  AnimationComponent.values[animation].animationTimeLeft = 500
}

const createProjectileAnimation = (
  world: World,
  _map: Map,
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

  return animateCharacter
}

const createProjectileLightAnimation = (
  world: World,
  _map: Map,
  position: Vector2,
  positionEnd: Vector2,
  char: string,
  color: string,
  intensity: number = 3,
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
    intensity,
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
  maxTime: number = 1000
) => {
  animateCharacter(world, position, char, color, maxTime)
  animateLight(world, position, color, lightIntensity, maxTime)
}

const animateCharacter = (
  world: World,
  position: Vector2,
  char: string,
  color: string,
  maxTime: number = 1000
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
    animationTimeLeft: maxTime,
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
  maxTime: number = 1000
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
    animationTimeLeft: maxTime,
  }
  LightComponent.values[animateLight] = {
    color,
    intensity: lightIntensity,
    lightType: LightTypes.Point as LightType,
    blockable: false,
  }
  PositionComponent.values[animateLight] = { ...position }
}
