import { addComponents, addEntity, type World } from 'bitecs'
import {
  clearMap,
  getEnemyWeights,
  getInteractableWeights,
  type Generator,
} from './generator'
import type { Map } from '../map'
import type { Vector2, WeightMap } from '../../types'
import { add, distance, equal, ZeroVector } from '../../utils/vector-2-funcs'
import {
  CLOSED_DOOR_TILE,
  Colors,
  ELEVATOR_TILE,
  FLOOR_TILE,
  InteractableTypes,
  LightTypes,
  STAIRS_DOWN_TILE,
  STAIRS_UP_TILE,
  WALL_TILE,
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
import { Room, Sector } from '../containers'
import {
  PositionComponent,
  DoorComponent,
  BlockerComponent,
} from '../../ecs/components'
import IceyMaze from 'rot-js/lib/map/iceymaze'

export class L4FourthFloorGenerator implements Generator {
  world: World
  map: Map

  rooms: Sector[]
  tunnels: Sector[]
  doors: Vector2[]
  traversiblePositions: Vector2[]

  start: Vector2
  exit: Vector2

  constructor(world: World, map: Map) {
    this.world = world
    this.map = map

    this.rooms = []
    this.tunnels = []
    this.doors = []
    this.traversiblePositions = []

    this.start = { ...ZeroVector }
    this.exit = { ...ZeroVector }
  }

  levelStartMessage(): string {
    return 'Finally, the floor with the shutoff for the alarm! Being able to hear yourself think would be pretty nice right about now. So would getting off this frozen piece of space rock.'
  }

  generate(): void {
    clearMap(this.map)

    this.rooms.push(new Room(45, 10, 10, 10))
    this.rooms.push(new Room(45, 40, 10, 10))
    this.rooms.push(new Room(10, 10, 10, 10))
    this.rooms.push(new Room(70, 10, 10, 10))
    this.rooms.push(new Room(10, 40, 10, 10))
    this.rooms.push(new Room(70, 40, 10, 10))

    const ellerGenerator = new IceyMaze(38, 20, 3)
    ellerGenerator.create((x, y, contents) => {
      if (contents === 0) {
        for (let i = 0; i < 2; i++) {
          for (let j = 0; j < 2; j++) {
            this.map.tiles[x * 2 + i + 8][y * 2 + j + 8] = { ...FLOOR_TILE }
            this.traversiblePositions.push({
              x: x * 2 + i + 8,
              y: y * 2 + j + 8,
            })
          }
        }
      }
    })

    this.copyRoomsToMap()
    this.copyTunnelsToMap()
    this.copyDoorsToMap()

    this.placeStairs()
    this.setTileColors()
  }

  copyRoomsToMap() {
    this.rooms.forEach((a) => {
      a.includedTiles.forEach((t) => {
        if (this.map.tiles[t.x][t.y].name === WALL_TILE.name) {
          this.map.tiles[t.x][t.y] = { ...FLOOR_TILE }
        }
      })
    })
  }

  copyTunnelsToMap() {
    this.tunnels.forEach((a) => {
      a.includedTiles.forEach((t) => {
        if (this.map.tiles[t.x][t.y].name === WALL_TILE.name) {
          this.map.tiles[t.x][t.y] = { ...FLOOR_TILE }
        }
      })
    })
  }

  copyDoorsToMap() {
    const newDoors: Vector2[] = []
    this.doors.forEach((a) => {
      if (
        (this.map.tiles[a.x + 1][a.y].name === WALL_TILE.name &&
          this.map.tiles[a.x - 1][a.y].name === WALL_TILE.name) ||
        (this.map.tiles[a.x][a.y + 1].name === WALL_TILE.name &&
          this.map.tiles[a.x][a.y - 1].name === WALL_TILE.name)
      ) {
        newDoors.push(a)
        this.map.tiles[a.x][a.y] = { ...CLOSED_DOOR_TILE }
      }
    })

    this.doors = newDoors
  }

  setTileColors() {
    for (let i = 0; i < this.map.width; i++) {
      for (let j = 0; j < this.map.height; j++) {
        const tile = this.map.tiles[i][j]
        switch (tile.name) {
          case 'Wall':
          case 'Elevator':
            tile.fg = Colors.L4WallChar
            tile.bg = Colors.L4Wall
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
            tile.fg = Colors.L4Wall
            tile.bg = Colors.L1Floor
            break
        }
      }
    }
  }

  placeEntities(): void {
    let monstersLeft = 20
    let interactablesLeft = 10
    const playerStart = this.playerStartPosition()
    const enemyWeights = getEnemyWeights(this.map)
    const interactableWeights = getInteractableWeights(this.map)

    this.placeDoorEntities()
    this.placeLockdownSwitch()

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

    this.placeRemainingEnemies(monstersLeft, playerStart, enemyWeights)
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

  placeLightForRoom(a: Sector) {
    const numLights = Math.ceil(a.includedTiles.length / 100)
    for (let i = 0; i < numLights; i++) {
      const position =
        a.includedTiles[getRandomNumber(0, a.includedTiles.length - 1)]

      const color = Color.toHex([
        getRandomNumber(64, 192),
        getRandomNumber(64, 192),
        getRandomNumber(64, 192),
      ])

      const intensity = getRandomNumber(1, 3)
      const lightType = LightTypes.Point
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
  }

  placeEnemiesForRoom(
    a: Sector,
    monstersLeft: number,
    playerStart: Vector2,
    weights: WeightMap,
  ) {
    let numEnemies = Math.min(getRandomNumber(1, 3), monstersLeft)

    if (numEnemies > 0) {
      const positions: Vector2[] = []
      let tries = 0
      while (positions.length < numEnemies && tries < 30) {
        tries++
        const position =
          a.includedTiles[getRandomNumber(0, a.includedTiles.length - 1)]

        if (
          (positions.length === 0 ||
            positions.find((p) => equal(position, p)) === undefined) &&
          distance(playerStart, position) > 10 &&
          this.map.tiles[position.x][position.y].walkable
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

      numEnemies = positions.length
    }

    return numEnemies
  }

  placeRemainingEnemies(monstersLeft: number,
    playerStart: Vector2,
    weights: WeightMap,){
    let numEnemies = monstersLeft

    if (numEnemies > 0) {
      const positions: Vector2[] = []
      let tries = 0
      while (positions.length < numEnemies && tries < 30) {
        tries++
        const position =
          this.traversiblePositions[getRandomNumber(0, this.traversiblePositions.length - 1)]

        if (
          (positions.length === 0 ||
            positions.find((p) => equal(position, p)) === undefined) &&
          distance(playerStart, position) > 10 &&
          this.map.tiles[position.x][position.y].walkable
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

      numEnemies = positions.length
    }
  }

  placeInteractableForRoom(
    a: Sector,
    interactablesLeft: number,
    playerStart: Vector2,
    weights: WeightMap,
  ) {
    const maxItemsLeft = Math.min(interactablesLeft, 1)

    let numItems = Math.min(getRandomNumber(1, 3), maxItemsLeft)
    let numTries = 0
    if (numItems > 0) {
      const positions: Vector2[] = []
      while (positions.length < numItems && numTries < 50) {
        numTries++
        const position =
          a.includedTiles[getRandomNumber(0, a.includedTiles.length - 1)]

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

  placeLockdownSwitch() {
    const room = this.rooms[getRandomNumber(2, this.rooms.length - 1)]

    const interactable = createInteractable(
      this.world,
      room.center(),
      InteractableTypes.LockdownSwitch as InteractableType,
    )
    if (interactable !== undefined) {
      this.map.addEntityAtLocation(interactable, room.center())
    }
  }

  playerStartPosition(): Vector2 {
    const firstRoom = this.rooms[0]
    return firstRoom.center()
  }

  placeStairs() {
    const stairs = this.exitLocation()
    this.map.tiles[stairs.x - 1][stairs.y] = { ...STAIRS_DOWN_TILE }
    this.map.tiles[stairs.x + 2][stairs.y] = { ...ELEVATOR_TILE }
    this.map.tiles[stairs.x][stairs.y] = { ...STAIRS_UP_TILE, exit: true }
    const sweeper = createActor(
      this.world,
      add(stairs, { x: 1, y: 1 }),
      'Sweeper',
    )!
    this.map.addEntityAtLocation(sweeper, add(stairs, { x: 1, y: 1 }))
    this.map.exitPosition = stairs
  }

  exitLocation(): Vector2 {
    return { x: 49, y: 10 }
  }

  isValid(): boolean {
    return true
  }
}
