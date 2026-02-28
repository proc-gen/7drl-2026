import type { Display } from 'rot-js'
import { Screen } from './screen'
import {
  renderSingleLineTextOver,
  renderWindowWithTitle,
} from '../utils/render-funcs'
import type { GameStats, Vector2 } from '../types'
import { add } from '../utils/vector-2-funcs'
import { Colors } from '../constants/colors'
import type { ScreenManager } from '../screen-manager'
import { MainMenuScreen } from './main-menu-screen'

export class GameOverScreen extends Screen {
  windowPosition: Vector2
  windowDimension: Vector2
  renderPosition: Vector2

  showBackToMainMenu: boolean
  gameStats: GameStats

  constructor(display: Display, manager: ScreenManager, gameStats: GameStats) {
    super(display, manager)

    this.windowPosition = { x: 13, y: 16 }
    this.windowDimension = { x: 50, y: 20 }
    this.renderPosition = { x: 14, y: 18 }

    this.showBackToMainMenu = false
    this.gameStats = gameStats

    window.setTimeout(() => {
      this.showBackToMainMenu = true
    }, 2000)
  }

  keyDown(event: KeyboardEvent) {
    if (this.showBackToMainMenu) {
      switch (event.key) {
        case 'Enter':
          this.manager.setNextScreen(
            new MainMenuScreen(this.display, this.manager),
          )
          break
      }
    }
  }

  mouseMove(_event: MouseEvent | WheelEvent) {}

  render() {
    this.display.clear()

    renderWindowWithTitle(
      this.display,
      this.windowPosition,
      this.windowDimension,
      'Game Over',
    )

    renderSingleLineTextOver(
      this.display,
      add(this.renderPosition, { x: 7, y: 2 }),
      "You've met your doom, adventurer...",
      Colors.White,
      null,
    )

    renderSingleLineTextOver(
      this.display,
      add(this.renderPosition, { x: 11, y: 6 }),
      `Enemies Killed: ${this.gameStats.enemiesKilled}`,
      Colors.White,
      null,
    )

    renderSingleLineTextOver(
      this.display,
      add(this.renderPosition, { x: 11, y: 7 }),
      `Health Potions Chugged: ${this.gameStats.healthPotionsDrank}`,
      Colors.White,
      null,
    )

    renderSingleLineTextOver(
      this.display,
      add(this.renderPosition, { x: 11, y: 8 }),
      `Steps Walked: ${this.gameStats.stepsWalked}`,
      Colors.White,
      null,
    )

    renderSingleLineTextOver(
      this.display,
      add(this.renderPosition, { x: 11, y: 9 }),
      `Stairs Descended: ${this.gameStats.stairsDescended}`,
      Colors.White,
      null,
    )

    renderSingleLineTextOver(
      this.display,
      add(this.renderPosition, { x: 7, y: 11 }),
      `Adventure ended by a ${this.gameStats.killedBy}`,
      Colors.White,
      null,
    )

    if (this.showBackToMainMenu) {
      renderSingleLineTextOver(
        this.display,
        add(this.renderPosition, { x: 12, y: 15 }),
        '-> Back to Main Menu',
        Colors.White,
        null,
      )
    }
  }
}
