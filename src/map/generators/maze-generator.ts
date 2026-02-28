import EllerMaze from 'rot-js/lib/map/ellermaze'
import type { World } from 'bitecs'
import {
  clearMap,
  getEnemyWeights,
  getItemWeights,
  prettify,
  type Generator,
} from './generator'
import type { Map } from '../map'
import type { Vector2, WeightMap } from '../../types'
import { equal, ZeroVector } from '../../utils/vector-2-funcs'
import { FLOOR_TILE, LightTypes, STAIRS_DOWN_TILE, type LightType } from '../../constants'
import { getRandomNumber } from '../../utils/random'
import { Color, RNG } from 'rot-js'
import { createEnemy, createItem, createLight } from '../../ecs/templates'

export class MazeGenerator implements Generator {
  world: World
  map: Map

  maxMonsters: number
  maxItems: number
  mazeSize: Vector2

  start: Vector2
  exit: Vector2
  traversiblePositions: Vector2[]

  constructor(world: World, map: Map, maxMonsters: number, maxItems: number, mazeSize: Vector2) {
    this.world = world
    this.map = map
    this.maxMonsters = maxMonsters
    this.maxItems = maxItems
    this.mazeSize = mazeSize

    this.start = { ...ZeroVector }
    this.exit = { ...ZeroVector }
    this.traversiblePositions = []
  }

  generate(): void {
    clearMap(this.map)

    const ellerGenerator = new EllerMaze(
      Math.min(this.mazeSize.x, this.map.width / 2),
      Math.min(this.mazeSize.y, this.map.height / 2),
    )
    ellerGenerator.create((x, y, contents) => {
      if (contents === 0) {
        for (let i = 0; i < 2; i++) {
          for (let j = 0; j < 2; j++) {
            this.map.tiles[x * 2 + i][y * 2 + j] = { ...FLOOR_TILE }
            this.traversiblePositions.push({ x: x * 2 + i, y: y * 2 + j })
          }
        }
      }
    })

    do {
      const s =
        this.traversiblePositions[
          getRandomNumber(0, this.traversiblePositions.length)
        ]
      const e =
        this.traversiblePositions[
          getRandomNumber(0, this.traversiblePositions.length)
        ]

      const path = this.map.getPath(s, e)
      if (path.length > 25) {
        this.start = s
        this.exit = e
      }
    } while (equal(this.start, ZeroVector) || equal(this.exit, ZeroVector))

    this.placeStairs()
    prettify(this.map)
  }

  placeEntities(): void {
    const playerStart = this.playerStartPosition()
    const enemyWeights = getEnemyWeights(this.map)
    const itemWeights = getItemWeights(this.map)

    this.placeEnemies(playerStart, enemyWeights)
    this.placeItems(playerStart, itemWeights)
    this.placeLights()
  }

  placeEnemies(playerStart: Vector2, weights: WeightMap) {
    const positions: Vector2[] = []
    while (positions.length < this.maxMonsters) {
      const position =
        this.traversiblePositions[
          getRandomNumber(0, this.traversiblePositions.length)
        ]

      if (
        (positions.length === 0 ||
          positions.find((p) => equal(position, p)) === undefined) &&
        !equal(position, playerStart)
      ) {
        positions.push(position)
      }
    }
    positions.forEach((p) => {
      const enemy = RNG.getWeightedValue(weights)
      if (enemy !== undefined) {
        createEnemy(this.world, p, enemy)
      }
    })
  }

  placeItems(playerStart: Vector2, weights: WeightMap) {
    const positions: Vector2[] = []
    while (positions.length < this.maxItems) {
      const position =
        this.traversiblePositions[
          getRandomNumber(0, this.traversiblePositions.length)
        ]

      if (
        (positions.length === 0 ||
          positions.find((p) => equal(position, p)) === undefined) &&
        !equal(position, playerStart)
      ) {
        positions.push(position)
      }
    }
    positions.forEach((p) => {
      const item = RNG.getWeightedValue(weights)
      if (item !== undefined) {
        createItem(this.world, item, p, undefined)
      }
    })
  }

  placeLights() {
      const positions: Vector2[] = []
      this.traversiblePositions.forEach(p => {
        const adjacentTiles = [
        this.map.tiles[p.x][p.y + 1],
        this.map.tiles[p.x + 1][p.y],
        this.map.tiles[p.x][p.y - 1],
        this.map.tiles[p.x - 1][p.y]]

        if(adjacentTiles.filter(t => t.name === 'Wall').length === 2){
            positions.push(p)
        }
      })
  
      positions.forEach((p) => {
        const color = Color.toHex([
          getRandomNumber(0, 255),
          getRandomNumber(0, 255),
          getRandomNumber(0, 255),
        ])
  
        const intensity = getRandomNumber(1, 3)
        createLight(this.world, p, LightTypes.Point as LightType, color, intensity, undefined)
      })
    }

  playerStartPosition(): Vector2 {
    return this.start
  }

  placeStairs() {
    const stairs = this.stairsLocation()
    this.map.tiles[stairs.x][stairs.y] = { ...STAIRS_DOWN_TILE }
  }

  stairsLocation(): Vector2 {
    return this.exit
  }
  isValid(): boolean {
    return true
  }
}
