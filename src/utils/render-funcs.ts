import type { Display } from 'rot-js'
import type { Vector2 } from '../types'

export const renderHorizontalColoredBar = (
  display: Display,
  position: Vector2,
  width: number,
  color: string,
) => {
  for (let i = position.x; i < position.x + width; i++) {
    display.draw(i, position.y, ' ', color, color)
  }
}

export const renderSingleLineTextOver = (
  display: Display,
  position: Vector2,
  text: string,
  fg: string,
  bg: string | null,
) => {
  for (let i = 0; i < text.length; i++) {
    display.drawOver(i + position.x, position.y, text[i], fg, bg)
  }
}

export const renderBox = (
  display: Display,
  position: Vector2,
  dimension: Vector2,
  fg: string,
  bg: string,
) => {
  for (let i = position.x; i < position.x + dimension.x; i++) {
    for (let j = position.y; j < position.y + dimension.y; j++) {
      display.draw(i, j, ' ', fg, bg)
    }
  }
}

export const renderWindowWithTitle = (
  display: Display,
  position: Vector2,
  dimension: Vector2,
  title: string,
) => {
  const topLeft = '┌'
  const topRight = '┐'
  const bottomLeft = '└'
  const bottomRight = '┘'
  const vertical = '│'
  const horizontal = '─'
  const leftTitle = '┤'
  const rightTitle = '├'
  const empty = ' '

  const innerWidth = dimension.x - 2
  const innerHeight = dimension.y - 2
  const remainingAfterTitle = innerWidth - (title.length + 2)
  const left = Math.floor(remainingAfterTitle / 2)

  const topRow =
    topLeft +
    horizontal.repeat(left) +
    leftTitle +
    title +
    rightTitle +
    horizontal.repeat(remainingAfterTitle - left) +
    topRight
  const middleRow = vertical + empty.repeat(innerWidth) + vertical
  const bottomRow = bottomLeft + horizontal.repeat(innerWidth) + bottomRight

  display.drawText(position.x, position.y, topRow)
  for (let i = 1; i <= innerHeight; i++) {
    display.drawText(position.x, position.y + i, middleRow)
  }
  display.drawText(position.x, position.y + dimension.y - 1, bottomRow)
}
