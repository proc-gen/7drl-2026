import type { Component } from './component'

export const CauseEffectComponent: Component<CauseEffect> = {
  values: [] as CauseEffect[],
}

export type CauseEffect = {
  effectName: string
  effectTurns: number
}
