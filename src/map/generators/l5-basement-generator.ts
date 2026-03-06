import { type World } from 'bitecs'
import {
  clearMap,
  getEnemyWeights,
  getInteractableWeights,
  type Generator,
} from './generator'
import type { Map } from '../map'
import type { Vector2, WeightMap } from '../../types'
import { distance, equal, ZeroVector } from '../../utils/vector-2-funcs'
import {
  Colors,
  FLOOR_TILE,
  LightTypes,
  STAIRS_UP_TILE,
  type InteractableType,
  type LightType,
} from '../../constants'
import { getRandomNumber } from '../../utils/random'
import { Color, RNG } from 'rot-js'
import {
  createActor,
  createInteractable,
  createLight,
} from '../../ecs/templates'
import { Room } from '../containers'
import { ConstMultiplyColor } from '../../utils/color-funcs'
import Cellular from 'rot-js/lib/map/cellular'

export class L5BasementGenerator implements Generator {
  world: World
  map: Map

  rooms: Room[]
  doors: Vector2[]

  start: Vector2
  exit: Vector2
  traversiblePositions: Vector2[]

  constructor(world: World, map: Map) {
    this.world = world
    this.map = map

    this.rooms = []
    this.doors = []

    this.start = { ...ZeroVector }
    this.exit = { ...ZeroVector }
    this.traversiblePositions = []
  }

  levelStartMessage(): string {
    return "You find yourself surrounded in debris from the building falling down. Unsure of how you survived, your mission now is to stop the crazed cyborg from getting off Pluto. At least getting out of your current situation shouldn't require yet another keycard."
  }

  generate(): void {
    clearMap(this.map)

    const cellularGenerator = new Cellular(80, 50)
    cellularGenerator.randomize(0.48)
    for (let i = 0; i < 5; i++) {
      cellularGenerator.create()
    }

    cellularGenerator.connect((x, y, contents) => {
      if (contents === 1 && x > 0 && y > 0) {
        this.map.tiles[x][y] = { ...FLOOR_TILE }
        this.traversiblePositions.push({ x, y })
      }
    }, 1)

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
      if (path.length > 45) {
        this.start = s
        this.exit = e
      }
    } while (equal(this.start, ZeroVector) || equal(this.exit, ZeroVector))

    this.placeStairs()
    this.setTileColors()
  }

  setTileColors() {
    for (let i = 0; i < this.map.width; i++) {
      for (let j = 0; j < this.map.height; j++) {
        const tile = this.map.tiles[i][j]
        switch (tile.name) {
          case 'Wall':
          case 'Elevator':
            tile.fg = Colors.L5WallChar
            tile.bg = Colors.L5Wall
            break
          case 'Floor':
            tile.bg = ConstMultiplyColor(Colors.L5Wall, 0.2)

            if(getRandomNumber(0, 100) < 4){
              tile.char = '%'
              tile.fg = Colors.White
            }
            break
          case 'Stairs Up':
          case 'Stairs Down':
            tile.bg = ConstMultiplyColor(Colors.L5Wall, 0.2)
            break
          case 'Door Open':
          case 'Door Closed':
            tile.fg = Colors.L5Wall
            tile.bg = ConstMultiplyColor(Colors.L5Wall, 0.2)
            break
        }
      }
    }
  }

  placeEntities(): void {
    const playerStart = this.playerStartPosition()
    const enemyWeights = getEnemyWeights(this.map)
    const interactableWeights = getInteractableWeights(this.map)

    this.placeLights()
    this.placeInteractables(playerStart, interactableWeights)
    this.placeEnemies(playerStart, enemyWeights)
  }

  placeLights() {
    const positions: Vector2[] = []
    this.traversiblePositions.forEach((p) => {
      if (getRandomNumber(0, 100) < 2) {
        positions.push(p)
      }
    })

    positions.forEach((p) => {
      const color = Color.toHex([
        getRandomNumber(64, 192),
        getRandomNumber(64, 192),
        getRandomNumber(64, 192),
      ])

      const intensity = getRandomNumber(1, 3)
      createLight(
        this.world,
        p,
        LightTypes.Point as LightType,
        color,
        intensity,
        undefined,
      )
    })
  }

  placeEnemies(playerStart: Vector2, weights: WeightMap) {
    const positions: Vector2[] = []
    let tries = 0
    while (positions.length < 20 && tries < 50) {
      tries++
      const position =
        this.traversiblePositions[
          getRandomNumber(0, this.traversiblePositions.length)
        ]

      if (
        (positions.length === 0 ||
          positions.find((p) => equal(position, p)) === undefined) &&
        !equal(position, playerStart) &&
        positions.find((p) => distance(p, position) < 5) === undefined
      ) {
        positions.push(position)
      }
    }
    positions.forEach((p) => {
      const enemy = RNG.getWeightedValue(weights)
      if (enemy !== undefined) {
        const actor = createActor(this.world, p, enemy)
        if (actor !== undefined) {
          this.map.addEntityAtLocation(actor, p)
        }
      }
    })
  }

  placeInteractables(playerStart: Vector2, weights: WeightMap) {
    const positions: Vector2[] = []
    let tries = 0
    while (positions.length < 20 && tries < 50) {
      tries++
      const position =
        this.traversiblePositions[
          getRandomNumber(0, this.traversiblePositions.length)
        ]

      if (
          (positions.length === 0 ||
            positions.find((p) => equal(position, p)) === undefined) &&
          !equal(position, playerStart) &&
          this.map.getEntitiesAtLocation(position).length === 0 &&
          this.map.tiles[position.x][position.y].walkable
        ) {
          if (
            this.map.isWalkable(position.x + 1, position.y) &&
            this.map.isWalkable(position.x - 1, position.y) &&
            this.map.isWalkable(position.x, position.y + 1) &&
            this.map.isWalkable(position.x, position.y - 1) &&
            this.map.isWalkable(position.x + 1, position.y + 1) &&
            this.map.isWalkable(position.x - 1, position.y + 1) &&
            this.map.isWalkable(position.x + 1, position.y - 1) &&
            this.map.isWalkable(position.x - 1, position.y - 1)
          ) {
            positions.push(position)
          }
        }
    }
    positions.forEach((p) => {
        const item = RNG.getWeightedValue(weights)
        if (item !== undefined) {
          const interactable = createInteractable(
            this.world,
            p,
            item as InteractableType,
          )
          if (interactable !== undefined) {
            this.map.addEntityAtLocation(interactable, p)
          }
        }
      })
  }

  playerStartPosition(): Vector2 {
    return this.start
  }

  placeStairs() {
    const stairs = this.exitLocation()
    this.map.exitPosition = stairs
    this.map.tiles[stairs.x][stairs.y] = { ...STAIRS_UP_TILE, exit: true }
  }

  exitLocation(): Vector2 {
    return this.exit
  }

  isValid(): boolean {
    return true
  }
}
