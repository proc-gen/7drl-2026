import type { Display } from 'rot-js'
import type { InputController } from '../interfaces/input-controller'
import type { HandleInputInfo, Vector2 } from '../types'
import { ZeroVector } from '../utils/vector-2-funcs'
import type { RenderWindow } from './render-window'
import { Colors, DisplayValues } from '../constants'
import {
  renderMultipleTextLinesOver,
  renderSingleLineTextOver,
} from '../utils/render-funcs'

export class LevelIntroOverlay implements InputController, RenderWindow {
  active: boolean
  windowPosition: Vector2
  windowDimension: Vector2

  level: number
  levelName: string
  levelDescription: string

  showContinue: boolean

  constructor() {
    this.active = false
    this.windowPosition = ZeroVector
    this.windowDimension = {
      x: DisplayValues.ScreenWidth,
      y: DisplayValues.ScreenHeight,
    }

    this.levelName = ''
    this.levelDescription = ''
    this.level = 0
    this.showContinue = false
  }

  resetForNewLevel(level: number, levelName: string, levelDescription: string) {
    this.level = level
    this.levelName = levelName
    this.levelDescription = levelDescription
    this.showContinue = false
    this.active = true

    window.setTimeout(() => {
      this.showContinue = true
    }, 2000)
  }

  getActive(): boolean {
    return this.active
  }

  setActive(value: boolean): void {
    this.active = value
  }

  handleKeyboardInput(event: KeyboardEvent): HandleInputInfo {
    const inputInfo = { needUpdate: false }
    if (this.showContinue) {
      switch (event.key) {
        case 'Enter':
          this.active = false
          break
      }
    }
    return inputInfo
  }

  handleMouseInput(_event: MouseEvent, _position: Vector2): HandleInputInfo {
    const inputInfo = { needUpdate: false }
    return inputInfo
  }

  render(display: Display): void {
    let message = 'Now Entering:'
    let offset = DisplayValues.HalfWidth - Math.floor(message.length / 2)
    renderSingleLineTextOver(
      display,
      { x: offset, y: DisplayValues.HalfHeight - 1 },
      message,
      Colors.White,
      null,
    )

    offset = DisplayValues.HalfWidth - Math.floor(this.levelName.length / 2)
    renderSingleLineTextOver(
      display,
      { x: offset, y: DisplayValues.HalfHeight + 1 },
      this.levelName,
      Colors.WarningLocation,
      null,
    )

    offset = DisplayValues.HalfWidth - 25
    renderMultipleTextLinesOver(
      display,
      { x: offset, y: DisplayValues.HalfHeight + 3 },
      this.levelDescription,
      50,
      Colors.White,
      Colors.Black,
    )

    if (this.showContinue) {
      message = 'Press any key to continue'
      offset = DisplayValues.HalfWidth - Math.floor(message.length / 2)
      let offsetY =
        DisplayValues.HalfHeight +
        5 +
        Math.ceil(this.levelDescription.length / 50)

      renderSingleLineTextOver(
        display,
        { x: offset, y: offsetY },
        message,
        Colors.White,
        null,
      )
    }

    message = this.hintForLevel()
    offset = DisplayValues.HalfWidth - 20
    renderMultipleTextLinesOver(
      display,
      { x: offset, y: DisplayValues.HalfHeight + 20 },
      message,
      40,
      Colors.White,
      Colors.Black,
    )
  }

  hintForLevel(){
    switch(this.level){
        case 2:
            return 'Running low on shield? Find the Energy to Shield Tool so you can put that spare energy to use!'
        case 3:
            return "Remember to switch weapons based on the situation. More damage doesn't always solve the problem efficiently"
        case 4:
            return 'Want an extra challenge? See what happens when you kill the Sweeper'
        case 5:
            return 'Knockback does more than move enemies around. Knocking them into a wall does bonus damage!'
        case 6:
            return 'Be sure to check your weapon proficiency bonuses! Focusing on one weapon type could give you an extra punch when you need it most!'
        case 7:
            return 'Try looking for a uniquely colored ship!'
        case 8:
            return "Ain't nobody better have touched Daisy!"
        case 1:
        default:
            return 'Shields are your lifeline! When they go to 0, so do you!'
    }
  }
}
