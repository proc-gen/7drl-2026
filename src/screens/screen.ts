import type { Display } from 'rot-js'
import type { ScreenManager } from '../screen-manager'

export abstract class Screen {
  display: Display
  manager: ScreenManager

  constructor(display: Display, manager: ScreenManager) {
    this.display = display
    this.manager = manager
  }

  abstract keyDown(event: KeyboardEvent): void
  abstract mouseMove(event: MouseEvent | WheelEvent): void
  abstract render(): void
}
