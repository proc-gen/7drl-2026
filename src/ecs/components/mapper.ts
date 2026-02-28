import { addComponent, type EntityId, type World } from 'bitecs'
import {
  ActionComponent,
  AliveComponent,
  ArmorComponent,
  BlockerComponent,
  ConfusionComponent,
  ConsumableComponent,
  DeadComponent,
  EnemyComponent,
  EquippableComponent,
  EquipmentComponent,
  HealComponent,
  HealthComponent,
  InfoComponent,
  ItemComponent,
  LightComponent,
  OwnerComponent,
  PlayerComponent,
  PositionComponent,
  RemoveComponent,
  RenderableComponent,
  RenderLayerBlockerComponent,
  RenderLayerGroundComponent,
  RenderLayerItemComponent,
  RenderLayerAboveComponent,
  SpellComponent,
  StatsComponent,
  TargetingComponent,
  WantAttackComponent,
  WantCauseSpellEffectComponent,
  WantUseItemComponent,
  WeaponComponent,
  type Component,
  DoorComponent,
  MeleeWeaponComponent,
  RangedWeaponComponent,
  AmmunitionComponent,
  AnimationComponent,
  FieldOfViewComponent,
  PathfinderComponent,
} from '.'

export const WorldComponents: Component<any>[] = [
  ActionComponent,
  AliveComponent,
  AmmunitionComponent,
  AnimationComponent,
  ArmorComponent,
  BlockerComponent,
  ConfusionComponent,
  ConsumableComponent,
  DeadComponent,
  DoorComponent,
  EnemyComponent,
  EquippableComponent,
  EquipmentComponent,
  FieldOfViewComponent,
  HealComponent,
  HealthComponent,
  InfoComponent,
  ItemComponent,
  LightComponent,
  MeleeWeaponComponent,
  OwnerComponent,
  PathfinderComponent,
  PlayerComponent,
  PositionComponent,
  RangedWeaponComponent,
  RemoveComponent,
  RenderableComponent,
  RenderLayerGroundComponent,
  RenderLayerItemComponent,
  RenderLayerBlockerComponent,
  RenderLayerAboveComponent,
  SpellComponent,
  StatsComponent,
  TargetingComponent,
  WantAttackComponent,
  WantUseItemComponent,
  WantCauseSpellEffectComponent,
  WeaponComponent,
]

const WorldComponentNames: string[] = [
  'ActionComponent',
  'AliveComponent',
  'AmmunitionComponent',
  'AnimationComponent',
  'ArmorComponent',
  'BlockerComponent',
  'ConfusionComponent',
  'ConsumableComponent',
  'DeadComponent',
  'DoorComponent',
  'EnemyComponent',
  'EquippableComponent',
  'EquipmentComponent',
  'FieldOfViewComponent',
  'HealComponent',
  'HealthComponent',
  'InfoComponent',
  'ItemComponent',
  'LightComponent',
  'MeleeWeaponComponent',
  'OwnerComponent',
  'PathfinderComponent',
  'PlayerComponent',
  'PositionComponent',
  'RangedWeaponComponent',
  'RemoveComponent',
  'RenderableComponent',
  'RenderLayerGroundComponent',
  'RenderLayerItemComponent',
  'RenderLayerBlockerComponent',
  'RenderLayerAboveComponent',
  'SpellComponent',
  'StatsComponent',
  'TargetingComponent',
  'WantAttackComponent',
  'WantUseItemComponent',
  'WantCauseSpellEffectComponent',
  'WeaponComponent',
]

export const getDataFromComponent = (
  entity: EntityId,
  componentType: Component<any>,
) => {
  const index = WorldComponents.indexOf(componentType)

  const componentData = {
    componentType: WorldComponentNames[index],
    data: componentType.values[entity],
  }

  return componentData
}

export const setDataForComponent = (
  world: World,
  entity: EntityId,
  componentType: string,
  data: any,
) => {
  const componentNameIndex = WorldComponentNames.indexOf(componentType)

  if (componentNameIndex >= 0) {
    const component = WorldComponents[componentNameIndex]
    addComponent(world, entity, component)
    component.values[entity] = data
  }
}
