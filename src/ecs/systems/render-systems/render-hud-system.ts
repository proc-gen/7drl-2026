import { entityExists, hasComponent, type EntityId, type World } from 'bitecs'
import type { RenderSystem } from './render-system'
import type { Display } from 'rot-js'
import {
  EquipmentComponent,
  HealthComponent,
  InfoComponent,
  PlayerComponent,
  PositionComponent,
  RangedWeaponComponent,
  type Position,
} from '../../components'
import {
  renderBox,
  renderHorizontalColoredBar,
  renderSingleLineTextOver,
} from '../../../utils/render-funcs'
import { Colors } from '../../../constants/colors'
import type { MessageLog } from '../../../utils/message-log'
import type { InputController } from '../../../interfaces/input-controller'
import type { HandleInputInfo, Vector2 } from '../../../types'
import type { Map } from '../../../map'
import { add, equal } from '../../../utils/vector-2-funcs'
import { DisplayValues } from '../../../constants/display-values'

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
      { x: 0, y: 45 },
      { x: 80, y: 5 },
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
    this.renderHealthBar(display)
    this.renderExperienceBar(display)

    renderSingleLineTextOver(
      display,
      { x: 1, y: 47 },
      `Depth: ${this.map.level}`,
      Colors.White,
      null,
    )

    this.renderWeaponInfo(display)
  }

  renderHealthBar(display: Display) {
    const health = HealthComponent.values[this.player]
    const barLocation = { x: 0, y: 45 }
    const totalWidth = 20
    const barWidth = Math.floor((health.current / health.max) * totalWidth)

    renderHorizontalColoredBar(
      display,
      barLocation,
      totalWidth,
      Colors.DarkGrey,
    )
    renderHorizontalColoredBar(display, barLocation, barWidth, Colors.HealthBar)

    const text = `HP: ${health.current} / ${health.max}`

    renderSingleLineTextOver(display, { x: 1, y: 45 }, text, Colors.White, null)
  }

  renderExperienceBar(display: Display) {
    const stats = PlayerComponent.values[this.player]
    const barLocation = { x: 0, y: 46 }
    const totalWidth = 20
    const barWidth = Math.min(
      totalWidth,
      Math.floor(
        ((stats.currentXp - stats.levelUpBase) /
          (stats.experienceToNextLevel - stats.levelUpBase)) *
          totalWidth,
      ),
    )

    renderHorizontalColoredBar(
      display,
      barLocation,
      totalWidth,
      Colors.DarkGrey,
    )
    renderHorizontalColoredBar(
      display,
      barLocation,
      barWidth,
      Colors.ExperienceBar,
    )

    const text = `Level: ${stats.currentLevel}`

    renderSingleLineTextOver(display, { x: 1, y: 46 }, text, Colors.White, null)
  }

  renderWeaponInfo(display: Display) {
    let weaponName = 'Fist'
    const equipment = EquipmentComponent.values[this.player]
    if (entityExists(this.world, equipment.weapon)) {
      const weaponInfo = InfoComponent.values[equipment.weapon]
      weaponName = weaponInfo.name
      if (hasComponent(this.world, equipment.weapon, RangedWeaponComponent)) {
        const rangedWeapon = RangedWeaponComponent.values[equipment.weapon]
        weaponName += ` (${rangedWeapon.currentAmmunition}/${rangedWeapon.maxAmmunition})`
      }
    }

    renderSingleLineTextOver(
      display,
      { x: 1, y: 48 },
      `Weapon: ${weaponName}`,
      Colors.White,
      null,
    )
  }

  renderMessageLog(display: Display) {
    if (this.log.messages.length > 0) {
      let i = 0
      while (i < 5 && i < this.log.messages.length) {
        i++
        const message = this.log.messages[this.log.messages.length - i]
        renderSingleLineTextOver(
          display,
          { x: 21, y: 44 + i },
          message.text,
          message.fg,
          message.bg,
        )
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
        { x: 21, y: 45 + i },
        atLocation[i],
        Colors.White,
        null,
      )
  }
}
