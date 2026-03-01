export const AmmunitionTypes = {
    Energy: 'Energy',
    Discs: 'Discs',
    Grenades: 'Grenades',
    Rockets: 'Rockets'
}

export type AmmunitionType = keyof typeof AmmunitionTypes