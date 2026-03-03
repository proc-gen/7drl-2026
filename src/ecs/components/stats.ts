import type { Component } from './component'

export const StatsComponent: Component<Stats> = {
  values: [] as Stats[],
}

export type Stats = {
  strength: number
  currentStrength: number
  moveSpeed: number
  xpGiven: number

  singleTargetXp: number
  singleTargetMaxXp: number
  singleTargetLevel: number
  thrownWeaponXp: number
  thrownWeaponMaxXp: number
  thrownWeaponLevel: number
  explosiveWeaponXp: number
  explosiveWeaponMaxXp: number
  explosiveWeaponLevel: number
  meleeXp: number
  meleeMaxXp: number
  meleeLevel: number
}
