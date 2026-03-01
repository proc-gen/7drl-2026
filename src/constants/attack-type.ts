export const AttackTypes = {
  Melee: 'Melee',
  Spell: 'Spell',
  Ranged: 'Ranged',
  RangedEnergy: 'RangedEnergy',
  RangedPhysical: 'RangedPhysical',
}

export type AttackType = keyof typeof AttackTypes

export const isRanged = (attackType: AttackType) => {
  return [AttackTypes.Ranged, AttackTypes.RangedEnergy, AttackTypes.RangedPhysical].includes(attackType)
}