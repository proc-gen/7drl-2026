import type { Component } from './component'

export const DoorComponent: Component<Door> = {
  values: [] as Door[],
}

export type Door = {
  open: boolean
}
