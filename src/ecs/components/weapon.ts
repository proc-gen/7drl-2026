import type { AmmunitionType, AttackType } from '../../constants'
import type { Component } from './component'

export const WeaponComponent: Component<Weapon> = {
  values: [] as Weapon[],
}

export type Weapon = {
  attack: number
  attackType: AttackType
}

export const MeleeWeaponComponent: Component<MeleeWeapon> = {
  values: [] as MeleeWeapon[]
}

export type MeleeWeapon = {

}

export const RangedWeaponComponent: Component<RangedWeapon> = {
  values: [] as RangedWeapon[]
}

export type RangedWeapon = {
  range: number,
  ammunitionType: AmmunitionType
  currentAmmunition: number
  maxAmmunition: number
}