import { Display } from 'rot-js'
import { MainMenuScreen, Screen } from './screens'
import { DisplayValues } from './constants/display-values'

export class ScreenManager {
  display: Display
  private currentScreen: Screen

  constructor() {
    this.display = new Display({
      width: DisplayValues.ScreenWidth,
      height: DisplayValues.ScreenHeight,
      forceSquareRatio: true,
    })

    this.currentScreen = new MainMenuScreen(this.display, this)

    window.addEventListener('keydown', (e) => this.keyDown(e))
    window.addEventListener('mousemove', (e) => this.mouseMove(e))
    window.addEventListener('wheel', (e) => this.mouseMove(e))
  }

  keyDown(event: KeyboardEvent) {
    event.preventDefault()
    this.currentScreen.keyDown(event)
  }

  mouseMove(event: MouseEvent | WheelEvent) {
    this.currentScreen.mouseMove(event)
  }

  render() {
    this.currentScreen.render()
  }

  setNextScreen(screen: Screen) {
    this.currentScreen = screen
  }
}
