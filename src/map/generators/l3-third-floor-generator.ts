import Digger from 'rot-js/lib/map/digger'
import { addComponents, addEntity, type World } from 'bitecs'
import {
  clearMap,
  getEnemyWeights,
  getInteractableWeights,
  type Generator,
} from './generator'
import type { Map } from '../map'
import type { Vector2, WeightMap } from '../../types'
import { equal, ZeroVector } from '../../utils/vector-2-funcs'
import {
  CLOSED_DOOR_TILE,
  Colors,
  FLOOR_TILE,
  LightTypes,
  STAIRS_DOWN_TILE,
  type InteractableType,
  type LightType,
} from '../../constants'
import { getRandomNumber } from '../../utils/random'
import { Color, RNG } from 'rot-js'
import {
  createActor,
  createInteractable,
  createItem,
  createLight,
} from '../../ecs/templates'
import { Room } from '../containers'
import {
  PositionComponent,
  DoorComponent,
  BlockerComponent,
} from '../../ecs/components'

export class L3ThirdFloorGenerator implements Generator {
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

  levelStartMessage(): string {
    return 'Another floor, another keycard to find. At least that means they were really good about their access control, even if the computers did take over.'
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
    this.setTileColors()
  }

  setTileColors() {
    for (let i = 0; i < this.map.width; i++) {
      for (let j = 0; j < this.map.height; j++) {
        const tile = this.map.tiles[i][j]
        switch (tile.name) {
          case 'Wall':
          case 'Elevator':
            tile.fg = Colors.L3WallChar
            tile.bg = Colors.L3Wall
            break
          case 'Floor':
            tile.bg = Colors.L1Floor
            break
          case 'Stairs Up':
          case 'Stairs Down':
            tile.bg = Colors.L1Floor
            break
          case 'Door Open':
          case 'Door Closed':
            tile.fg = Colors.L3Wall
            tile.bg = Colors.L1Floor
            break
        }
      }
    }
  }

  placeEntities(): void {
    let monstersLeft = this.maxMonsters
    let interactablesLeft = 10
    const playerStart = this.playerStartPosition()
    const enemyWeights = getEnemyWeights(this.map)
    const interactableWeights = getInteractableWeights(this.map)

    this.placeKey()
    this.placeDoorEntities()

    this.rooms.forEach((a) => {
      this.placeLightForRoom(a)
      monstersLeft -= this.placeEnemiesForRoom(
        a,
        monstersLeft,
        playerStart,
        enemyWeights,
      )
      interactablesLeft -= this.placeInteractableForRoom(
        a,
        interactablesLeft,
        playerStart,
        interactableWeights,
      )
    })
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

  placeKey() {
    const room = this.rooms[getRandomNumber(1, this.rooms.length - 2)]
    const position = {
      x: getRandomNumber(room.x + 1, room.x + room.width - 2),
      y: getRandomNumber(room.y + 1, room.y + room.height - 2),
    }

    const item = createItem(this.world, 'Level 3 Key', position, undefined)!
    this.map.addEntityAtLocation(item, position)
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
          const actor = createActor(this.world, p, enemy)
          if (actor !== undefined) {
            this.map.addEntityAtLocation(actor, p)
          }
        }
      })
    }

    return numEnemies
  }

  placeInteractableForRoom(
    a: Room,
    interactablesLeft: number,
    playerStart: Vector2,
    weights: WeightMap,
  ) {
    const maxItemsLeft = Math.min(interactablesLeft, 2)

    let numItems = Math.min(getRandomNumber(0, 2), maxItemsLeft)
    let numTries = 0
    if (numItems > 0) {
      const positions: Vector2[] = []
      while (positions.length < numItems && numTries < 30) {
        numTries++
        const position = {
          x: getRandomNumber(a.x + 1, a.x + a.width - 2),
          y: getRandomNumber(a.y + 1, a.y + a.height - 2),
        }

        if (
          (positions.length === 0 ||
            positions.find((p) => equal(position, p)) === undefined) &&
          !equal(position, playerStart) &&
          this.map.getEntitiesAtLocation(position).length === 0
        ) {
          positions.push(position)
        }
      }
      numItems = positions.length
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

    return numItems
  }

  playerStartPosition(): Vector2 {
    const firstRoom = this.rooms[0]
    return firstRoom.center()
  }

  placeStairs() {
    const stairs = this.exitLocation()
    this.map.tiles[stairs.x][stairs.y] = { ...STAIRS_DOWN_TILE }
  }

  exitLocation(): Vector2 {
    const lastRoom = this.rooms[this.rooms.length - 1]
    return lastRoom.center()
  }

  isValid(): boolean {
    return true
  }
}
