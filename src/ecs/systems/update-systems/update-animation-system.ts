import { addComponent, query, type EntityId, type World } from 'bitecs'
import type { UpdateSystem } from './update-system'
import { AnimationComponent, LightComponent, PositionComponent, RemoveComponent, RenderableComponent, type Animation } from '../../components'
import { AnimationTypes } from '../../../constants'
import { ConstMultiplyColor } from '../../../utils/color-funcs'

export class UpdateAnimationSystem implements UpdateSystem {
  previousTick: number
  constructor(){
    this.previousTick = new Date().getTime()
  }
  
    update(world: World, _entity: EntityId) {
        const currentTick = new Date().getTime()
        const difference = currentTick - this.previousTick
    for (const eid of query(world, [AnimationComponent])) {
        const animation = AnimationComponent.values[eid]
        animation.toNextFrame -= difference
        animation.animationTimeLeft -= difference

        if(animation.animationTimeLeft <= 0){
            addComponent(world, eid, RemoveComponent)
        } else if(animation.toNextFrame <= 0){
            animation.toNextFrame += animation.animationRate
            animation.framesProcessed += 1

            switch(animation.animationType){
                case AnimationTypes.FlashCharacter:
                    this.processFlashCharacterAnimation(eid, animation)
                    break
                case AnimationTypes.FlashLight:
                    this.processFlashLightAnimation(eid, animation)
                    break
                case AnimationTypes.FollowPath:
                    this.processFollowPathAnimation(eid, animation)
                    break
            }
        }
    }
    this.previousTick = currentTick
  }

  processFlashCharacterAnimation(eid: EntityId, _animation: Animation) {
    const renderable = RenderableComponent.values[eid]
    renderable.fg = renderable.fg !== null ? ConstMultiplyColor(renderable.fg, 0.9) : renderable.fg
    renderable.bg = renderable.bg !== null ? ConstMultiplyColor(renderable.bg, 0.9) : renderable.bg
}

  processFlashLightAnimation(eid: EntityId, _animation: Animation) {
    const light = LightComponent.values[eid]
    light.intensity *= 0.9
  }

  processFollowPathAnimation(eid: EntityId, animation: Animation){
    const position = PositionComponent.values[eid]
    const nextPosition = animation.positions![Math.min(animation.framesProcessed, animation.positions!.length)]
    position.x = nextPosition.x
    position.y = nextPosition.y
  }
}
