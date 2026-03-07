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
    this.windowPosition = { x: 10, y: 5 }
    this.windowDimension = { x: 60, y: 40 }
    this.renderPosition = { x: 12, y: 7 }
    this.renderPositionRight = { x: 42, y: 7 }

    this.instructions = [
      { label: 'Game Screen', value: '' },
      { label: '  Movement', value: 'Arrow Keys' },
      { label: '  Melee/Interact', value: 'Move into entity' },
      { label: '  Wait', value: 'Space' },
      { label: '  Get Item', value: 'G' },
      { label: '  Target w/ Primary', value: '1' },
      { label: '  Reload Primary', value: 'R' },
      { label: '  Target w/ Secondary', value: '2' },
      { label: '  Reload Secondary', value: 'F' },
      { label: '  Inspect', value: 'E' },
      { label: '  Go to Next Level', value: 'V' },
      { label: '  Open Inventory', value: 'I' },
      { label: '  Open Message Log', value: 'L' },
      { label: '  Open Help', value: 'F1' },
      { label: '  Save and Exit', value: 'Escape' },
      { label: '  End Run', value: 'X' },
      { label: '', value: '' },
      { label: 'Inventory Window', value: '' },
      { label: '  Use Item', value: 'Enter' },
      { label: '  Close Window', value: 'Escape' },
      { label: '', value: '' },
      { label: 'Targeting Overlay', value: '' },
      { label: '  Move Target', value: 'Arrow Keys / Mouse' },
      { label: '  Attack Target', value: 'Enter / Mouse 1' },
      { label: '  Stop Targeting', value: 'Escape' },
      { label: '', value: '' },
      { label: 'Inspection Overlay', value: '' },
      { label: '  Move Cursor', value: 'Arrow Keys / Mouse' },
      { label: '  Exit Inspection', value: 'Escape' },
      { label: '', value: '' },
      { label: 'Message Log Window', value: '' },
      { label: '  Scroll List', value: 'Arrow Keys / Mouse Wheel' },
      { label: '  Exit Inspection', value: 'Escape' },
      { label: '', value: '' },
      { label: 'Help Window', value: '' },
      { label: '  Close Window', value: 'Escape' },
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
    this.instructions.forEach((i, idx) => {
      renderSingleLineTextOver(
        display,
        renderPos,
        i.label,
        i.value.length > 0
          ? idx % 2 === 0
            ? Colors.White
            : Colors.VeryLightGrey
          : Colors.Player,
        null,
      )
      renderPos.y++
    })
  }

  renderRight(display: Display) {
    let renderPos = { ...this.renderPositionRight }
    this.instructions.forEach((i, idx) => {
      renderSingleLineTextOver(
        display,
        renderPos,
        i.value,
        idx % 2 === 0 ? Colors.White : Colors.VeryLightGrey,
        null,
      )
      renderPos.y++
    })
  }
}
