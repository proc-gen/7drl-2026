import { entityExists, hasComponent, type EntityId, type World } from 'bitecs'
import type { RenderSystem } from './render-system'
import type { Display } from 'rot-js'
import {
  EquipmentComponent,
  SuitStatsComponent,
  InfoComponent,
  PositionComponent,
  RangedWeaponComponent,
  type Position,
  AmmunitionComponent,
} from '../../components'
import {
  renderBox,
  renderHorizontalColoredBar,
  renderMultipleTextLinesOver,
  renderSingleLineTextOver,
} from '../../../utils/render-funcs'
import { Colors } from '../../../constants/colors'
import type { MessageLog } from '../../../utils/message-log'
import type { InputController } from '../../../interfaces/input-controller'
import type { HandleInputInfo, Vector2 } from '../../../types'
import type { Map } from '../../../map'
import { add, equal } from '../../../utils/vector-2-funcs'
import { DisplayValues } from '../../../constants/display-values'
import type { SuitStats } from '../../components/suit-stats'
import { AmmunitionTypes } from '../../../constants'

export class RenderHudSystem implements RenderSystem, InputController {
  world: World
  map: Map
  player: EntityId
  playerFOV: Vector2[]
  log: MessageLog
  active: boolean
  inspectLocation: Vector2

  constructor(
    world: World,
    map: Map,
    player: EntityId,
    log: MessageLog,
    playerFOV: Vector2[],
  ) {
    this.world = world
    this.map = map
    this.player = player
    this.playerFOV = playerFOV
    this.log = log
    this.active = false
    this.inspectLocation = { x: 0, y: 0 }
  }

  getActive(): boolean {
    return this.active
  }

  setActive(value: boolean): void {
    this.active = value
    if (this.active) {
      const playerPosition = { ...PositionComponent.values[this.player] }
      const xOffset = DisplayValues.HalfWidth - playerPosition.x
      const yOffset = DisplayValues.HalfHeight - playerPosition.y

      const offsetLocation = add(playerPosition, {
        x: xOffset,
        y: yOffset,
      })

      this.inspectLocation = { ...offsetLocation }
    }
  }

  handleKeyboardInput(event: KeyboardEvent): HandleInputInfo {
    const inputInfo = { needUpdate: false }
    if (this.active) {
      switch (event.key) {
        case 'ArrowUp':
        case 'w':
          this.setInspectLocation(0, -1)
          break
        case 'ArrowDown':
        case 's':
          this.setInspectLocation(0, 1)
          break
        case 'ArrowLeft':
        case 'a':
          this.setInspectLocation(-1, 0)
          break
        case 'ArrowRight':
        case 'd':
          this.setInspectLocation(1, 0)
          break
        case 'Escape':
        case 'Delete':
          this.active = false
          break
      }
    }

    return inputInfo
  }

  setInspectLocation(xOffset: number, yOffset: number) {
    if (
      this.map.isInBounds(
        this.inspectLocation.x + xOffset,
        this.inspectLocation.y + yOffset,
      )
    ) {
      this.inspectLocation.x += xOffset
      this.inspectLocation.y += yOffset
    }
  }

  handleMouseInput(_event: MouseEvent, position: Vector2): HandleInputInfo {
    const inputInfo = { needUpdate: false }
    if (this.active) {
      if (
        this.map.isInBounds(position.x, position.y) &&
        (this.inspectLocation.x !== position.x ||
          this.inspectLocation.y !== position.y)
      ) {
        this.inspectLocation.x = position.x
        this.inspectLocation.y = position.y
      }
    }

    return inputInfo
  }

  render(display: Display, playerPosition: Position) {
    renderBox(
      display,
      { x: 0, y: 42 },
      { x: 80, y: 8 },
      Colors.VeryDarkGrey,
      Colors.VeryDarkGrey,
    )

    this.renderStats(display)

    if (this.active) {
      this.renderInspection(display, playerPosition)
    } else {
      this.renderMessageLog(display)
    }
  }

  renderStats(display: Display) {
    const suitStats = SuitStatsComponent.values[this.player]
    this.renderShieldBar(display, suitStats)
    this.renderEnergyBar(display, suitStats)

    renderSingleLineTextOver(
      display,
      { x: 1, y: 0 },
      `Level: ${this.map.level}`,
      Colors.White,
      Colors.VeryDarkGrey,
    )

    this.renderWeaponsInfo(display, suitStats)
    this.renderOtherAmmoInfo(display, suitStats)
  }

  renderShieldBar(display: Display, suitStats: SuitStats) {
    const barLocation = { x: 0, y: 42 }
    const totalWidth = 20
    const barWidth = Math.floor(
      (suitStats.currentShield / suitStats.maxShield) * totalWidth,
    )

    renderHorizontalColoredBar(
      display,
      barLocation,
      totalWidth,
      Colors.DarkGrey,
    )
    renderHorizontalColoredBar(display, barLocation, barWidth, Colors.ShieldBar)

    const text = `Shield: ${suitStats.currentShield} / ${suitStats.maxShield}`

    renderSingleLineTextOver(display, { x: 1, y: 42 }, text, Colors.White, null)
  }

