import type { Display } from 'rot-js'
import type { InputController } from '../interfaces/input-controller'
import type { HandleInputInfo, Vector2 } from '../types'
import type { MessageLog } from '../utils/message-log'
import type { RenderWindow } from '.'
import {
  renderSingleLineTextOver,
  renderWindowWithTitle,
} from '../utils/render-funcs'

export class MessageHistoryWindow implements InputController, RenderWindow {
  active: boolean
  log: MessageLog
  logPosition: number

  windowPosition: Vector2
  windowDimension: Vector2
  messageLogRenderPosition: Vector2

  constructor(log: MessageLog) {
    this.active = false
    this.log = log
    this.logPosition = 0
    this.windowPosition = { x: 3, y: 3 }
    this.windowDimension = { x: 74, y: 38 }
    this.messageLogRenderPosition = { x: 5, y: 5 }
  }

  getActive(): boolean {
    return this.active
  }

  setActive(value: boolean): void {
    this.active = value
    if (this.active) {
      this.logPosition = 0
    }
  }

  handleKeyboardInput(event: KeyboardEvent): HandleInputInfo {
    const inputInfo = { needUpdate: false }
    switch (event.key) {
      case 'ArrowUp':
        this.logPosition = Math.max(0, this.logPosition - 1)
        break
      case 'ArrowDown':
        this.logPosition = Math.min(
          this.log.messages.length - 1,
          this.logPosition + 1,
        )
        break
      case 'Escape':
        this.active = false
        break
    }

    return inputInfo
  }

  handleMouseInput(event: WheelEvent, _position: Vector2): HandleInputInfo {
    const inputInfo = { needUpdate: false }
    if (event.deltaY !== undefined) {
      if (event.deltaY < 0) {
        this.logPosition = Math.min(
          this.log.messages.length - 1,
          this.logPosition + 1,
        )
      } else if (event.deltaY > 0) {
        this.logPosition = Math.max(0, this.logPosition - 1)
      }
    }

    return inputInfo
  }

  render(display: Display) {
    renderWindowWithTitle(
      display,
      this.windowPosition,
      this.windowDimension,
      'Message History',
    )

    this.renderMessageLog(display)
  }

  renderMessageLog(display: Display) {
    if (this.log.messages.length > 0) {
      let i = 0
      let renderPos = { ...this.messageLogRenderPosition }

      while (i < 36 && i + this.logPosition < this.log.messages.length) {
        i++
        const message =
          this.log.messages[this.log.messages.length - (i + this.logPosition)]
        renderSingleLineTextOver(
          display,
          renderPos,
          message.text,
          message.fg,
          message.bg,
        )

        renderPos.y++
      }
    }
  }
}
