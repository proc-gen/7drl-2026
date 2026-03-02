import type { Component } from './component'

export const KeyComponent: Component<Key> = {
  values: [] as Key[],
}

export type Key = {
  level: number
}
