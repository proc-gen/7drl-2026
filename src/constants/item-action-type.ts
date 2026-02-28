export const ItemActionTypes = {
  Use: 'Use',
  PickUp: 'PickUp',
  Drop: 'Drop',
  Attack: 'Attack',
  Reload: 'Reload',
}

export type ItemActionType = keyof typeof ItemActionTypes