import type { Component } from './component'

export const SpellComponent: Component<Spell> = {
  values: [] as Spell[],
}

export type Spell = {
  range: number
  damage: number
  radius?: number
  spellName: string
}
