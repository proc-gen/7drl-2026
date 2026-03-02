export const InteractableTypes = {
    SecurityCrate: 'SecurityCrate',
    EnergyStation: 'EnergyStation',
    RandomCrate: 'RandomCrate',
}

export type InteractableType = keyof typeof InteractableTypes