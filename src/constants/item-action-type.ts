export const ItemActionTypes = {
  Use: 'Use',
  PickUp: 'PickUp',
  Drop: 'Drop',
  Attack: 'Attack',
  Reload: 'Reload',
  ReloadSecondary: 'ReloadSecondary',
  Steal: 'Steal',
}

export type ItemActionType = keyof typeof ItemActionTypes