export const AmmunitionTypes = {
    Stone: 'Stone',
    Arrow: 'Arrow',
    Energy: 'Energy',
    Discs: 'Discs',
    Grenades: 'Grenades',
    Rockets: 'Rockets'
}

export type AmmunitionType = keyof typeof AmmunitionTypes