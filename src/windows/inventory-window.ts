import { hasComponent, query, type EntityId, type World } from 'bitecs'
import type { GameStats, HandleInputInfo, Vector2 } from '../types'
import { type Display } from 'rot-js'
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
  StatsComponent,
  SuitStatsComponent,
  TargetingComponent,
  WeaponComponent,
} from '../ecs/components'
import {
  ItemActionTypes,
  Colors,
  type ItemActionType,
  AttackTypes,
  isRanged,
  WeaponClasses,
  type WeaponClass,
} from '../constants'
import { getWeaponClassStatsForWeapon } from '../utils/weapon-class-funcs'

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
    this.windowPosition = { x: 8, y: 7 }
    this.windowDimension = { x: 66, y: 36 }
    this.renderPosition = { x: 11, y: 9 }
    this.renderPositionRight = { x: 39, y: 9 }
    this.renderItemDescription = { x: 11, y: 22 }

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
              } else if (isRanged(WeaponComponent.values[eid].attackType)) {
                secondaryWeapons.push(eid)
              } else {
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
    const suitStats = SuitStatsComponent.values[this.player]
    let renderPos = { ...this.renderPosition }
    renderSingleLineTextOver(
      display,
      renderPos,
      'Inventory',
      Colors.WarningLocation,
      null,
    )
    renderPos.y++

    if (this.playerItems.length > 0) {
      let i = 0
      let grouping = -1
      let groupingChanged = false

      while (i < this.playerItems.length) {
        groupingChanged = false
        if (grouping === -1) {
          grouping++
          groupingChanged = true
        }
        if (grouping === 0) {
          if (
            !hasComponent(this.world, this.playerItems[i], WeaponComponent) ||
            WeaponComponent.values[this.playerItems[i]].attackType !==
              AttackTypes.RangedEnergy
          ) {
            grouping++
            groupingChanged = true
          }
        }
        if (grouping === 1) {
          if (
            !hasComponent(this.world, this.playerItems[i], WeaponComponent) ||
            WeaponComponent.values[this.playerItems[i]].attackType !==
              AttackTypes.RangedPhysical
          ) {
            grouping++
            groupingChanged = true
          }
        }
        if (grouping === 2) {
          if (
            !hasComponent(this.world, this.playerItems[i], WeaponComponent) ||
            WeaponComponent.values[this.playerItems[i]].attackType !==
              AttackTypes.Melee
          ) {
            grouping++
            groupingChanged = true
          }
        }

        if (groupingChanged) {
          renderPos.y++

          switch (grouping) {
            case 0:
              renderSingleLineTextOver(
                display,
                renderPos,
                'Primary Weapons',
                Colors.White,
                null,
              )
              break
            case 1:
              renderSingleLineTextOver(
                display,
                renderPos,
                'Secondary Weapons',
                Colors.White,
                null,
              )
              break
            case 2:
              renderSingleLineTextOver(
                display,
                renderPos,
                'Melee Weapons',
                Colors.White,
                null,
              )
              break
            case 3:
              renderSingleLineTextOver(
                display,
                renderPos,
                'Other Items',
                Colors.White,
                null,
              )
              break
          }
          renderPos.y++
        }
        const itemInfo = InfoComponent.values[this.playerItems[i]]

        let message = `%b{${Colors.Black}}${i === this.itemIndex ? `%c{${Colors.WarningLocation}}->\u00A0` : `\u00A0\u00A0\u00A0`}%c{${Colors.White}}${itemInfo.name}`
        if (itemInfo.name === 'Singularity Discs') {
          message += ` (${suitStats.currentDiscs}/${suitStats.maxDiscs})`
        } else if (itemInfo.name === 'Flash Grenade') {
          message += ` (${suitStats.currentGrenades}/${suitStats.maxGrenades})`
        } else if (itemInfo.name === 'Rocket Launcher') {
          message += ` (${suitStats.currentRockets}/${suitStats.maxRockets})`
        }
        renderMultipleTextLinesOver(
          display,
          renderPos,
          message,
          30
        )

        i++
        renderPos.y++
      }
    } else {
      renderPos.y++
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
    renderSingleLineTextOver(
      display,
      renderPos,
      'Stats',
      Colors.WarningLocation,
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
      `Steps Walked: ${this.gameStats.stepsWalked}`,
      Colors.White,
      null,
    )

    renderPos.y += 3

    renderSingleLineTextOver(
      display,
      renderPos,
      `Weapon Proficiencies:`,
      Colors.WarningLocation,
      null,
    )
    renderPos.y += 2

    const weaponClasses = [
      WeaponClasses.SingleTarget,
      WeaponClasses.Melee,
      WeaponClasses.Thrown,
      WeaponClasses.Explosive,
    ]
    const stats = StatsComponent.values[this.player]

    weaponClasses.forEach((weaponClass) => {
      let xp = 0
      let level = 0
      let maxXp = 0
      switch (weaponClass) {
        case WeaponClasses.SingleTarget:
          xp = stats.singleTargetXp
          maxXp = stats.singleTargetMaxXp
          level = stats.singleTargetLevel
          break
        case WeaponClasses.Melee:
          xp = stats.meleeXp
          maxXp = stats.meleeMaxXp
          level = stats.meleeLevel
          break
        case WeaponClasses.Thrown:
          xp = stats.thrownWeaponXp
          maxXp = stats.thrownWeaponMaxXp
          level = stats.thrownWeaponLevel
          break
        case WeaponClasses.Explosive:
          xp = stats.explosiveWeaponXp
          maxXp = stats.explosiveWeaponMaxXp
          level = stats.explosiveWeaponLevel
          break
      }

      renderSingleLineTextOver(
        display,
        renderPos,
        `${weaponClass} - Lv: ${level} Xp: ${xp}/${maxXp}`,
        Colors.White,
        null,
      )

      const weaponClassStats = getWeaponClassStatsForWeapon(undefined, stats, [
        weaponClass,
      ] as WeaponClass[])
      if (weaponClassStats.damageMultiplier !== 1) {
        const dmgString = (
          weaponClassStats.damageMultiplier - 1
        ).toLocaleString(undefined, { style: 'percent' })

        renderPos.y++
        renderSingleLineTextOver(
          display,
          renderPos,
          `  Damage: +${dmgString}`,
          Colors.White,
          null,
        )
      }

      if (weaponClassStats.additionalShotChance > 0) {
        const dmgString = weaponClassStats.additionalShotChance.toLocaleString(
          undefined,
          { style: 'percent' },
        )

        renderPos.y++
        renderSingleLineTextOver(
          display,
          renderPos,
          `  Extra Shot Chance: ${dmgString}`,
          Colors.White,
          null,
        )
      }

      if (weaponClassStats.energyDiscount > 0) {
        renderPos.y++
        renderSingleLineTextOver(
          display,
          renderPos,
          `  Energy Discount: ${weaponClassStats.energyDiscount}`,
          Colors.White,
          null,
        )
      }

      if (weaponClassStats.splashRadius > 0) {
        renderPos.y++
        renderSingleLineTextOver(
          display,
          renderPos,
          `  Splash Radius: +${weaponClassStats.splashRadius}`,
          Colors.White,
          null,
        )
      }

      if (weaponClassStats.knockback > 0) {
        renderPos.y++
        renderSingleLineTextOver(
          display,
          renderPos,
          `  Knockback: +${weaponClassStats.knockback}`,
          Colors.White,
          null,
        )
      }

      renderPos.y += 2
    })

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
