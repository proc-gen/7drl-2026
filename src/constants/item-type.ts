export const ItemTypes = {
  Consumable: 'Consumable',
  Equipment: 'Equipment',
  Ammunition: 'Ammunition',
}

export type ItemType = keyof typeof ItemTypes