import { hasComponent, query, type EntityId, type World } from 'bitecs'
import type { GameStats, HandleInputInfo, Vector2 } from '../types'
import type { Display } from 'rot-js'
import {
  renderSingleLineTextOver,
  renderWindowWithTitle,
} from '../utils/render-funcs'
import type { InputController } from '../interfaces/input-controller'
import type { RenderWindow } from '.'
import {
  ActionComponent,
  AmmunitionComponent,
  EquipmentComponent,
  EquippableComponent,
  InfoComponent,
  ItemComponent,
  OwnerComponent,
  PlayerComponent,
  StatsComponent,
  TargetingComponent,
} from '../ecs/components'
import { ItemActionTypes, Colors, type ItemActionType } from '../constants'

export class InventoryWindow implements InputController, RenderWindow {
  active: boolean
  windowPosition: Vector2
  windowDimension: Vector2
  renderPosition: Vector2
  renderPositionRight: Vector2

  world: World
  player: EntityId
  playerItems: EntityId[]
  itemIndex: number

  gameStats: GameStats

  constructor(world: World, player: EntityId, gameStats: GameStats) {
    this.active = false
    this.windowPosition = { x: 15, y: 10 }
    this.windowDimension = { x: 50, y: 30 }
    this.renderPosition = { x: 18, y: 12 }
    this.renderPositionRight = { x: 40, y: 12 }

    this.world = world
    this.player = player
    this.playerItems = []
    this.itemIndex = 0
    this.gameStats = gameStats
  }

  getActive(): boolean {
    return this.active
  }

  setActive(value: boolean): void {
    this.active = value
    if (this.active) {
      this.playerItems.length = 0
      for (const eid of query(this.world, [OwnerComponent, ItemComponent])) {
        if (OwnerComponent.values[eid].owner === this.player) {
          if (
            !hasComponent(this.world, eid, EquippableComponent) ||
            !EquippableComponent.values[eid].equipped
          )
            this.playerItems.push(eid)
        }
      }
      this.itemIndex = 0
    }
  }

  handleKeyboardInput(event: KeyboardEvent): HandleInputInfo {
    const inputInfo = { needUpdate: false }
    switch (event.key) {
      case 'ArrowUp':
        this.itemIndex = Math.floor(Math.max(0, this.itemIndex - 1))
        break
      case 'ArrowDown':
        this.itemIndex = Math.floor(
          Math.min(this.playerItems.length - 1, this.itemIndex + 1),
        )
        break
      case 'Enter':
        this.useItem(inputInfo)
        break
      case 'd':
        this.setPlayerAction(
          this.playerItems[this.itemIndex],
          ItemActionTypes.Drop as ItemActionType,
        )
        this.active = false
        inputInfo.needUpdate = true
        break
      case 'Escape':
        this.active = false
        break
    }

    return inputInfo
  }

  useItem(inputInfo: HandleInputInfo) {
    const entity = this.playerItems[this.itemIndex]
    if (!hasComponent(this.world, entity, AmmunitionComponent)) {
      if (
        hasComponent(this.world, entity, TargetingComponent) &&
        !hasComponent(this.world, entity, EquippableComponent)
      ) {
        inputInfo.needTargeting = entity
      } else {
        this.setPlayerAction(entity, ItemActionTypes.Use as ItemActionType)
        this.active = false
        inputInfo.needUpdate = true
      }
    }
  }

  handleMouseInput(_event: MouseEvent, _position: Vector2): HandleInputInfo {
    return { needUpdate: false }
  }

  render(display: Display) {
    renderWindowWithTitle(
      display,
      this.windowPosition,
      this.windowDimension,
      'Character',
    )

    this.renderInventoryItems(display)
    this.renderStats(display)
  }

  renderInventoryItems(display: Display) {
    let renderPos = { ...this.renderPosition }
    renderSingleLineTextOver(
      display,
      renderPos,
      'Inventory',
      Colors.White,
      null,
    )
    renderPos.y += 2

    if (this.playerItems.length > 0) {
      let i = 0

      while (i < 15 && i < this.playerItems.length) {
        const itemInfo = InfoComponent.values[this.playerItems[i]]
        let additionalInfo = ''
        if (
          hasComponent(this.world, this.playerItems[i], AmmunitionComponent)
        ) {
          additionalInfo = `(${AmmunitionComponent.values[this.playerItems[i]].projectileCount})`
        }
        const message = `${i === this.itemIndex ? `-> ` : `   `}${itemInfo.name}${additionalInfo}`
        renderSingleLineTextOver(
          display,
          renderPos,
          message,
          Colors.White,
          null,
        )

        i++
        renderPos.y++
      }
    } else {
      renderSingleLineTextOver(
        display,
        renderPos,
        'No items',
        Colors.White,
        null,
      )
    }
  }

  renderStats(display: Display) {
    let renderPos = { ...this.renderPositionRight }
    renderSingleLineTextOver(display, renderPos, 'Stats', Colors.White, null)
    renderPos.y += 2

    const playerStats = PlayerComponent.values[this.player]
    const stats = StatsComponent.values[this.player]
    const equipment = EquipmentComponent.values[this.player]

    renderSingleLineTextOver(
      display,
      renderPos,
      `Level: ${playerStats.currentLevel}`,
      Colors.White,
      null,
    )
    renderPos.y++

    renderSingleLineTextOver(
      display,
      renderPos,
      `Current XP: ${playerStats.currentXp}`,
      Colors.White,
      null,
    )
    renderPos.y++

    renderSingleLineTextOver(
      display,
      renderPos,
      `XP for next level: ${playerStats.experienceToNextLevel}`,
      Colors.White,
      null,
    )
    renderPos.y += 2

    renderSingleLineTextOver(
      display,
      renderPos,
      `Strength: ${stats.currentStrength} (base: ${stats.strength})`,
      Colors.White,
      null,
    )
    renderPos.y++

    renderSingleLineTextOver(
      display,
      renderPos,
      `Defense: ${stats.currentDefense} (base: ${stats.defense})`,
      Colors.White,
      null,
    )
    renderPos.y += 2

    renderSingleLineTextOver(
      display,
      renderPos,
      `Armor: ${equipment.armor !== -1 ? InfoComponent.values[equipment.armor].name : ''}`,
      Colors.White,
      null,
    )
    renderPos.y++

    renderSingleLineTextOver(
      display,
      renderPos,
      `Weapon: ${equipment.weapon !== -1 ? InfoComponent.values[equipment.weapon].name : ''}`,
      Colors.White,
      null,
    )
    renderPos.y += 2

    renderSingleLineTextOver(
      display,
      renderPos,
      `Enemies Killed: ${this.gameStats.enemiesKilled}`,
      Colors.White,
      null,
    )
    renderPos.y++

    renderSingleLineTextOver(
      display,
      renderPos,
      `Potions Chugged: ${this.gameStats.healthPotionsDrank}`,
      Colors.White,
      null,
    )
    renderPos.y++

    renderSingleLineTextOver(
      display,
      renderPos,
      `Steps Walked: ${this.gameStats.stepsWalked}`,
      Colors.White,
      null,
    )
    renderPos.y++
  }

  setPlayerAction(
    useItem: EntityId | undefined = undefined,
    itemActionType: ItemActionType,
  ) {
    const action = ActionComponent.values[this.player]
    action.xOffset = 0
    action.yOffset = 0
    action.pickUpItem = false
    action.useItem = useItem
    action.itemActionType = itemActionType
    action.processed = false
  }
}
