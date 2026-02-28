import { entityExists, hasComponent, type EntityId, type World } from 'bitecs'
import type { RenderWindow } from './render-window'
import type { Map } from '../map'
import type { InputController } from '../interfaces/input-controller'
import type { HandleInputInfo, Vector2 } from '../types'
import type { Display } from 'rot-js'
import {
  renderSingleLineTextOver,
  renderWindowWithTitle,
} from '../utils/render-funcs'
import {
  ActionComponent,
  HealthComponent,
  InfoComponent,
  PositionComponent,
  RangedWeaponComponent,
  SpellComponent,
  TargetingComponent,
} from '../ecs/components'
import {
  Colors,
  TargetingTypes,
  ItemActionTypes,
  type ItemActionType,
  DisplayValues,
} from '../constants'
import { add, equal, ZeroVector } from '../utils/vector-2-funcs'
import { processFOV } from '../utils/fov-funcs'
import type { MessageLog } from '../utils/message-log'
import { MixColors } from '../utils/color-funcs'

export class TargetingWindow implements InputController, RenderWindow {
  active: boolean
  windowPosition: Vector2
  windowDimension: Vector2
  renderPositionLine1: Vector2
  renderPositionLine2: Vector2

  world: World
  log: MessageLog
  map: Map
  player: EntityId
  playerFOV: Vector2[]
  targetingEntity: EntityId
  targetPosition: Vector2
  targetRange: number
  targetRadius: number
  targetFOV: Vector2[]
  targetingType: string
  splashFOV: Vector2[]

