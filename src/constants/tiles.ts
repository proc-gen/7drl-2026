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

export const FLOOR_TILE: Tile = {
  walkable: true,
  transparent: true,
  char: '',
  fg: null,
  bg: Colors.MediumGrey,
  seen: false,
  name: 'Floor',
  lighting: Colors.Ambient,
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
}

export const WALL_TILE: Tile = {
  walkable: false,
  transparent: false,
  char: '#',
  fg: Colors.White,
  bg: Colors.MediumGrey,
  seen: false,
  name: 'Wall',
  lighting: Colors.Ambient,
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
}