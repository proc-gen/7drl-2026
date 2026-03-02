export const InteractableTypes = {
    SecurityCrate: 'SecurityCrate',
    EnergyStation: 'EnergyStation',
    RandomCrate: 'RandomCrate',
    EnergyRemnants: 'Energy Remnants',
    ShieldRemnants: 'Shield Remnants'
}

export type InteractableType = keyof typeof InteractableTypes