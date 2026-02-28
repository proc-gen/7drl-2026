export const AttackTypes = {
  Melee: 'Melee',
  Spell: 'Spell',
  Ranged: 'Ranged',
}

export type AttackType = keyof typeof AttackTypes