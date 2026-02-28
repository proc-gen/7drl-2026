import type { Component } from './component'

export const InfoComponent: Component<Info> = {
  values: [] as Info[],
}

export type Info = {
  name: string
}
