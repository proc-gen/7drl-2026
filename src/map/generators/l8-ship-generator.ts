import { addComponents, addEntity, type World } from 'bitecs'
import {
  clearMap,
  createOctagonRoom,
  getEnemyWeights,
  getInteractableWeights,
  tunnel,
  type Generator,
} from './generator'
import type { Map } from '../map'
import type { Vector2, WeightMap } from '../../types'
import { add, distance, equal, ZeroVector } from '../../utils/vector-2-funcs'
import {
  CLOSED_DOOR_TILE,
  Colors,
  FLOOR_TILE,
  LightTypes,
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

type Node = {
  position: Vector2
  node: Sector
  connections: Node[]
}

export class L8ShipGenerator implements Generator {
  world: World
  map: Map

  rooms: Sector[]
  nodes: Node[]
  tunnels: Sector[]
  doors: Vector2[]

  start: Vector2
  exit: Vector2

  constructor(world: World, map: Map) {
    this.world = world
    this.map = map

    this.rooms = []
    this.nodes = []
    this.tunnels = []
    this.doors = []

    this.start = { ...ZeroVector }
    this.exit = { ...ZeroVector }
  }

  levelStartMessage(): string {
    return "You've made it back onto your ship, but something is off. You can smell the fresh litterbox turn, but you sense there's another one hiding around your ship because your usual welcoming committee is visibly absent."
  }

  generate(): void {
    let path: Vector2[] = []
    do {
      this.nodes.length = 0
      this.rooms.length = 0
      this.tunnels.length = 0
      this.doors.length = 0
      clearMap(this.map)

      do {
        this.nodes.push({
          position: { x: 40, y: 40 },
          node: createOctagonRoom({ x: 40, y: 40 }, 9),
          connections: [],
        })

        this.createNode(
          this.nodes[0],
          add(this.nodes[0].position, { x: 10, y: 0 }),
          66,
        )
        this.createNode(
          this.nodes[0],
          add(this.nodes[0].position, { x: -10, y: 0 }),
          66,
        )
        this.createNode(
          this.nodes[0],
          add(this.nodes[0].position, { x: 0, y: 10 }),
          66,
        )
        this.createNode(
          this.nodes[0],
          add(this.nodes[0].position, { x: 0, y: -10 }),
          66,
        )
      } while (this.nodes.length < 10)

      this.nodes.forEach((n) => {
        this.rooms.push(n.node)
        n.connections.forEach((c) => {
          this.tunnels.push(tunnel(n.node.center(), c.node.center()))
        })
      })

      this.copyRoomsToMap()
      this.copyTunnelsToMap()

      let tries = 30
      do {
        tries++
        const s = { x: getRandomNumber(0, 99), y: getRandomNumber(15, 99) }
        if (this.map.isWalkable(s.x, s.y)) {
          path = this.map.getPath(this.playerStartPosition(), s)
          if (path.length >= 35) {
            this.exit = s
          }
        }
      } while (equal(this.exit, ZeroVector) && tries < 30)
    } while (path.length < 35)

    this.placeDoors()
    this.placeStairs()
    this.setTileColors()
  }

  createNode(parentNode: Node, position: Vector2, chance: number) {
    if (getRandomNumber(0, 100) < chance) {
      const existingNode = this.nodes.find((a) => equal(a.position, position))
      if (existingNode !== undefined) {
        if (getRandomNumber(0, 100) < chance) {
          parentNode.connections.push(existingNode)
        }
      } else if (
        this.map.isInBounds(position.x, position.y) &&
        this.map.isInBounds(position.x + 10, position.y) &&
        this.map.isInBounds(position.x + 10, position.y + 10) &&
        this.map.isInBounds(position.x, position.y + 10)
      ) {
        const newNode: Node = {
          position,
          node: new Room(position.x, position.y, 9, 9),
          connections: [parentNode],
        }

        if (getRandomNumber(0, 100) < 50) {
          const width = getRandomNumber(5, 9)
          const height = getRandomNumber(5, 9)
          newNode.node = new Room(
            Math.ceil(position.x + (9 - width) / 2),
            Math.ceil(position.y + (9 - height) / 2),
            width,
            height,
          )
        } else {
          const size = getRandomNumber(2, 3) * 3
          newNode.node = createOctagonRoom(
            add(position, {
              x: Math.ceil((9 - size) / 2),
              y: Math.ceil((9 - size) / 2),
            }),
            size,
          )
        }

        this.nodes.push(newNode)
        this.createNode(newNode, add(position, { x: 10, y: 0 }), chance * 0.75)
        this.createNode(newNode, add(position, { x: -10, y: 0 }), chance * 0.75)
        this.createNode(newNode, add(position, { x: 0, y: 10 }), chance * 0.75)
        this.createNode(newNode, add(position, { x: 0, y: -10 }), chance * 0.75)
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

  placeDoors() {
    const doors: Vector2[] = []
    for (let x = 0; x < this.map.width; x++) {
      for (let y = 0; y < this.map.height; y++) {
        if (this.map.tiles[x][y].walkable) {
          if (
            this.map.isWalkable(x - 1, y) &&
            this.map.isWalkable(x + 1, y) &&
            !this.map.isWalkable(x, y - 1) &&
            !this.map.isWalkable(x, y + 1) &&
            ((this.map.isWalkable(x - 1, y - 1) &&
              this.map.isWalkable(x - 1, y + 1)) ||
              (this.map.isWalkable(x + 1, y - 1) &&
                this.map.isWalkable(x + 1, y + 1)))
          ) {
            this.addDoor(x, y)
          }

          if (
            this.map.isWalkable(x, y - 1) &&
            this.map.isWalkable(x, y + 1) &&
            !this.map.isWalkable(x - 1, y) &&
            !this.map.isWalkable(x + 1, y) &&
            ((this.map.isWalkable(x - 1, y - 1) &&
              this.map.isWalkable(x + 1, y - 1)) ||
              (this.map.isWalkable(x - 1, y + 1) &&
                this.map.isWalkable(x + 1, y + 1)))
          ) {
            this.addDoor(x, y)
          }
        }
      }
    }

    return doors
  }

  addDoor(x: number, y: number) {
    this.map.tiles[x][y] = { ...CLOSED_DOOR_TILE }
    this.doors.push({ x, y })
  }

  setTileColors() {
    for (let i = 0; i < this.map.width; i++) {
      for (let j = 0; j < this.map.height; j++) {
        const tile = this.map.tiles[i][j]
        switch (tile.name) {
          case 'Wall':
          case 'Elevator':
            tile.fg = Colors.L8WallChar
            tile.bg = Colors.L8Wall
            break
          case 'Floor':
            tile.bg = Colors.L8Floor
            break
          case 'Stairs Up':
          case 'Stairs Down':
            tile.bg = Colors.L8Floor
            break
          case 'Door Open':
          case 'Door Closed':
            tile.fg = Colors.L8Wall
            tile.bg = Colors.L8Floor
            break
        }
      }
    }
  }

  placeEntities(): void {
    let monstersLeft = 10
    const playerStart = this.playerStartPosition()
    const enemyWeights = getEnemyWeights(this.map)
    const interactableWeights = getInteractableWeights(this.map)

    this.placeDoorEntities()

    this.rooms.forEach((a) => {
      this.placeLightForRoom(a)
      monstersLeft -= this.placeEnemiesForRoom(
        a,
        monstersLeft,
        playerStart,
        enemyWeights,
      )
      this.placeInteractableForRoom(a, playerStart, interactableWeights)
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

  placeEnemiesForRoom(
    a: Sector,
    monstersLeft: number,
    playerStart: Vector2,
    weights: WeightMap,
  ) {
    if (
      a.name === 'Start' ||
      a.includedTiles.find((t) => equal(t, this.exit))
    ) {
      return 0
    }

    let numEnemies = Math.min(getRandomNumber(0, 1), monstersLeft)

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
    playerStart: Vector2,
    weights: WeightMap,
  ) {
    const maxItemsLeft = 1

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
    const actor = createActor(this.world, stairs, 'Boss Cyborg')
    if (actor !== undefined) {
      this.map.addEntityAtLocation(actor, stairs)
    }
  }

  exitLocation(): Vector2 {
    return this.exit
  }

  isValid(): boolean {
    return true
  }
}
