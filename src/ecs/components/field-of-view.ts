import type { Component } from './component'

export const FieldOfViewComponent: Component<FieldOfView> = {
  values: [] as FieldOfView[],
}

export type FieldOfView = {
    baseFOV: number
    currentFOV: number
}
