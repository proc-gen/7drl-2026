import type { Display } from 'rot-js'
import { Screen } from './screen'
import {
  renderSingleLineTextOver,
  renderWindowWithTitle,
} from '../utils/render-funcs'
import type { Vector2 } from '../types'
import { add } from '../utils/vector-2-funcs'
import { Colors } from '../constants/colors'
import type { ScreenManager } from '../screen-manager'
import { GameScreen } from './game-screen'
import { HelpWindow } from '../windows'
import { DisplayValues } from '../constants'

export const saveFileName = 'bamfoodle-7drl-2026-save'

export class MainMenuScreen extends Screen {
  selectedOption: number
  windowPosition: Vector2
  windowDimension: Vector2
  renderPosition: Vector2
  options: string[]

  helpWindow: HelpWindow

  constructor(display: Display, manager: ScreenManager) {
    super(display, manager)

    this.selectedOption = 0
    this.windowPosition = { x: 24, y: 16 }
    this.windowDimension = { x: 28, y: 20 }
    this.renderPosition = { x: 27, y: 18 }

    this.options = ['New Game']

    if (localStorage.getItem(saveFileName) !== null) {
      this.options.push('Continue Game')
    }

    this.options.push('Instructions')

    this.helpWindow = new HelpWindow()
  }

  keyDown(event: KeyboardEvent) {
    if (this.helpWindow.active) {
      this.helpWindow.handleKeyboardInput(event)
    } else {
      switch (event.key) {
        case 'ArrowUp':
          this.selectedOption = Math.max(0, this.selectedOption - 1)
          break
        case 'ArrowDown':
          this.selectedOption = Math.min(
            this.options.length - 1,
            this.selectedOption + 1,
          )
          break
        case 'Enter':
          this.handleSelectedOption()
          break
      }
    }
  }

  handleSelectedOption() {
    const option = this.options[this.selectedOption]

    switch (option) {
      case 'New Game':
        if (this.options.includes('Continue Game')) {
          localStorage.removeItem(saveFileName)
        }
        this.manager.setNextScreen(new GameScreen(this.display, this.manager))
        break
      case 'Continue Game':
        const saveGame = localStorage.getItem(saveFileName)
        localStorage.removeItem(saveFileName)
        this.manager.setNextScreen(
          new GameScreen(this.display, this.manager, saveGame!),
        )
        break
      case 'Instructions':
        this.helpWindow.setActive(true)
        break
    }
  }

  mouseMove(_event: MouseEvent | WheelEvent) {}

  render() {
    this.display.clear()

    renderSingleLineTextOver(
        this.display,
        {x: DisplayValues.HalfWidth - 13, y: this.windowPosition.y / 2},
        `Routine Inspection RL`,
        Colors.White,
        null,
      )

    renderSingleLineTextOver(
        this.display,
        {x: DisplayValues.HalfWidth - 11, y: this.windowPosition.y / 2 + 2},
        `A 7DRL 2026 Entry`,
        Colors.White,
        null,
      )

    renderWindowWithTitle(
      this.display,
      this.windowPosition,
      this.windowDimension,
      'Main Menu',
    )

    this.options.forEach((o, index) => {
      renderSingleLineTextOver(
        this.display,
        add(this.renderPosition, { x: 0, y: index }),
        `${this.selectedOption === index ? '->' : '  '} ${o}`,
        Colors.White,
        null,
      )
    })

    renderSingleLineTextOver(
        this.display,
        {x: DisplayValues.ScreenWidth - 17, y: DisplayValues.ScreenHeight - 2},
        `© ${new Date().getFullYear()} Bamfoodle`,
        Colors.White,
        null,
      )

    if (this.helpWindow.active) {
      this.helpWindow.render(this.display)
    }
  }
}
