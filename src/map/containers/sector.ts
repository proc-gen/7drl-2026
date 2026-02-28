import type { Vector2 } from '../../types'
import { equal } from '../../utils/vector-2-funcs'

export class Sector {
  x: number
  y: number
  includedTiles: Vector2[]

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    this.includedTiles = []
  }

  intersects(other: Sector) {
    return (
      this.includedTiles.filter((t) =>
        other.includedTiles.find((oT) => equal(oT, t)),
      ).length > 0
    )
  }

  center(): Vector2 {
    let x = 0
    let y = 0
    this.includedTiles.forEach((t) => {
      x += t.x
      y += t.y
    })

    return {
      x: Math.floor(x / this.includedTiles.length),
      y: Math.floor(y / this.includedTiles.length),
    }
  }
}
