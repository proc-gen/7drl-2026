import type { Component } from './component'

export const RenderLayerGroundComponent: Component<RenderLayerGround> = {
  values: [] as RenderLayerGround[],
}

export type RenderLayerGround = {}

export const RenderLayerItemComponent: Component<RenderLayerItem> = {
  values: [] as RenderLayerItem[],
}

export type RenderLayerItem = {}

export const RenderLayerBlockerComponent: Component<RenderLayerBlocker> = {
  values: [] as RenderLayerBlocker[],
}

export type RenderLayerBlocker = {}

export const RenderLayerAboveComponent: Component<RenderLayerAbove> = {
  values: [] as RenderLayerAbove[],
}

export type RenderLayerAbove = {}

export const RenderOrder = [
  RenderLayerGroundComponent,
  RenderLayerItemComponent,
  RenderLayerBlockerComponent,
  RenderLayerAboveComponent,
]
