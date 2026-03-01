import {
  CLOSED_DOOR_TILE,
  WALL_TILE,
} from '../../constants/tiles'
import type { Vector2, WeightMap } from '../../types'
import { Sector } from '../containers'
import { Map } from '../map'

export interface Generator {
  generate(): void
  placeEntities(): void
  playerStartPosition(): Vector2
  stairsLocation(): Vector2
  isValid(): boolean
  levelStartMessage(): string
}

export const clearMap = (map: Map) => {
  map.tiles = new Array(map.width)
  for (let x = 0; x < map.width; x++) {
    const col = new Array(map.height)
    for (let y = 0; y < map.height; y++) {
      col[y] = { ...WALL_TILE }
    }
    map.tiles[x] = col
  }
}

export const tunnel = (start: Vector2, end: Vector2): Sector => {
  const sector = new Sector(
    Math.floor((start.x + end.x) / 2),
    Math.floor((start.y + end.y) / 2),
  )

  let curPos = start
  const horizontalDirection = Math.sign(end.x - start.x)
  const verticalDirection = Math.sign(end.y - start.y)

  let digHorizontal = true
  if (Math.abs(end.y - start.y) > Math.abs(end.x - start.x)) {
    digHorizontal = false
  }

  while (curPos.x != end.x || curPos.y != end.y) {
    if (digHorizontal && curPos.x === end.x) {
      digHorizontal = false
    } else if (!digHorizontal && curPos.y === end.y) {
      digHorizontal = true
    }

    if (digHorizontal) {
      curPos.x += horizontalDirection
    } else {
      curPos.y += verticalDirection
    }

    sector.includedTiles.push({ ...curPos })
  }

  return sector
}

export const placeDoors = (map: Map) => {
  const doors: Vector2[] = []
  for (let x = 0; x < map.width; x++) {
    for (let y = 0; y < map.height; y++) {
      if (map.tiles[x][y].walkable) {
        if (
          map.isWalkable(x - 1, y) &&
          map.isWalkable(x + 1, y) &&
          !map.isWalkable(x, y - 1) &&
          !map.isWalkable(x, y + 1) &&
          ((map.isWalkable(x - 1, y - 1) && map.isWalkable(x - 1, y + 1)) ||
            (map.isWalkable(x + 1, y - 1) && map.isWalkable(x + 1, y + 1)))
        ) {
          addDoor(map, x, y, doors)
        }

        if (
          map.isWalkable(x, y - 1) &&
          map.isWalkable(x, y + 1) &&
          !map.isWalkable(x - 1, y) &&
          !map.isWalkable(x + 1, y) &&
          ((map.isWalkable(x - 1, y - 1) && map.isWalkable(x + 1, y - 1)) ||
            (map.isWalkable(x - 1, y + 1) && map.isWalkable(x + 1, y + 1)))
        ) {
          addDoor(map, x, y, doors)
        }
      }
    }
  }

  return doors
}

const addDoor = (map: Map, x: number, y: number, doors: Vector2[]) => {
  map.tiles[x][y] = { ...CLOSED_DOOR_TILE }
  doors.push({ x, y })
}

export const getEnemyWeights = (map: Map): WeightMap => {
  const weights: WeightMap = {}

  switch (map.level) {
    case 1:
      weights['Sentry Bot'] = 1
      break
    case 2:
      weights['Sentry Bot'] = 30
      weights['Cyborg'] = 5
      break
    case 3:
      weights['Sentry Bot'] = 5
      weights['Cyborg'] = 5
      weights['Exploding Spider'] = 30
      break
    case 4:
      weights['Sentry Bot'] = 10
      weights['Cyborg'] = 15
      break
    case 5:
      weights['Sentry Bot'] = 5
      weights['Cyborg'] = 5
      weights['Damaged Cyborg'] = 5
      weights['Exploding Spider'] = 5
      break
    case 6:
      weights['Sentry Bot'] = 5
      weights['Cyborg'] = 10
      weights['Damaged Cyborg'] = 10
      weights['Exploding Spider'] = 5
      break
    case 7:
      weights['Cyborg'] = 10
      weights['Special Cyborg'] = 2
      break
    case 8:
      weights['Sentry Bot'] = 10
      weights['Cyborg'] = 10
      break
    default:
      weights['Sentry Bot'] = 10
      weights['Cyborg'] = 10
      weights['Damaged Cyborg'] = 10
      weights['Exploding Spider'] = 10
      weights['Special Cyborg'] = 1
      weights['Sentry Boss'] = 1
      break
  }

  return weights
}

export const getItemWeights = (map: Map): WeightMap => {
  const weights: WeightMap = {
    'Health Potion': 35,
    Dagger: 10,
    'Leather Armor': 10,
    Sling: 10,
    Stones: 15,
  }

  if (map.level >= 2) {
    weights['Blind Scroll'] = 10
  }
  if (map.level >= 4) {
    weights['Lightning Scroll'] = 25
    weights['Sword'] = 5
    weights['Bow'] = 5
    weights['Arrows'] = 15
  }
  if (map.level >= 6) {
    weights['Fireball Scroll'] = 25
    weights['Chain Mail'] = 15
  }

  return weights
}
