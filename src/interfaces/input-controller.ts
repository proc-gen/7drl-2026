import type { HandleInputInfo, Vector2 } from '../types'

export interface InputController {
  active: boolean

  setActive(value: boolean): void
  getActive(): boolean

  handleKeyboardInput(event: KeyboardEvent): HandleInputInfo
  handleMouseInput(event: MouseEvent, position: Vector2): HandleInputInfo
}
