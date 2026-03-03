export const WeaponClasses = {
    SingleTarget: 'Single Target',
    Thrown: 'Thrown',
    Explosive: 'Explosive',
    Melee: 'Melee'
}

export type WeaponClass = keyof typeof WeaponClasses