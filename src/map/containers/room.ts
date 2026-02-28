import type { Vector2 } from '../../types'
import { Sector } from './'

export class Room extends Sector {
  width: number
  height: number

  constructor(x: number, y: number, width: number, height: number) {
    super(x, y)
    this.width = width
    this.height = height

    for (let i = x; i < x + width; i++) {
      for (let j = y; j < y + height; j++) {
        this.includedTiles.push({ x: i, y: j })
      }
    }
  }

  center(): Vector2 {
    const x = this.x + Math.floor(this.width / 2)
    const y = this.y + Math.floor(this.height / 2)

    return { x, y }
  }
}
