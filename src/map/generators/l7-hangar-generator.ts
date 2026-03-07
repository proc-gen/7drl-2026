import { type World } from 'bitecs'
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
  Colors,
  EXIT_TO_NEXT_LEVEL,
  FLOOR_TILE,
  isFloor,
  LightTypes,
  SHIP_TILE,
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
import { Room } from '../containers'

const ship1 = ['/--\\', '|XX|', '|XX|', '\\__/']

const ship2 = ['----', '\\XX/', '\\XX/', '\\__/']

const ship3 = ['\\/\\/', '/XX\\', '\\XX/', ' \\/ ']

const ship4 = ['\\------/', ' \\XXXX/ ', '  \\XX/  ', '   \\/   ']

const ship5 = [' /--\\ ', '/XXXX\\', '|XXXX|', '|XXXX|', '\\XXXX/', ' \\__/ ']

const ships = [ship1, ship2, ship3, ship4, ship5]

const shipColors = [
  Colors.L2Wall,
  Colors.L3Wall,
  Colors.L4Wall,
  Colors.L5Wall,
  Colors.DarkRed,
]

type ShipPlacement = {
  position: Vector2
  ship: string[]
  color: string
  room: Room
}

export class L7HangarGenerator implements Generator {
  world: World
  map: Map

  rooms: Room[]
  ships: ShipPlacement[]

  start: Vector2
  exit: Vector2

  constructor(world: World, map: Map) {
    this.world = world
    this.map = map

    this.rooms = []
    this.ships = []

    this.start = { ...ZeroVector }
    this.exit = { ...ZeroVector }
  }

  levelStartMessage(): string {
    return "You're so close to your ship you can almost smell your cat's litter box. Of course, one can never forget that smell even when there's several intelligent obstacles in their path."
  }

  generate(): void {
    clearMap(this.map)

    this.rooms.push(new Room(10, 10, 80, 80))
    this.copyRoomsToMap()
    this.placeShips()

    do {
      const s = { x: getRandomNumber(0, 99), y: getRandomNumber(10, 20) }
      if (this.map.isWalkable(s.x, s.y)) {
        this.start = s
      }
    } while (equal(this.start, ZeroVector))

    do {
      const e = this.ships[getRandomNumber(0, this.ships.length - 1)]
      const path = this.map.getPath(this.start, e.position)
      if (path.length > 50) {
        this.exit = e.position
        e.color = Colors.L8Wall
      }
    } while (equal(this.exit, ZeroVector))

    this.copyShipsToMap()
    this.placeStairs()
    this.setTileColors()
  }

  placeShips() {
    let tries = 0
    while (tries < 50) {
      tries++

      const position = {
        x: getRandomNumber(10, 90),
        y: getRandomNumber(10, 90),
      }
      const ship = ships[getRandomNumber(0, ships.length - 1)]
      let viable = true
      for (let x = position.x; x < position.x + ship[0].length + 2; x++) {
        for (let y = position.y; y < position.y + ship.length + 2; y++) {
          if (
            !this.map.isWalkable(x, y) ||
            !isFloor(this.map.tiles[x][y]) ||
            this.ships.find(
              (a) =>
                a.room.includedTiles.find((t) => equal(t, { x, y })) !==
                undefined,
            ) !== undefined
          ) {
            viable = false
          }
        }
      }
      if (viable) {
        this.ships.push({
          position,
          ship,
          color: shipColors[getRandomNumber(0, shipColors.length - 1)],
          room: new Room(
            position.x,
            position.y,
            ship[0].length + 2,
            ship.length + 2,
          ),
        })
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

  copyShipsToMap() {
    this.ships.forEach((s) => {
      this.copyShipToMap(add(s.position, { x: 1, y: 1 }), s.ship, s.color)
    })
  }

  copyShipToMap(position: Vector2, ship: string[], color: string) {
    for (let x = 0; x < ship[0].length; x++) {
      for (let y = 0; y < ship.length; y++) {
        const char = ship[y][x]
        if (char !== ' ') {
          const p = add(position, { x, y })

          this.map.tiles[p.x][p.y] = {
            ...SHIP_TILE,
            char: ship[y][x],
            fg: color,
            bg: char === 'X' ? color : null,
          }
        }
      }
    }
  }

  setTileColors() {
    for (let i = 0; i < this.map.width; i++) {
      for (let j = 0; j < this.map.height; j++) {
        const tile = this.map.tiles[i][j]
        switch (tile.name) {
          case 'Wall':
          case 'Elevator':
            tile.fg = Colors.L7WallChar
            tile.bg = Colors.L7Wall
            break
          case 'Floor':
            tile.bg = Colors.L1Floor
            break
          case 'Stairs Up':
          case 'Stairs Down':
          case 'Exit to next level':
            tile.bg = Colors.L1Floor
            tile.fg = Colors.L8Wall
            break
          case 'Door Open':
          case 'Door Closed':
            tile.fg = Colors.L7Wall
            tile.bg = Colors.L1Floor
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
    let tries = 0
    while (tries < 50) {
      tries++

      const position = {
        x: getRandomNumber(10, 90),
        y: getRandomNumber(10, 90),
      }

      if (
        this.map.isWalkable(position.x, position.y) &&
        positions.find((p) => distance(p, position) < 7) === undefined
      ) {
        positions.push(position)
      }
    }

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
    while (positions.length < 15 && tries < 50) {
      tries++
      const position = { x: getRandomNumber(0, 99), y: getRandomNumber(0, 60) }

      if (
        this.map.isWalkable(position.x, position.y) &&
        positions.find((p) => equal(position, p)) === undefined &&
        distance(playerStart, position) > 7 &&
        positions.find((p) => distance(p, position) < 7) === undefined
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
    while (positions.length < 10 && tries < 50) {
      tries++
      const position = { x: getRandomNumber(0, 99), y: getRandomNumber(0, 60) }

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
    this.map.tiles[stairs.x][stairs.y] = { ...EXIT_TO_NEXT_LEVEL }
  }

  exitLocation(): Vector2 {
    return this.exit
  }

  isValid(): boolean {
    return true
  }
}