  renderEnergyBar(display: Display, suitStats: SuitStats) {
    const barLocation = { x: 0, y: 43 }
    const totalWidth = 20
    const barWidth = Math.floor(
      (suitStats.currentEnergy / suitStats.maxEnergy) * totalWidth,
    )

    renderHorizontalColoredBar(
      display,
      barLocation,
      totalWidth,
      Colors.DarkGrey,
    )
    renderHorizontalColoredBar(display, barLocation, barWidth, Colors.EnergyBar)

    const text = `Energy: ${suitStats.currentEnergy} / ${suitStats.maxEnergy}`

    renderSingleLineTextOver(display, { x: 1, y: 43 }, text, Colors.White, null)
  }

  renderWeaponsInfo(display: Display, suitStats: SuitStats) {
    const equipment = EquipmentComponent.values[this.player]
    this.renderWeaponInfo(display, equipment.rangedWeapon, 1, suitStats)
    this.renderWeaponInfo(
      display,
      equipment.secondaryRangedWeapon,
      2,
      suitStats,
    )
    this.renderWeaponInfo(display, equipment.meleeWeapon, 3, suitStats)
  }

  renderWeaponInfo(
    display: Display,
    weapon: EntityId,
    index: number,
    suitStats: SuitStats,
  ) {
    let weaponName = ''
    if (entityExists(this.world, weapon)) {
      const weaponInfo = InfoComponent.values[weapon]
      weaponName = weaponInfo.name
      if (hasComponent(this.world, weapon, RangedWeaponComponent)) {
        const rangedWeapon = RangedWeaponComponent.values[weapon]
        const at = rangedWeapon.ammunitionType
        switch (at) {
          case AmmunitionTypes.Energy:
          case AmmunitionTypes.Rockets:
            weaponName += ` (${rangedWeapon.currentAmmunition}/${rangedWeapon.maxAmmunition})`
            break
          case AmmunitionTypes.Discs:
            weaponName += ` (${suitStats.currentDiscs}/${suitStats.maxDiscs})`
            break
          case AmmunitionTypes.Grenades:
            weaponName += ` (${suitStats.currentGrenades}/${suitStats.maxGrenades})`
            break
        }
      }

      renderSingleLineTextOver(
        display,
        { x: 1, y: 43 + index },
        `${index === 3 ? 'M' : index}: ${weaponName}`,
        Colors.White,
        null,
      )
    }
  }

  renderOtherAmmoInfo(display: Display, suitStats: SuitStats) {
    renderSingleLineTextOver(
      display,
      { x: 1, y: 47 },
      `Ex. Discs: (${suitStats.currentDiscs}/${suitStats.maxDiscs})`,
      Colors.White,
      null,
    )
    renderSingleLineTextOver(
      display,
      { x: 1, y: 48 },
      `F. Grenades: (${suitStats.currentGrenades}/${suitStats.maxGrenades})`,
      Colors.White,
      null,
    )
    renderSingleLineTextOver(
      display,
      { x: 1, y: 49 },
      `Rockets: (${suitStats.currentRockets}/${suitStats.maxRockets})`,
      Colors.White,
      null,
    )
  }

  renderMessageLog(display: Display) {
    if (this.log.messages.length > 0) {
      let i = 0
      let lines = 0
      while (lines < 8 && i < this.log.messages.length) {
        i++
        const message = this.log.messages[this.log.messages.length - i]
        if (message !== undefined) {
          const text = `- ${message.text}`
          renderMultipleTextLinesOver(
            display,
            { x: 30, y: 42 + lines },
            text,
            50,
          )

          lines += Math.ceil(text.length / 50)
        }
      }
    }
  }

  renderInspection(display: Display, playerPosition: Vector2) {
    const xOffset = DisplayValues.HalfWidth - playerPosition.x
    const yOffset = DisplayValues.HalfHeight - playerPosition.y

    const offsetLocation = add(this.inspectLocation, {
      x: -xOffset,
      y: -yOffset,
    })

    display.drawOver(
      this.inspectLocation.x,
      this.inspectLocation.y,
      '',
      null,
      Colors.InspectLocation,
    )
    const atLocation = [`Inspecting (${offsetLocation.x}, ${offsetLocation.y})`]

    if (
      this.map.isInBounds(offsetLocation.x, offsetLocation.y) &&
      this.map.tiles[offsetLocation.x][offsetLocation.y].seen
    ) {
      atLocation.push(this.map.tiles[offsetLocation.x][offsetLocation.y].name)

      if (this.playerFOV.find((a) => equal(a, offsetLocation)) !== undefined) {
        const entitiesAtLocation =
          this.map.getEntitiesAtLocation(offsetLocation)
        if (entitiesAtLocation.length > 0) {
          entitiesAtLocation.forEach((entity) => {
            if (hasComponent(this.world, entity, InfoComponent)) {
              const info = InfoComponent.values[entity]
              atLocation.push(info.name)
            }
          })
        }
      }
    } else {
      atLocation.push('Unknown')
    }

    for (let i = 0; i < atLocation.length; i++)
      renderSingleLineTextOver(
        display,
        { x: 21, y: 42 + i },
        atLocation[i],
        Colors.White,
        null,
      )
  }
}
