import type { Component } from './component'

export const RenderableComponent: Component<Renderable> = {
  values: [] as Renderable[],
}

export type Renderable = {
  fg: string | null
  bg: string | null
  char: string
  alwaysShow?: boolean
}
