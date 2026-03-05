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
  createItem,
  createLight,
} from '../../ecs/templates'
import { Room, Sector } from '../containers'
import {
  PositionComponent,
  DoorComponent,
  BlockerComponent,
} from '../../ecs/components'
import Uniform from 'rot-js/lib/map/uniform'

export class L3ThirdFloorGenerator implements Generator {
  world: World
  map: Map

  rooms: Sector[]
  tunnels: Sector[]
  doors: Vector2[]

  start: Vector2
  exit: Vector2

  constructor(world: World, map: Map) {
    this.world = world
    this.map = map

    this.rooms = []
    this.tunnels = []
    this.doors = []

    this.start = { ...ZeroVector }
    this.exit = { ...ZeroVector }
  }

  levelStartMessage(): string {
    return 'Another floor, another keycard to find. At least that means they were really good about their access control, even if the computers did take over.'
  }

  generate(): void {
    clearMap(this.map)

    this.mainHallWay()
    this.setupDiggerRooms(this.rooms[0], { x: 10, y: 10 })

    this.copyRoomsToMap()
    this.copyTunnelsToMap()
    this.copyDoorsToMap()

    this.placeStairs()
    this.setTileColors()
  }

  mainHallWay() {
    const rooms: Room[] = []
    rooms.push(new Room(45, 10, 10, 9))
    rooms.push(new Room(10, 15, 80, 4))
    rooms.push(new Room(20, 15, 4, 40))
    rooms.push(new Room(60, 15, 4, 40))
    rooms.push(new Room(10, 35, 80, 4))

    const tilePositions: Vector2[] = []

    rooms.forEach((r) => {
      r.includedTiles.forEach((p) => {
        if (
          tilePositions.length === 0 ||
          tilePositions.find((a) => equal(a, p)) === undefined
        ) {
          tilePositions.push(p)
        }
      })
    })

    const sector = new Sector(10, 10)
    sector.includedTiles = tilePositions
    sector.name = 'Main Hallway'
    this.rooms.push(sector)
  }

  setupDiggerRooms(room: Sector, offset: Vector2) {
    const digger = new Uniform(80, 50, {
      roomWidth: [4, 12],
      roomHeight: [4, 12],
      roomDugPercentage: 0.55,
    })

    digger.create((x, y, contents) => {
      const newPoint = add({ x, y }, offset)
      if (
        contents === 0 &&
        room.includedTiles.find((p) => equal(p, newPoint)) === undefined
      ) {
        this.map.tiles[newPoint.x][newPoint.y] = { ...FLOOR_TILE }
      }
    })

    digger.getRooms().forEach((r) => {
      const newRoom = new Room(
        r.getLeft() + offset.x,
        r.getTop() + offset.y,
        r.getRight() - r.getLeft(),
        r.getBottom() - r.getTop(),
      )
      r.getDoors((x, y) => {
        if (
          this.doors.find((a) =>
            equal(add(a, offset), add({ x, y }, offset)),
          ) === undefined
        ) {
          this.doors.push(add({ x, y }, offset))
        }
      })
      newRoom.name = 'Digger'
      this.rooms.push(newRoom)
    })
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
            tile.fg = Colors.L3WallChar
            tile.bg = Colors.L3Wall
            break
          case 'Floor':
            tile.bg = Colors.L1Floor

            if(getRandomNumber(0, 100) < 3){
              tile.char = '%'
              tile.fg = Colors.White
            }
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
    let monstersLeft = 30
    let interactablesLeft = 5
    const playerStart = this.playerStartPosition()
    const enemyWeights = getEnemyWeights(this.map)
    const interactableWeights = getInteractableWeights(this.map)

    this.placeKey()
    this.placeDoorEntities()
    this.placePickpocket(playerStart)

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

  placeKey() {
    const rooms = this.rooms.filter((a) => a.name !== 'Main Hallway')
    let placed = false
    let position: Vector2 = this.playerStartPosition()

    do {
      const room = rooms[getRandomNumber(0, rooms.length - 1)]
      let tries = 0
      do {
        tries++
        position =
          room.includedTiles[getRandomNumber(0, room.includedTiles.length - 1)]
        if (
          this.map.tiles[position.x][position.y].name === FLOOR_TILE.name &&
          distance(this.playerStartPosition(), position) >= 30
        ) {
          placed = true
        }
      } while (tries < 10 && !placed)
    } while (!placed)

    const item = createItem(this.world, 'Level 3 Key', position, undefined)!
    this.map.addEntityAtLocation(item, position)
  }

  placeEnemiesForRoom(
    a: Sector,
    monstersLeft: number,
    playerStart: Vector2,
    weights: WeightMap,
  ) {
    if (a.name === 'Start') {
      return 0
    }

    let numEnemies =
      a.name === 'Main Hallway'
        ? 8
        : Math.min(
            getRandomNumber(0, Math.ceil(a.includedTiles.length / 20)),
            monstersLeft,
          )

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

  placeInteractableForRoom(
    a: Sector,
    interactablesLeft: number,
    playerStart: Vector2,
    weights: WeightMap,
  ) {
    const maxItemsLeft = Math.min(interactablesLeft, 1)

    let numItems = Math.min(getRandomNumber(0, 2), maxItemsLeft)
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

  placePickpocket(playerStart: Vector2) {
    const rooms = this.rooms
    let placed = false
    let position: Vector2 = ZeroVector

    do {
      const room = rooms[getRandomNumber(0, rooms.length - 1)]
      let tries = 0
      do {
        tries++
        position =
          room.includedTiles[getRandomNumber(0, room.includedTiles.length - 1)]
        if (
          this.map.tiles[position.x][position.y].name === FLOOR_TILE.name &&
          distance(playerStart, position) >= 30
        ) {
          placed = true
        }
      } while (tries < 10 && !placed)
    } while (!placed)

    const pickpocket = createActor(this.world, position, 'Pickpocket Bot')!
    this.map.addEntityAtLocation(pickpocket, position)
  }

  playerStartPosition(): Vector2 {
    return { x: 48, y: 10 }
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
