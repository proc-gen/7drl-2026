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
  CUBEWALL_TILE,
  CUBE_DESK_TILE,
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

export class L2SecondFloorGenerator implements Generator {
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
    return 'The cyborg that came out of the elevator was something else, but the ringing of the lockdown alarm in your ears keeps you from thinking too much about it.'
  }

  generate(): void {
    clearMap(this.map)

    this.mainEntryWay()
    this.setupDiggerRooms({ x: 10, y: 10 })
    this.setupDiggerRooms({ x: 60, y: 10 })
    this.setupDiggerRooms({ x: 10, y: 44 })
    this.setupDiggerRooms({ x: 60, y: 44 })

    this.copyRoomsToMap()
    this.copyTunnelsToMap()
    this.copyDoorsToMap()

    this.placeStairs()

    this.setupCubicles()

    this.setTileColors()
  }

  mainEntryWay() {
    const horizontal = new Room(10, 25, 80, 20)
    const vertical = new Room(33, 10, 30, 49)

    const tilePositions = horizontal.includedTiles
    vertical.includedTiles.forEach((p) => {
      if (tilePositions.find((a) => !equal(a, p))) {
        tilePositions.push(p)
      }
    })

    const sector = new Sector(10, 10)
    sector.includedTiles = tilePositions
    sector.name = 'Main Hallway'
    this.rooms.push(sector)
  }

  setupDiggerRooms(offset: Vector2) {
    const digger = new Uniform(26, 18, {
      roomWidth: [3, 7],
      roomHeight: [3, 7],
      roomDugPercentage: 0.75,
    })

    digger.create((x, y, contents) => {
      const newPoint = add({ x, y }, offset)
      if (contents === 0) {
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

  setupCubicles() {
    let tries = 0
    while (tries < 30) {
      tries++

      const position = {
        x: getRandomNumber(10, 90),
        y: getRandomNumber(10, 50),
      }
      let viable = true
      for (let x = position.x; x < position.x + 10; x++) {
        for (let y = position.y; y < position.y + 10; y++) {
          if (
            !this.map.isWalkable(x, y) ||
            this.map.tiles[x][y].name !== FLOOR_TILE.name
          ) {
            viable = false
          }
        }
      }

      if (viable) {
        if (getRandomNumber(0, 100) < 50) {
          this.setupCubicle(add(position, { x: 1, y: 1 }), 4)
        }
        if (getRandomNumber(0, 100) < 50) {
          this.setupCubicle(add(position, { x: 5, y: 1 }), 1)
        }
        if (getRandomNumber(0, 100) < 50) {
          this.setupCubicle(add(position, { x: 5, y: 5 }), 2)
        }
        if (getRandomNumber(0, 100) < 50) {
          this.setupCubicle(add(position, { x: 1, y: 5 }), 3)
        }
      }
    }
  }

  setupCubicle(position: Vector2, opening: number) {
    let line1 = '╔══╗'
    let line2 = '║XX║'
    let line3 = '║XX║'
    let line4 = '╚══╝'

    if (opening === 1) {
      line1 = '╔═  '
      line2 = '║X  '
    } else if (opening === 2) {
      line3 = '║X  '
      line4 = '╚═  '
    } else if (opening === 3) {
      line3 = '  X║'
      line4 = '  ═╝'
    } else {
      line1 = '  ═╗'
      line2 = '  X║'
    }

    let lines = [line1, line2, line3, line4]

    for (let x = 0; x < 4; x++) {
      for (let y = 0; y < 4; y++) {
        const char = lines[y][x]
        if (char !== ' ') {
          const p = add(position, { x, y })
          if (char === 'X') {
            this.map.tiles[p.x][p.y] = { ...CUBE_DESK_TILE }
          } else {
            this.map.tiles[p.x][p.y] = { ...CUBEWALL_TILE, char: lines[y][x] }
          }
        }
      }
    }
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
            tile.fg = Colors.L2WallChar
            tile.bg = Colors.L2Wall
            break
          case 'Floor':
          case 'Cubicle Wall':
            tile.bg = Colors.L1Floor
            break
          case 'Stairs Up':
          case 'Stairs Down':
            tile.bg = Colors.L1Floor
            break
          case 'Door Open':
          case 'Door Closed':
            tile.fg = Colors.L2Wall
            tile.bg = Colors.L1Floor
            break
        }
      }
    }
  }

  placeEntities(): void {
    let monstersLeft = 20
    let interactablesLeft = 5
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
    const room = this.rooms[0]
    let position: Vector2 = ZeroVector
    do {
      position =
        room.includedTiles[getRandomNumber(0, room.includedTiles.length - 1)]
    } while (
      this.map.tiles[position.x][position.y].name !== FLOOR_TILE.name ||
      distance(this.playerStartPosition(), position) < 30
    )

    const item = createItem(this.world, 'Level 2 Key', position, undefined)!
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

    let numEnemies = Math.min(
      getRandomNumber(
        0,
        ['Left Room', 'Right Room'].includes(a.name ?? '') ? 4 : 2,
      ),
      monstersLeft,
    )

    if (numEnemies > 0) {
      const positions: Vector2[] = []
      while (positions.length < numEnemies) {
        const position =
          a.includedTiles[getRandomNumber(0, a.includedTiles.length - 1)]

        if (
          (positions.length === 0 ||
            positions.find((p) => equal(position, p)) === undefined) &&
          !equal(position, playerStart) &&
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
