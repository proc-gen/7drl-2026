import type { Vector2 } from '../types'
import type { Display } from 'rot-js'
import {
  renderSingleLineTextOver,
  renderWindowWithTitle,
} from '../utils/render-funcs'
import type { RenderWindow } from '.'
import { Colors } from '../constants'

export class HelpWindow implements RenderWindow {
  active: boolean
  windowPosition: Vector2
  windowDimension: Vector2
  renderPosition: Vector2
  renderPositionRight: Vector2

  instructions: { label: string; value: string }[]

  constructor() {
    this.active = false
    this.windowPosition = { x: 15, y: 10 }
    this.windowDimension = { x: 50, y: 30 }
    this.renderPosition = { x: 18, y: 12 }
    this.renderPositionRight = { x: 40, y: 12 }

    this.instructions = [
      { label: 'Game Screen', value: '' },
      { label: 'Movement', value: 'Arrow Keys' },
      { label: 'Wait', value: 'Space' },
      { label: 'Get Item', value: 'G' },
      { label: 'Target (Ranged Only)', value: 'T' },
      { label: 'Reload (Ranged Only)', value: 'R' },
      { label: 'Inspect', value: 'E' },
      { label: 'Descend', value: 'V' },
      { label: 'Open Inventory', value: 'I' },
      { label: 'Open Message Log', value: 'L' },
      { label: 'Open Help', value: 'F1' },
      { label: 'Return to Main Menu', value: 'Escape' },
      { label: '', value: '' },
      { label: 'Inventory', value: '' },
      { label: 'Use Item', value: 'Enter' },
      { label: 'Drop Item', value: 'D' },
      { label: 'Close Window', value: 'Escape' },
      { label: '', value: '' },
      { label: 'Targeting Window', value: '' },
      { label: 'Attack Target', value: 'Enter' },
      { label: 'Stop Targeting', value: 'Escape' },
    ]
  }

  getActive(): boolean {
    return this.active
  }

  setActive(value: boolean): void {
    this.active = value
  }

  handleKeyboardInput(event: KeyboardEvent) {
    switch (event.key) {
      case 'Escape':
        this.active = false
        break
    }
  }

  render(display: Display) {
    renderWindowWithTitle(
      display,
      this.windowPosition,
      this.windowDimension,
      'Help',
    )

    this.renderLeft(display)
    this.renderRight(display)
  }

  renderLeft(display: Display) {
    let renderPos = { ...this.renderPosition }
    this.instructions.forEach((i) => {
      renderSingleLineTextOver(display, renderPos, i.label, i.value.length > 0 ? Colors.White : Colors.Player, null)
      renderPos.y++
    })
  }

  renderRight(display: Display) {
    let renderPos = { ...this.renderPositionRight }
    this.instructions.forEach((i) => {
      renderSingleLineTextOver(display, renderPos, i.value, Colors.White, null)
      renderPos.y++
    })
  }
}
