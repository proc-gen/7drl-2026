import { Color } from 'rot-js'

export const MixColors = (colorA: string, colorB: string) => {
  return Color.toHex(
    Color.multiply(Color.fromString(colorA), Color.fromString(colorB)),
  )
}

export const AddColors = (colorA: string, colorB: string) => {
  return Color.toHex(
    Color.add(Color.fromString(colorA), Color.fromString(colorB)),
  )
}

export const ConstMultiplyColor = (color: string, constant: number) => {
  const val = Math.floor(constant * 255)
  const colorConst = Color.toHex([val, val, val])
  return MixColors(color, colorConst)
}
