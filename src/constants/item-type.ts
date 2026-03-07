export const ItemTypes = {
  Consumable: 'Consumable',
  Equipment: 'Equipment',
  Ammunition: 'Ammunition',
  Key: 'Key',
  Special: 'Special',
}

export type ItemType = keyof typeof ItemTypes