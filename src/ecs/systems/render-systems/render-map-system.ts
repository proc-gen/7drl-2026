import { query, type EntityId, type World } from 'bitecs'
import { type RenderSystem } from './'
import { Display } from 'rot-js'
import { Map } from '../../../map'
import type { Vector2 } from '../../../types'
import { Colors, LightTypes, DisplayValues } from '../../../constants'
import {
  AddColors,
  ConstMultiplyColor,
  MixColors,
} from '../../../utils/color-funcs'
import {
  LightComponent,
  PositionComponent,
  type Position,
} from '../../components'
import type { UpdateSystem } from '../update-systems'
import { angle, distance } from '../../../utils/vector-2-funcs'
import { processFOV, processLightFOV } from '../../../utils/fov-funcs'

export class RenderMapSystem implements RenderSystem, UpdateSystem {
  map: Map
  player: EntityId
  playerFOV: Vector2[]
  world: World

  constructor(world: World, map: Map, player: EntityId, playerFOV: Vector2[]) {
    this.world = world
    this.map = map
    this.player = player
    this.playerFOV = playerFOV
  }

  update(world: World, _entity: EntityId): void {
    for (let x = 0; x < this.map.tiles.length; x++) {
      const col = this.map.tiles[x]
      for (let y = 0; y < col.length; y++) {
        const tile = col[y]
        tile.lighting = Colors.Ambient
      }
    }

    const playerLocation = PositionComponent.values[this.player]
    const playerLightFOV = processFOV(
      this.map,
      PositionComponent.values[this.player],
      8,
    )
    playerLightFOV.forEach((p) => {
      const attenuation = this.attenuationForLocation(playerLocation, p, 3)
      this.map.tiles[p.x][p.y].lighting = AddColors(
        this.map.tiles[p.x][p.y].lighting,
        ConstMultiplyColor(Colors.MediumGrey, attenuation),
      )
    })

    for (const eid of query(world, [LightComponent])) {
      const lightLocation = PositionComponent.values[eid]
      const light = LightComponent.values[eid]
      const lightFOV = light.blockable
        ? processLightFOV(this.map, lightLocation, light.intensity * 5)
        : processFOV(this.map, lightLocation, light.intensity * 5)

      lightFOV.filter(p => p !== undefined).forEach((p) => {
        let isLit = true

        if (light.lightType === LightTypes.Spot) {
          const lightAngle = angle(lightLocation, light.target!, p)
          if (lightAngle > 0.66 || lightAngle < -0.66) {
            isLit = false
          }
        }

        if (isLit) {
          const attenuation = this.attenuationForLocation(
            lightLocation,
            p,
            light.intensity,
          )
          this.map.tiles[p.x][p.y].lighting = AddColors(
            this.map.tiles[p.x][p.y].lighting,
            ConstMultiplyColor(light.color, attenuation),
          )
        }
      })
    }
  }

  attenuationForLocation(
    lightSource: Vector2,
    location: Vector2,
    intensity: number,
  ) {
    const d = distance(lightSource, location)
    return Math.max(Math.min(intensity / d, 1.0), 0.0)
  }

  render(display: Display, playerPosition: Position) {
    const xOffset = DisplayValues.HalfWidth - playerPosition.x
    const yOffset = DisplayValues.HalfHeight - playerPosition.y
    for (let x = 0; x < this.map.tiles.length; x++) {
      const col = this.map.tiles[x]
      for (let y = 0; y < col.length; y++) {
        const tile = col[y]

        if (tile.seen) {
          const fg = tile.fg !== null ? MixColors(tile.fg, tile.lighting) : null
          const bg = tile.bg !== null ? MixColors(tile.bg, tile.lighting) : null
          display.draw(x + xOffset, y + yOffset, tile.char, fg, bg)
        }
      }
    }
  }
}
