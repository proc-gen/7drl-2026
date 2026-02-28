export type Tile = {
  fg: string | null
  bg: string | null
  char: string

  lighting: string

  walkable: boolean
  transparent: boolean
  seen: boolean

  name: string
}
