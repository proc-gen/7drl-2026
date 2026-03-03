import { hasComponent, query, type EntityId, type World } from 'bitecs'
import type { GameStats, HandleInputInfo, Vector2 } from '../types'
import type { Display } from 'rot-js'
import {
  renderMultipleTextLinesOver,
  renderSingleLineTextOver,
  renderWindowWithTitle,
} from '../utils/render-funcs'
import type { InputController } from '../interfaces/input-controller'
import type { RenderWindow } from '.'
import {
  ActionComponent,
  EquippableComponent,
  InfoComponent,
  ItemComponent,
  OwnerComponent,
  TargetingComponent,
  WeaponComponent,
} from '../ecs/components'
import {
  ItemActionTypes,
  Colors,
  type ItemActionType,
  AttackTypes,
  isRanged,
} from '../constants'

export class InventoryWindow implements InputController, RenderWindow {
  active: boolean
  windowPosition: Vector2
  windowDimension: Vector2
  renderPosition: Vector2
  renderPositionRight: Vector2
  renderItemDescription: Vector2

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
    this.renderItemDescription = { x: 18, y: 25 }

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
      const primaryWeapons = []
      const secondaryWeapons = []
      const meleeWeapons = []
      const otherItems = []
      for (const eid of query(this.world, [OwnerComponent, ItemComponent])) {
        if (OwnerComponent.values[eid].owner === this.player) {
          if (
            !hasComponent(this.world, eid, EquippableComponent) ||
            !EquippableComponent.values[eid].equipped
          )
            if (hasComponent(this.world, eid, WeaponComponent)) {
              if (
                WeaponComponent.values[eid].attackType ===
                AttackTypes.RangedEnergy
              ) {
                primaryWeapons.push(eid)
              } else if(isRanged(WeaponComponent.values[eid].attackType)){
                secondaryWeapons.push(eid)
              } else{
                meleeWeapons.push(eid)
              }
            } else {
              otherItems.push(eid)
            }
        }
      }
      this.playerItems = primaryWeapons
        .concat(secondaryWeapons)
        .concat(meleeWeapons)
        .concat(otherItems)
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
      case 'Escape':
        this.active = false
        break
    }

    return inputInfo
  }

  useItem(inputInfo: HandleInputInfo) {
    const entity = this.playerItems[this.itemIndex]
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

    const maxLeft = this.renderInventoryItems(display)
    const maxRight = this.renderStats(display)
    this.renderDescription(display, Math.max(maxLeft, maxRight) + 2)
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
    renderPos.y++

    if (this.playerItems.length > 0) {
      let i = 0
      let grouping = -1

      while (i < this.playerItems.length) {
        if (grouping === -1) {
          if (hasComponent(this.world, this.playerItems[i], WeaponComponent)) {
            if (
              WeaponComponent.values[this.playerItems[i]].attackType ===
              AttackTypes.RangedEnergy
            ) {
              grouping = 0
              renderPos.y++
              renderSingleLineTextOver(
                display,
                renderPos,
                'Primary Weapons',
                Colors.White,
                null,
              )
              renderPos.y++
            } else if(isRanged(WeaponComponent.values[this.playerItems[i]].attackType)){
              grouping = 1
              renderPos.y++
              renderSingleLineTextOver(
                display,
                renderPos,
                'Secondary Weapons',
                Colors.White,
                null,
              )
              renderPos.y++
            } else{
              grouping = 2
              renderPos.y++
              renderSingleLineTextOver(
                display,
                renderPos,
                'Melee Weapons',
                Colors.White,
                null,
              )
              renderPos.y++
            }
          } else {
            grouping = 3
            renderPos.y++
            renderSingleLineTextOver(
              display,
              renderPos,
              'Other Items',
              Colors.White,
              null,
            )
            renderPos.y++
          }
        } else if (grouping === 0) {
          if (hasComponent(this.world, this.playerItems[i], WeaponComponent)) {
            if (
              WeaponComponent.values[this.playerItems[i]].attackType ===
              AttackTypes.RangedPhysical
            ) {
              grouping = 1
              renderPos.y++
              renderSingleLineTextOver(
                display,
                renderPos,
                'Secondary Weapons',
                Colors.White,
                null,
              )
              renderPos.y++
            } else{
              grouping = 2
              renderPos.y++
              renderSingleLineTextOver(
                display,
                renderPos,
                'Melee Weapons',
                Colors.White,
                null,
              )
              renderPos.y++
            }
          } else {
            grouping = 3
            renderPos.y++
            renderSingleLineTextOver(
              display,
              renderPos,
              'Other Items',
              Colors.White,
              null,
            )
            renderPos.y++
          }
        } else if (grouping === 1) {
          if (hasComponent(this.world, this.playerItems[i], WeaponComponent)) {
          grouping = 2
              renderPos.y++
              renderSingleLineTextOver(
                display,
                renderPos,
                'Melee Weapons',
                Colors.White,
                null,
              )
              renderPos.y++
          }
          else {
            grouping = 3
            renderPos.y++
            renderSingleLineTextOver(
              display,
              renderPos,
              'Other Items',
              Colors.White,
              null,
            )
            renderPos.y++
          }
        } else if(grouping === 2){
          if (!hasComponent(this.world, this.playerItems[i], WeaponComponent)) {
            grouping = 3
            renderPos.y++
            renderSingleLineTextOver(
              display,
              renderPos,
              'Other Items',
              Colors.White,
              null,
            )
            renderPos.y++
          }
        }
        const itemInfo = InfoComponent.values[this.playerItems[i]]

        const message = `${i === this.itemIndex ? `-> ` : `   `}${itemInfo.name}`
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

    return renderPos.y
  }

  renderStats(display: Display) {
    let renderPos = { ...this.renderPositionRight }
    renderSingleLineTextOver(display, renderPos, 'Stats', Colors.White, null)
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
      `Steps Walked: ${this.gameStats.stepsWalked}`,
      Colors.White,
      null,
    )

    return renderPos.y
  }

  renderDescription(display: Display, renderPosY: number) {
    if (this.playerItems.length > 0) {
      const itemInfo = InfoComponent.values[this.playerItems[this.itemIndex]]
      if (itemInfo.description !== undefined) {
        renderMultipleTextLinesOver(
          display,
          { x: this.renderItemDescription.x, y: renderPosY },
          itemInfo.description,
          40,
          Colors.White,
          Colors.Black,
        )
      }
    }
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
