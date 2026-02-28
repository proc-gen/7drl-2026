import type { AnimationType } from '../../constants'
import type { Vector2 } from '../../types'
import type { Component } from './component'

export const AnimationComponent: Component<Animation> = {
  values: [] as Animation[],
}

export type Animation = {
    animationType: AnimationType
    animationRate: number
    numFrames: number
    framesProcessed: number
    toNextFrame: number
    animationTimeLeft: number
    nextAnimation?: string
    nextSubAnimation?: string
    positions?: Vector2[]
}
