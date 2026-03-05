export const InteractableTypes = {
    SecurityCrate: 'SecurityCrate',
    EnergyStation: 'EnergyStation',
    RandomCrate: 'RandomCrate',
    EnergyRemnants: 'Energy Remnants',
    ShieldRemnants: 'Shield Remnants',
    LockdownSwitch: 'Lockdown Switch',
}

export type InteractableType = keyof typeof InteractableTypes