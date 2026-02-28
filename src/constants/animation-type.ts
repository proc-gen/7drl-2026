export const AnimationTypes = {
    FlashLight: 'FlashLight',
    FlashCharacter: 'FlashCharacter',
    FollowPath: 'FollowPath'
}

export type AnimationType = keyof typeof AnimationTypes