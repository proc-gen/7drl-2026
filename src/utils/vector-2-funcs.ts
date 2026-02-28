import type { Vector2 } from '../types'

export const add = (v1: Vector2, v2: Vector2) => {
  return { x: v1.x + v2.x, y: v1.y + v2.y }
}

export const distance = (v1: Vector2, v2: Vector2) => {
  return Math.sqrt((v2.x - v1.x) ** 2 + (v2.y - v1.y) ** 2)
}

export const equal = (v1: Vector2, v2: Vector2) => {
  return v1.x === v2.x && v1.y === v2.y
}

export const ZeroVector: Vector2 = { x: 0, y: 0 }

export const angle = (start: Vector2, p1: Vector2, p2: Vector2) => {
  const v1 = { x: start.x - p1.x, y: start.y - p1.y }
  const v2 = { x: start.x - p2.x, y: start.y - p2.y }
  return Math.acos(
    (v1.x * v2.x + v1.y * v2.y) /
      (distance(ZeroVector, v1) * distance(ZeroVector, v2)),
  )
}

export const getPointsInLine = (start: Vector2, end: Vector2) => {
  const points = [start]
  const dx = Math.abs(end.x - start.x)
  const dy = Math.abs(end.y - start.y)

  const unitX: Vector2 = { x: start.x < end.x ? 1 : -1, y: 0 }
  const unitY: Vector2 = { x: 0, y: start.y < end.y ? 1 : -1 }
  let error = dx - dy

  let currentPoint = { ...start }
  do {
    const errorCheck = 2 * error
    if (errorCheck > -dy) {
      error -= dy
      currentPoint = add(currentPoint, unitX)
    }
    if (errorCheck < dx) {
      error += dx
      currentPoint = add(currentPoint, unitY)
    }
    points.push({ ...currentPoint })
  } while (!equal(currentPoint, end))

  return points
}
