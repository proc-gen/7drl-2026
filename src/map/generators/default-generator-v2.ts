import { addComponents, addEntity, type World } from 'bitecs'

import { FLOOR_TILE, STAIRS_DOWN_TILE, LightTypes, type LightType } from '../../constants'
import type { Map } from '../map'
import { Room, type Sector } from '../containers'
import {
  clearMap,
  getEnemyWeights,
  getItemWeights,
  placeDoors,
  prettify,
  tunnel,
  type Generator,
} from './generator'
import type { Vector2, WeightMap } from '../../types'
import { getRandomNumber } from '../../utils/random'
import { createEnemy, createItem, createLight } from '../../ecs/templates'
import { distance, equal } from '../../utils/vector-2-funcs'
import { Color, RNG } from 'rot-js'
import {
  BlockerComponent,
  DoorComponent,
  PositionComponent,
} from '../../ecs/components'

export class DefaultGeneratorV2 implements Generator {
  world: World
  map: Map
  rooms: Room[]
  tunnels: Sector[]
  doors: Vector2[]

  minRoomSize: number
  maxRoomSize: number
  maxRooms: number
  maxMonsters: number
  maxItems: number

  constructor(
    world: World,
    map: Map,
    maxRooms: number,
    minRoomSize: number,
    maxRoomSize: number,
    maxMonsters: number,
    maxItems: number,
  ) {
    this.world = world
    this.map = map
    this.rooms = []
    this.tunnels = []
    this.doors = []

    this.maxRooms = maxRooms
    this.minRoomSize = minRoomSize
    this.maxRoomSize = maxRoomSize
    this.maxMonsters = maxMonsters
    this.maxItems = maxItems
  }

  generate(): void {
    this.rooms.length = 0
    this.createRooms()

    this.copyGeneratedToMap()
  }

  copyGeneratedToMap(){
    clearMap(this.map)
    this.tunnels.length = 0
    this.connectRooms()

    this.copyRoomsToMap()
    this.copyTunnelsToMap()
    prettify(this.map)
    this.placeStairs()
    this.doors = placeDoors(this.map)
  }

  createRooms() {
    for (let i = 0; i < this.maxRooms; i++) {
      const width = getRandomNumber(this.minRoomSize, this.maxRoomSize)
      const height = getRandomNumber(this.minRoomSize, this.maxRoomSize)

      const x = getRandomNumber(0, this.map.width - width - 1)
      const y = getRandomNumber(0, this.map.height - height - 1)

      this.addRoom(x, y, width, height)
    }
  }

  connectRooms() {
    const connectedRooms: { a: Vector2; b: Vector2 }[] = []
    for (let i = 0; i < this.rooms.length - 1; i++) {
      const connectingRoom: { a: Vector2; b: Vector2 } = {
        a: this.rooms[i].center(),
        b: { x: 0, y: 0 },
      }
      const connectingRooms = this.rooms
        .filter((a) => !equal(a.center(), this.rooms[i].center()))
        .sort(
          (a, b) =>
            distance(a.center(), this.rooms[i].center()) -
            distance(b.center(), this.rooms[i].center()),
        )

      let nextIndex = 0
      let added = false
      do {
        if (
          connectedRooms.length === 0 ||
          connectedRooms.find(
            (a) =>
              (equal(a.a, this.rooms[i].center()) &&
                equal(a.b, connectingRooms[nextIndex].center())) ||
              (equal(a.b, this.rooms[i].center()) &&
                equal(a.a, connectingRooms[nextIndex].center())),
          ) === undefined
        ) {
          connectingRoom.b = connectingRooms[nextIndex].center()
          connectedRooms.push(connectingRoom)
          added = true
        }
        nextIndex++
      } while (nextIndex < connectingRooms.length && !added)
    }

    connectedRooms.forEach((a) => {
      this.tunnels.push(tunnel(a.a, a.b))
    })
  }

  addRoom(x: number, y: number, width: number, height: number) {
    const newRoom = new Room(x, y, width, height)

    if (this.rooms.length === 0) {
      this.rooms.push(newRoom)
      return true
    } else {
      let roomPossible = true
      let i = 0

      while (i < this.rooms.length && roomPossible) {
        roomPossible = !this.rooms[i].intersects(newRoom)
        i++
      }

      if (roomPossible) {
        this.rooms.push(newRoom)
        return true
      }
    }
  }

  placeEntities() {
    this.copyGeneratedToMap()

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
    const positions: Vector2[] = []
    while (positions.length < 2) {
      const position = {
        x: getRandomNumber(a.x + 1, a.x + a.width - 2),
        y: getRandomNumber(a.y + 1, a.y + a.height - 2),
      }

      if (
        positions.length === 0 ||
        positions.find((p) => equal(position, p)) === undefined
      ) {
        positions.push(position)
      }
    }

    positions.forEach((p) => {
      const color = Color.toHex([
        getRandomNumber(0, 255),
        getRandomNumber(0, 255),
        getRandomNumber(0, 255),
      ])

      const intensity = getRandomNumber(1, 3)
      const lightType =
        getRandomNumber(0, 100) > 50
          ? LightTypes.Point
          : LightTypes.Spot
      const target =
        lightType === LightTypes.Spot ? a.center() : undefined
      createLight(this.world, p, lightType as LightType, color, intensity, target)
    })
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

  copyRoomsToMap() {
    this.rooms.forEach((a) => {
      a.includedTiles.forEach((t) => {
        if (
          t.x > a.x &&
          t.y > a.y &&
          t.x < a.x + a.width - 1 &&
          t.y < a.y + a.height - 1
        ) {
          this.map.tiles[t.x][t.y] = { ...FLOOR_TILE }
        }
      })
    })
  }

  copyTunnelsToMap() {
    this.tunnels.forEach((a) => {
      a.includedTiles.forEach((t) => {
        this.map.tiles[t.x][t.y] = { ...FLOOR_TILE }
      })
    })
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
    let valid = false

    const start = this.rooms[0]
    const goodRooms = [start]
    for(let i = 1; i < this.rooms.length; i++){
      const path = this.map.getPath(start.center(), this.rooms[i].center())
      if(path.length > 0){
        goodRooms.push(this.rooms[i])
      }
    }

    if(goodRooms.length > this.rooms.length / 2){
      valid = true
      this.rooms = goodRooms
    }

    return valid
  }
}
