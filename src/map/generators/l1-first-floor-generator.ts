import { addComponents, addEntity, type World } from 'bitecs'
import {
  clearMap,
  getEnemyWeights,
  getInteractableWeights,
  tunnel,
  type Generator,
} from './generator'
import type { Map } from '../map'
import type { Vector2, WeightMap } from '../../types'
import { add, equal, ZeroVector } from '../../utils/vector-2-funcs'
import {
  CAFE_TABLE_TILE,
  CLOSED_DOOR_TILE,
  Colors,
  CRATE_TILE,
  FLOOR_TILE,
  LightTypes,
  STAIRS_DOWN_TILE,
  WALL_TILE,
  ELEVATOR_TILE,
  STAIRS_UP_TILE,
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
import EllerMaze from 'rot-js/lib/map/ellermaze'

export class L1FirstFloorGenerator implements Generator {
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
    return "You just landed on Pluto to complete an inspection of the Corvus Lab. What they're working on is of no concern as you're just in charge of making sure their security standards are up to par."
  }

  generate(): void {
    clearMap(this.map)

    this.setupBaseRooms()
    this.setupLeft()
    this.setupRight()

    this.copyRoomsToMap()
    this.copyTunnelsToMap()
    this.copyDoorsToMap()

    this.placeStairs()
    this.setTileColors()
  }

  setupBaseRooms() {
    this.initialRoom()
    this.mainEntryWay()
    this.tunnels.push(
      tunnel(
        add(this.rooms[0].center(), { x: -3, y: 0 }),
        add(this.rooms[0].center(), { x: -3, y: -6 }),
      ),
    )
    this.tunnels.push(
      tunnel(
        add(this.rooms[0].center(), { x: -4, y: 0 }),
        add(this.rooms[0].center(), { x: -4, y: -6 }),
      ),
    )
  }

  initialRoom() {
    const room = new Room(48, 60, 10, 4)
    room.name = 'Start'
    this.rooms.push(room)
  }

  mainEntryWay() {
    const horizontal = new Room(10, 50, 80, 4)
    const vertical = new Room(48, 10, 4, 49)

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

  setupLeft() {
    const room = new Room(27, 29, 20, 20)
    room.name = 'Left Room'
    this.rooms.push(room)
    const horizontalOffset = getRandomNumber(-5, 5)
    this.tunnels.push(
      tunnel(
        { x: 40 + horizontalOffset, y: 40 },
        { x: 40 + horizontalOffset, y: 50 },
      ),
    )
    this.tunnels.push(
      tunnel(
        { x: 40 + horizontalOffset + 1, y: 40 },
        { x: 40 + horizontalOffset + 1, y: 50 },
      ),
    )

    const verticalOffset = getRandomNumber(-5, 5)
    this.tunnels.push(
      tunnel(
        { x: 40, y: 40 + verticalOffset },
        { x: 50, y: 40 + verticalOffset },
      ),
    )
    this.tunnels.push(
      tunnel(
        { x: 40, y: 40 + verticalOffset + 1 },
        { x: 50, y: 40 + verticalOffset + 1 },
      ),
    )

    this.setupDiggerRooms(room, { x: 9, y: 10 })
    this.setupCrateMaze({ x: 30, y: 32 })
  }

  setupDiggerRooms(room: Sector, offset: Vector2) {
    const digger = new Uniform(39, 40, {
      roomWidth: [5, 10],
      roomHeight: [5, 10],
      roomDugPercentage: 0.75,
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
      newRoom.name = offset.x < 50 ? 'Left Digger' : 'Right Digger'
      this.rooms.push(newRoom)
    })
  }

  setupCrateMaze(offset: Vector2) {
    const ellerGenerator = new EllerMaze(15, 15)
    ellerGenerator.create((x, y, contents) => {
      const newPoint = add({ x, y }, offset)
      if (contents === 1 && y % 2 === 0) {
        this.map.tiles[newPoint.x][newPoint.y] = {
          ...CRATE_TILE,
        }
      }
    })
  }

  setupRight() {
    const room = new Room(53, 29, 20, 20)
    room.name = 'Right Room'
    this.rooms.push(room)

    const horizontalOffset = getRandomNumber(-5, 5)
    this.tunnels.push(
      tunnel(
        { x: 60 + horizontalOffset, y: 40 },
        { x: 60 + horizontalOffset, y: 50 },
      ),
    )
    this.tunnels.push(
      tunnel(
        { x: 60 + horizontalOffset + 1, y: 40 },
        { x: 60 + horizontalOffset + 1, y: 50 },
      ),
    )

    const verticalOffset = getRandomNumber(-5, 5)
    this.tunnels.push(
      tunnel(
        { x: 50, y: 40 + verticalOffset },
        { x: 60, y: 40 + verticalOffset },
      ),
    )
    this.tunnels.push(
      tunnel(
        { x: 50, y: 40 + verticalOffset + 1 },
        { x: 60, y: 40 + verticalOffset + 1 },
      ),
    )

    this.setupDiggerRooms(room, { x: 51, y: 10 })
    this.setupCafeTablesMaze({ x: 56, y: 32 })
  }

  setupCafeTablesMaze(offset: Vector2) {
    const ellerGenerator = new EllerMaze(8, 15)
    const choices = ['ô', 'ö', 'Ö', 'ò']
    ellerGenerator.create((x, y, contents) => {
      const newPoint = add({ x: x * 2, y }, offset)
      if (contents === 1 && x % 2 === 0) {
        let char = ''
        let char2 = ''
        if (getRandomNumber(0, 100) < 25) {
          char = choices[getRandomNumber(0, 3)]
        }
        if (getRandomNumber(0, 100) < 25) {
          char2 = choices[getRandomNumber(0, 3)]
        }
        this.map.tiles[newPoint.x][newPoint.y] = {
          ...CAFE_TABLE_TILE,
          char,
        }
        this.map.tiles[newPoint.x + 1][newPoint.y] = {
          ...CAFE_TABLE_TILE,
          char: char2,
        }
      }
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
            tile.fg = Colors.L1WallChar
            tile.bg = Colors.L1Wall
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
            tile.fg = Colors.L1Wall
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
    const roomChoices = this.rooms.filter(
      (a) => a.name !== undefined && a.name.includes('Digger'),
    )
    const room = roomChoices[getRandomNumber(0, roomChoices.length - 1)]
    const position = room.center()

    const item = createItem(this.world, 'Level 1 Key', position, undefined)!
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
      add(stairs, { x: 0, y: 1 }),
      'Sweeper',
    )!
    this.map.addEntityAtLocation(sweeper, add(stairs, { x: 0, y: 1 }))
    this.map.exitPosition = stairs
  }

  exitLocation(): Vector2 {
    return { x: 49, y: 10 }
  }

  isValid(): boolean {
    return true
  }
}
