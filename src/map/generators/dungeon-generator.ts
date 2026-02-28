import Digger from 'rot-js/lib/map/digger'
import { addComponents, addEntity, type World } from 'bitecs'
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
import {
  CLOSED_DOOR_TILE,
  FLOOR_TILE,
  LightTypes,
  STAIRS_DOWN_TILE,
  type LightType,
} from '../../constants'
import { getRandomNumber } from '../../utils/random'
import { Color, RNG } from 'rot-js'
import { createEnemy, createItem, createLight } from '../../ecs/templates'
import { Room } from '../containers'
import {
  PositionComponent,
  DoorComponent,
  BlockerComponent,
} from '../../ecs/components'

export class DungeonGenerator implements Generator {
  world: World
  map: Map

  maxMonsters: number
  maxItems: number
  mazeSize: Vector2
  minRoomSize: number
  maxRoomSize: number

  rooms: Room[]
  doors: Vector2[]

  start: Vector2
  exit: Vector2

  constructor(
    world: World,
    map: Map,
    maxMonsters: number,
    maxItems: number,
    mazeSize: Vector2,
    minRoomSize: number,
    maxRoomSize: number,
  ) {
    this.world = world
    this.map = map
    this.maxMonsters = maxMonsters
    this.maxItems = maxItems
    this.mazeSize = mazeSize
    this.minRoomSize = minRoomSize
    this.maxRoomSize = maxRoomSize

    this.rooms = []
    this.doors = []

    this.start = { ...ZeroVector }
    this.exit = { ...ZeroVector }
  }

  generate(): void {
    clearMap(this.map)

    const digger = new Digger(
      Math.min(this.mazeSize.x * 2, this.map.width),
      Math.min(this.mazeSize.y * 2, this.map.height),
      {
        roomWidth: [this.minRoomSize, this.maxRoomSize],
        roomHeight: [this.minRoomSize, this.maxRoomSize],
        dugPercentage: 0.3,
      },
    )

    digger.create((x, y, contents) => {
      if (contents === 0) {
        this.map.tiles[x][y] = { ...FLOOR_TILE }
      }
    })

    digger.getRooms().forEach((r) => {
      this.rooms.push(
        new Room(
          r.getLeft(),
          r.getTop(),
          r.getRight() - r.getLeft(),
          r.getBottom() - r.getTop(),
        ),
      )
      r.getDoors((x, y) => {
        this.doors.push({ x, y })
        this.map.tiles[x][y] = { ...CLOSED_DOOR_TILE }
      })
    })

    this.placeStairs()
    prettify(this.map)
  }

  placeEntities(): void {
    let monstersLeft = this.maxMonsters
    let itemsLeft = this.maxItems
    const playerStart = this.playerStartPosition()
    const enemyWeights = getEnemyWeights(this.map)
    const itemWeights = getItemWeights(this.map)

    this.rooms.forEach((a) => {
      this.placeLightForRoom(a)
      monstersLeft -= this.placeEnemiesForRoom(
        a,
        monstersLeft,
        playerStart,
        enemyWeights,
      )
      itemsLeft -= this.placeItemsForRoom(
        a,
        itemsLeft,
        playerStart,
        itemWeights,
      )
    })

    this.placeDoorEntities()
  }

  placeDoorEntities() {
    this.doors.forEach((a) => {
      const door = addEntity(this.world)
      addComponents(
        this.world,
        door,
        PositionComponent,
        DoorComponent,
        BlockerComponent,
      )
      PositionComponent.values[door] = { ...a }
      DoorComponent.values[door] = { open: false }
      this.map.addEntityAtLocation(door, PositionComponent.values[door])
    })
  }

  placeLightForRoom(a: Room) {
    const position = {
      x: getRandomNumber(a.x + 1, a.x + a.width - 2),
      y: getRandomNumber(a.y + 1, a.y + a.height - 2),
    }

    const color = Color.toHex([
      getRandomNumber(0, 255),
      getRandomNumber(0, 255),
      getRandomNumber(0, 255),
    ])

    const intensity = getRandomNumber(1, 3)
    const lightType =
      getRandomNumber(0, 100) > 50 ? LightTypes.Point : LightTypes.Spot
    const target = lightType === LightTypes.Spot ? a.center() : undefined
    createLight(
      this.world,
      position,
      lightType as LightType,
      color,
      intensity,
      target,
    )
  }

  placeEnemiesForRoom(
    a: Room,
    monstersLeft: number,
    playerStart: Vector2,
    weights: WeightMap,
  ) {
    const maxMonstersLeft = Math.min(
      monstersLeft,
      Math.floor(this.maxMonsters / 2),
    )
    let numEnemies = Math.min(getRandomNumber(0, 2), maxMonstersLeft)

    if (numEnemies > 0) {
      const positions: Vector2[] = []
      while (positions.length < numEnemies) {
        const position = {
          x: getRandomNumber(a.x + 1, a.x + a.width - 2),
          y: getRandomNumber(a.y + 1, a.y + a.height - 2),
        }

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

    return numEnemies
  }

  placeItemsForRoom(
    a: Room,
    itemsLeft: number,
    playerStart: Vector2,
    weights: WeightMap,
  ) {
    const maxItemsLeft = Math.min(itemsLeft, Math.floor(this.maxItems / 2))

    let numItems = Math.min(getRandomNumber(0, 2), maxItemsLeft)

    if (numItems > 0) {
      const positions: Vector2[] = []
      while (positions.length < numItems) {
        const position = {
          x: getRandomNumber(a.x + 1, a.x + a.width - 2),
          y: getRandomNumber(a.y + 1, a.y + a.height - 2),
        }

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

    return numItems
  }

  playerStartPosition(): Vector2 {
    const firstRoom = this.rooms[0]
    return firstRoom.center()
  }

  placeStairs() {
    const stairs = this.stairsLocation()
    this.map.tiles[stairs.x][stairs.y] = { ...STAIRS_DOWN_TILE }
  }

  stairsLocation(): Vector2 {
    const lastRoom = this.rooms[this.rooms.length - 1]
    return lastRoom.center()
  }

  isValid(): boolean {
    return true
  }
}
