import { type Component } from './component'

import { type Action, ActionComponent } from './action'
import { type Alive, AliveComponent } from './alive'
import { type Ammunition, AmmunitionComponent } from './ammunition'
import { type Animation, AnimationComponent } from './animation'
import { type Armor, ArmorComponent } from './armor'
import { type Blocker, BlockerComponent } from './blocker'
import { type Confusion, ConfusionComponent } from './confusion'
import { type Consumable, ConsumableComponent } from './consumable'
import { type Dead, DeadComponent } from './dead'
import { type Door, DoorComponent } from './door'
import { type Enemy, EnemyComponent } from './enemy'
import { type Equippable, EquippableComponent } from './equippable'
import { type Equipment, EquipmentComponent } from './equipment'
import { type FieldOfView, FieldOfViewComponent } from './field-of-view'
import { type Heal, HealComponent } from './heal'
import { type Health, HealthComponent } from './health'
import { type Info, InfoComponent } from './info'
import { type Item, ItemComponent } from './item'
import { type Light, LightComponent } from './light'
import { type Owner, OwnerComponent } from './owner'
import { type Pathfinder, PathfinderComponent } from './pathfinder'
import { type Player, PlayerComponent } from './player'
import { type Position, PositionComponent } from './position'
import { type Remove, RemoveComponent } from './remove'
import { type Renderable, RenderableComponent } from './renderable'
import {
  type RenderLayerGround,
  type RenderLayerItem,
  type RenderLayerBlocker,
  type RenderLayerAbove,
  RenderLayerGroundComponent,
  RenderLayerItemComponent,
  RenderLayerBlockerComponent,
  RenderLayerAboveComponent,
  RenderOrder,
} from './render-layer'
import { type Spell, SpellComponent } from './spell'
import { type Stats, StatsComponent } from './stats'
import { type Targeting, TargetingComponent } from './targeting'
import { type WantAttack, WantAttackComponent } from './want-attack'
import { type WantUseItem, WantUseItemComponent } from './want-use-item'
import {
  type WantCauseSpellEffect,
  WantCauseSpellEffectComponent,
} from './want-cause-spell-effect'
import {
  type Weapon,
  WeaponComponent,
  type MeleeWeapon,
  MeleeWeaponComponent,
  type RangedWeapon,
  RangedWeaponComponent,
} from './weapon'

import {
  WorldComponents,
  getDataFromComponent,
  setDataForComponent,
} from './mapper'

export {
  type Component,
  type Action,
  ActionComponent,
  type Alive,
  AliveComponent,
  type Ammunition,
  AmmunitionComponent,
  type Animation,
  AnimationComponent,
  type Armor,
  ArmorComponent,
  type Blocker,
  BlockerComponent,
  type Confusion,
  ConfusionComponent,
  type Consumable,
  ConsumableComponent,
  type Dead,
  DeadComponent,
  type Door,
  DoorComponent,
  type Enemy,
  EnemyComponent,
  type Equippable,
  EquippableComponent,
  type Equipment,
  EquipmentComponent,
  type FieldOfView,
  FieldOfViewComponent,
  type Heal,
  HealComponent,
  type Health,
  HealthComponent,
  type Info,
  InfoComponent,
  type Item,
  ItemComponent,
  type Light,
  LightComponent,
  type MeleeWeapon,
  MeleeWeaponComponent,
  type Owner,
  OwnerComponent,
  type Pathfinder,
  PathfinderComponent,
  type Player,
  PlayerComponent,
  type Position,
  PositionComponent,
  type RangedWeapon,
  RangedWeaponComponent,
  type Remove,
  RemoveComponent,
  type Renderable,
  RenderableComponent,
  type RenderLayerGround,
  type RenderLayerItem,
  type RenderLayerBlocker,
  type RenderLayerAbove,
  RenderLayerGroundComponent,
  RenderLayerItemComponent,
  RenderLayerBlockerComponent,
  RenderLayerAboveComponent,
  RenderOrder,
  type Spell,
  SpellComponent,
  type Stats,
  StatsComponent,
  type Targeting,
  TargetingComponent,
  type WantAttack,
  WantAttackComponent,
  type WantUseItem,
  WantUseItemComponent,
  type WantCauseSpellEffect,
  WantCauseSpellEffectComponent,
  type Weapon,
  WeaponComponent,
  WorldComponents,
  getDataFromComponent,
  setDataForComponent,
}
