import type { World, EntityId } from 'bitecs'
import type { InputController } from '../interfaces/input-controller'
import type { HandleInputInfo, Vector2 } from '../types'
import type { RenderWindow } from './render-window'
import type { MessageLog } from '../utils/message-log'
import {
  ArmorComponent,
  EquipmentComponent,
  HealthComponent,
  PlayerComponent,
  StatsComponent,
  WeaponComponent,
} from '../ecs/components'
import {
  renderSingleLineTextOver,
  renderWindowWithTitle,
} from '../utils/render-funcs'
import type { Display } from 'rot-js'
import { add } from '../utils/vector-2-funcs'
import { Colors, AttackTypes } from '../constants'

export class LevelUpWindow implements InputController, RenderWindow {
  active: boolean
  windowPosition: Vector2
  windowDimension: Vector2
  renderPosition: Vector2

  world: World
  log: MessageLog
  player: EntityId
  selectedOption: number

  constructor(world: World, log: MessageLog, player: EntityId) {
    this.active = false
    this.windowPosition = { x: 14, y: 10 }
    this.windowDimension = { x: 52, y: 10 }
    this.renderPosition = { x: 17, y: 12 }

    this.world = world
    this.log = log
    this.player = player
    this.selectedOption = 0
  }

  getActive(): boolean {
    return this.active
  }

  setActive(value: boolean): void {
    this.active = value
    if (this.active) {
      this.selectedOption = 0
      const playerStats = PlayerComponent.values[this.player]
      playerStats.levelUpBase +=
        playerStats.currentLevel * playerStats.levelUpFactor
      playerStats.currentLevel++
      playerStats.experienceToNextLevel +=
        playerStats.currentLevel * playerStats.levelUpFactor

      this.log.addMessage(
        `You have advanced to level ${playerStats.currentLevel}`,
      )
    }
  }

  handleKeyboardInput(event: KeyboardEvent): HandleInputInfo {
    const inputInfo: HandleInputInfo = { needUpdate: false }
    switch (event.key) {
      case 'ArrowUp':
        this.selectedOption = Math.floor(Math.max(0, this.selectedOption - 1))
        break
      case 'ArrowDown':
        this.selectedOption = Math.floor(Math.min(3, this.selectedOption + 1))
        break
      case 'Enter':
        this.processLevelUp()
        inputInfo.finishTurn = true
        inputInfo.needUpdate = true
        break
    }
    return inputInfo
  }

  processLevelUp() {
    const stats = StatsComponent.values[this.player]
    const playerHealth = HealthComponent.values[this.player]

    switch (this.selectedOption) {
      case 0:
        playerHealth.current += 20
        playerHealth.max += 20
        this.log.addMessage('Your health improves!')
        break
      case 1:
        stats.strength++
        this.log.addMessage('You feel stronger!')
        break
      case 2:
        stats.defense++
        this.log.addMessage('Your movements become swifter!')
        break
      case 3:
        stats.rangedPower++
        this.log.addMessage('Your ranged attacks hit more accurately!')
        break
    }

    const equipment = EquipmentComponent.values[this.player]

    const weaponMod =
      equipment.weapon !== -1 &&
      WeaponComponent.values[equipment.weapon].attackType === AttackTypes.Melee
        ? WeaponComponent.values[equipment.weapon].attack
        : 0
    const rangedWeaponMod =
      equipment.weapon !== -1 &&
      WeaponComponent.values[equipment.weapon].attackType === AttackTypes.Ranged
        ? WeaponComponent.values[equipment.weapon].attack
        : 0
    const armorMod =
      equipment.armor !== -1
        ? ArmorComponent.values[equipment.armor].defense
        : 0
    stats.currentDefense = stats.defense + armorMod
    stats.currentStrength = stats.strength + weaponMod
    stats.currentRangedPower = stats.rangedPower + rangedWeaponMod
  }

  handleMouseInput(_event: MouseEvent, _position: Vector2): HandleInputInfo {
    return { needUpdate: false }
  }

  render(display: Display) {
    renderWindowWithTitle(
      display,
      this.windowPosition,
      this.windowDimension,
      'Level Up',
    )

    renderSingleLineTextOver(
      display,
      add(this.renderPosition, { x: 0, y: 0 }),
      'Congratulations, you leveled up!',
      Colors.White,
      null,
    )

    renderSingleLineTextOver(
      display,
      add(this.renderPosition, { x: 0, y: 1 }),
      'Select an attribute to increase:',
      Colors.White,
      null,
    )

    renderSingleLineTextOver(
      display,
      add(this.renderPosition, { x: 0, y: 3 }),
      `${this.selectedOption === 0 ? '->' : '  '} Increase Health (+20 HP)`,
      Colors.White,
      null,
    )

    renderSingleLineTextOver(
      display,
      add(this.renderPosition, { x: 0, y: 4 }),
      `${this.selectedOption === 1 ? '->' : '  '} Increase Strength (+1 damage for melee)`,
      Colors.White,
      null,
    )

    renderSingleLineTextOver(
      display,
      add(this.renderPosition, { x: 0, y: 5 }),
      `${this.selectedOption === 2 ? '->' : '  '} Increase Defense (+1 defense)`,
      Colors.White,
      null,
    )

    renderSingleLineTextOver(
      display,
      add(this.renderPosition, { x: 0, y: 6 }),
      `${this.selectedOption === 3 ? '->' : '  '} Increase Ranged Power (+1 damage for ranged)`,
      Colors.White,
      null,
    )
  }
}