  constructor(
    world: World,
    log: MessageLog,
    map: Map,
    player: EntityId,
    playerFOV: Vector2[],
  ) {
    this.active = false
    this.windowPosition = { x: 20, y: 0 }
    this.windowDimension = { x: 40, y: 4 }
    this.renderPositionLine1 = { x: 23, y: 1 }
    this.renderPositionLine2 = { x: 23, y: 2 }

    this.world = world
    this.log = log
    this.map = map
    this.player = player
    this.playerFOV = playerFOV
    this.targetingEntity = -1
    this.targetPosition = { ...ZeroVector }
    this.targetRange = -1
    this.targetRadius = 0
    this.targetFOV = []
    this.targetingType = ''
    this.splashFOV = []
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

      this.targetPosition = { ...offsetLocation }
    }
  }

  setTargetingEntity(targetingEntity: EntityId) {
    if (entityExists(this.world, targetingEntity)) {
      this.targetingEntity = targetingEntity
      this.targetPosition = { ...PositionComponent.values[this.player] }
      this.targetingType =
        TargetingComponent.values[this.targetingEntity].targetingType
      if (hasComponent(this.world, this.targetingEntity, SpellComponent)) {
        this.targetRange = SpellComponent.values[this.targetingEntity].range
        this.targetRadius =
          SpellComponent.values[this.targetingEntity].radius ?? 0
      } else if (
        hasComponent(this.world, this.targetingEntity, RangedWeaponComponent)
      ) {
        const rangedWeapon = RangedWeaponComponent.values[this.targetingEntity]
        this.targetRange = rangedWeapon.range
        this.targetRadius = 0

        if (rangedWeapon.currentAmmunition === 0) {
          this.log.addMessage('You need to reload your weapon before attacking')
          this.setActive(false)
        }
      }

      this.targetFOV = processFOV(
        this.map,
        PositionComponent.values[this.player],
        this.targetRange,
      )
      this.updateSplashFOV()
    } else {
      this.log.addMessage(
        'You need to equip a ranged weapon for a ranged attack',
      )
      this.setActive(false)
    }
  }

  handleKeyboardInput(event: KeyboardEvent): HandleInputInfo {
    const inputInfo = { needUpdate: false }
    switch (event.key) {
      case 'ArrowUp':
        this.setTargetPosition(0, -1)
        break
      case 'ArrowDown':
        this.setTargetPosition(0, 1)
        break
      case 'ArrowLeft':
        this.setTargetPosition(-1, 0)
        break
      case 'ArrowRight':
        this.setTargetPosition(1, 0)
        break
      case 'Enter':
        this.useItem(inputInfo)
        break
      case 'Escape':
        this.active = false
        break
    }
    return inputInfo
  }

  setTargetPosition(xOffset: number, yOffset: number) {
    if (
      this.map.isInBounds(
        this.targetPosition.x + xOffset,
        this.targetPosition.y + yOffset,
      )
    ) {
      this.targetPosition.x += xOffset
      this.targetPosition.y += yOffset
      this.updateSplashFOV()
    }
  }

  useItem(inputInfo: HandleInputInfo) {
    const targetAllowed = this.isTargetAllowable()
    const itemUsable = this.isItemUsable()

    if (targetAllowed && itemUsable) {
      TargetingComponent.values[this.targetingEntity].position =
        this.targetPosition
      const action = ActionComponent.values[this.player]
      action.xOffset = 0
      action.yOffset = 0
      action.pickUpItem = false
      action.useItem = this.targetingEntity
      action.itemActionType = ItemActionTypes.Attack as ItemActionType
      action.processed = false
      inputInfo.needUpdate = true
    }

    if (!itemUsable) {
      this.log.addMessage('Weapon is not loaded')
      this.setActive(false)
    } else if (!targetAllowed) {
      this.log.addMessage('Invalid target selected')
    }
  }

  handleMouseInput(_event: MouseEvent, position: Vector2): HandleInputInfo {
    const inputInfo = { needUpdate: false }
    if (
      this.map.isInBounds(position.x, position.y) &&
      (this.targetPosition.x !== position.x ||
        this.targetPosition.y !== position.y)
    ) {
      this.targetPosition = { ...position }
      this.updateSplashFOV()
    }

    return inputInfo
  }

  updateSplashFOV() {
    if (this.targetRadius > 0) {
      this.splashFOV = processFOV(
        this.map,
        this.targetPosition,
        this.targetRadius,
      )

      this.splashFOV = this.splashFOV.filter(
        (a) => this.map.isWalkable(a.x, a.y) && this.map.tiles[a.x][a.y].seen,
      )
    }
  }

  isTargetInRange() {
    return (
      this.targetFOV.find((a) => equal(a, this.targetPosition)) !== undefined
    )
  }

  isItemUsable() {
    let usable = true
    if (hasComponent(this.world, this.targetingEntity, RangedWeaponComponent)) {
      usable =
        RangedWeaponComponent.values[this.targetingEntity].currentAmmunition > 0
    }
    return usable
  }

  isTargetAllowable() {
    let allowable = false

    if (this.isTargetInRange()) {
      if (this.targetingType === TargetingTypes.SingleTargetPosition) {
        allowable = true
      } else if (this.targetingType === TargetingTypes.SingleTargetEntity) {
        const entitiesAtLocation = this.map.getEntitiesAtLocation(
          this.targetPosition,
        )

        if (
          entitiesAtLocation.find(
            (a) =>
              a !== this.player && hasComponent(this.world, a, HealthComponent),
          ) !== undefined
        ) {
          allowable = true
        }
      }
    }

    return allowable
  }

  render(display: Display) {
    this.renderWindow(display)
    this.renderTarget(display)
  }

  renderWindow(display: Display) {
    renderWindowWithTitle(
      display,
      this.windowPosition,
      this.windowDimension,
      'Targeting',
    )

    const itemInfo = InfoComponent.values[this.targetingEntity]
    renderSingleLineTextOver(
      display,
      this.renderPositionLine1,
      `Using ${itemInfo.name}`,
      Colors.White,
      null,
    )

    let description = 'Nothing'
    if (this.isTargetInRange()) {
      const entitiesAtLocation = this.map.getEntitiesAtLocation(
        this.targetPosition,
      )

      const healthBlocker = entitiesAtLocation.find((a) =>
        hasComponent(this.world, a, HealthComponent),
      )
      if (healthBlocker !== undefined) {
        description = InfoComponent.values[healthBlocker].name
      }
    } else {
      description = 'Out of Range'
    }

    renderSingleLineTextOver(
      display,
      this.renderPositionLine2,
      `(${this.targetPosition.x}, ${this.targetPosition.y}) - ${description}`,
      Colors.White,
      null,
    )
  }

  renderTarget(display: Display) {
    let color = Colors.ErrorLocation
    if (this.isTargetInRange()) {
      color = Colors.WarningLocation
      if (this.isTargetAllowable()) {
        color = Colors.InspectLocation
      }
    }

    const playerPosition = { ...PositionComponent.values[this.player] }
    const xOffset = DisplayValues.HalfWidth - playerPosition.x
    const yOffset = DisplayValues.HalfHeight - playerPosition.y

    const offsetLocation = add(this.targetPosition, {
      x: xOffset,
      y: yOffset,
    })

    if (this.splashFOV.length > 0) {
      const splashColor = MixColors(color, Colors.Ambient)
      this.splashFOV.forEach((p) => {
        const newP = add(p, {
          x: xOffset,
          y: yOffset,
        })
        display.drawOver(newP.x, newP.y, '', null, splashColor)
      })
    }

    display.drawOver(offsetLocation.x, offsetLocation.y, '', null, color)
  }
}
