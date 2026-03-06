import { type Tile } from '../map'
import { Colors } from './colors'

export const GlyphChars = {
  9: '#',
  185: '╣',
  186: '║',
  187: '╗',
  188: '╝',
  200: '╚',
  201: '╔',
  202: '╩',
  203: '╦',
  204: '╠',
  205: '═',
  206: '╬',
}

export const OrderedGlyphs = [
  GlyphChars[9],
  GlyphChars[186],
  GlyphChars[186],
  GlyphChars[186],
  GlyphChars[205],
  GlyphChars[188],
  GlyphChars[187],
  GlyphChars[185],
  GlyphChars[205],
  GlyphChars[200],
  GlyphChars[201],
  GlyphChars[204],
  GlyphChars[205],
  GlyphChars[202],
  GlyphChars[203],
  GlyphChars[206],
]

export const isFloor = (tile: Tile) => {
  return tile.name.includes(FLOOR_TILE.name)
}

export const FLOOR_TILE: Tile = {
  walkable: true,
  transparent: true,
  char: '',
  fg: null,
  bg: Colors.MediumGrey,
  seen: false,
  name: 'Floor',
  lighting: Colors.Ambient,
  exit: false,
}

export const EXIT_TO_NEXT_LEVEL: Tile = {
  walkable: true,
  transparent: true,
  char: '»',  
  fg: Colors.Stairs,
  bg: Colors.MediumGrey,
  seen: false,
  name: 'Exit to next level',
  lighting: Colors.Ambient,
  exit: true,
}

export const STAIRS_DOWN_TILE: Tile = {
  walkable: true,
  transparent: true,
  char: '▼',
  fg: Colors.Stairs,
  bg: Colors.MediumGrey,
  seen: false,
  name: 'Stairs Down',
  lighting: Colors.Ambient,
  exit: false,
}

export const STAIRS_UP_TILE: Tile = {
  walkable: true,
  transparent: true,
  char: '▲',
  fg: Colors.Stairs,
  bg: Colors.MediumGrey,
  seen: false,
  name: 'Stairs Up',
  lighting: Colors.Ambient,
  exit: false,
}

export const ELEVATOR_TILE: Tile = {
  walkable: true,
  transparent: true,
  char: 'E',
  fg: Colors.Stairs,
  bg: Colors.MediumGrey,
  seen: false,
  name: 'Elevator',
  lighting: Colors.Ambient,
  exit: false,
}

export const WALL_TILE: Tile = {
  walkable: false,
  transparent: false,
  char: 'X',
  fg: Colors.White,
  bg: Colors.MediumGrey,
  seen: false,
  name: 'Wall',
  lighting: Colors.Ambient,
  exit: false,
}

export const CRATE_TILE: Tile = {
  walkable: false,
  transparent: true,
  char: '#',
  fg: Colors.DarkGrey,
  bg: Colors.LightGrey,
  seen: false,
  name: 'Crate',
  lighting: Colors.Ambient,
  exit: false,
}

export const CUBEWALL_TILE: Tile = {
  walkable: false,
  transparent: false,
  char: '#',
  fg: Colors.White,
  bg: null,
  seen: false,
  name: 'Cubicle Wall',
  lighting: Colors.Ambient,
  exit: false,
}

export const SHIP_TILE: Tile = {
  walkable: false,
  transparent: true,
  char: '#',
  fg: Colors.White,
  bg: null,
  seen: false,
  name: 'Ship',
  lighting: Colors.Ambient,
  exit: false,
}

export const CUBE_DESK_TILE: Tile = {
  walkable: false,
  transparent: true,
  char: '',
  fg: Colors.VeryLightGrey,
  bg: Colors.CafeTable,
  seen: false,
  name: 'Cubicle Desk',
  lighting: Colors.Ambient,
  exit: false,
}

export const CAFE_TABLE_TILE: Tile = {
  walkable: false,
  transparent: true,
  char: '',
  fg: Colors.VeryLightGrey,
  bg: Colors.CafeTable,
  seen: false,
  name: 'Cafe Table',
  lighting: Colors.Ambient,
  exit: false,
}

export const CLOSED_DOOR_TILE: Tile = {
  walkable: true,
  transparent: false,
  char: '+',
  fg: Colors.Door,
  bg: Colors.MediumGrey,
  seen: false,
  name: 'Door Closed',
  lighting: Colors.Ambient,
  exit: false,
}

export const OPEN_DOOR_TILE: Tile = {
  walkable: true,
  transparent: true,
  char: '\\',
  fg: Colors.Door,
  bg: Colors.MediumGrey,
  seen: false,
  name: 'Door Open',
  lighting: Colors.Ambient,
  exit: false,
}