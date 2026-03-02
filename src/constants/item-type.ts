export const ItemTypes = {
  Consumable: 'Consumable',
  Equipment: 'Equipment',
  Ammunition: 'Ammunition',
  Key: 'Key',
}

export type ItemType = keyof typeof ItemTypes