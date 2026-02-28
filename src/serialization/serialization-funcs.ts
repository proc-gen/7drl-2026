import {
  createWorld,
  getAllEntities,
  query,
  type World,
  addEntity,
  hasComponent,
} from 'bitecs'
import { Map } from '../map'

import type { SerializedEntity, SerializedWorld } from './serialized-world'
import {
  EquipmentComponent,
  getDataFromComponent,
  OwnerComponent,
  PositionComponent,
  setDataForComponent,
  WorldComponents,
} from '../ecs/components'
import { MessageLog } from '../utils/message-log'
import type { GameStats } from '../types'

export const serializeWorld = (world: World, map: Map, log: MessageLog, gameStats: GameStats) => {
  const entities = getAllEntities(world)
  const serializedEntities = entities.map((e) => {
    const components = WorldComponents.map((componentType) => {
      if (hasComponent(world, e, componentType)) {
        return getDataFromComponent(e, componentType)
      } else {
        return undefined
      }
    }).filter((a) => a !== undefined)

    return {
      savedId: e,
      components,
    } as SerializedEntity
  })

  return {
    width: map.width,
    height: map.height,
    level: map.level,
    gameStats,
    messages: log.messages,
    tiles: map.tiles,
    serializedEntities: serializedEntities,
  } as SerializedWorld
}

export const deserializeWorld = (saveGame: string) => {
  const parsedWorld: SerializedWorld = JSON.parse(saveGame)
  const world = createWorld()

  parsedWorld.serializedEntities.forEach((se) => {
    se.loadedId = addEntity(world)

    se.components.forEach((c) => {
      setDataForComponent(world, se.loadedId!, c.componentType, c.data)
    })
  })

  for (const eid of query(world, [OwnerComponent])) {
    const ownerComponent = OwnerComponent.values[eid]
    const newOwner = parsedWorld.serializedEntities.find(
      (a) => a.savedId === ownerComponent.owner,
    )
    ownerComponent.owner = newOwner!.loadedId!
  }

  for (const eid of query(world, [EquipmentComponent])) {
    const equipment = EquipmentComponent.values[eid]
    if (equipment.armor !== -1) {
      const newEid = parsedWorld.serializedEntities.find(
        (a) => a.savedId === equipment.armor,
      )
      equipment.armor = newEid!.loadedId!
    }

    if (equipment.weapon !== -1) {
      const newEid = parsedWorld.serializedEntities.find(
        (a) => a.savedId === equipment.weapon,
      )
      equipment.weapon = newEid!.loadedId!
    }
  }

  const map = new Map(
    world,
    parsedWorld.width,
    parsedWorld.height,
    parsedWorld.level,
    parsedWorld.tiles,
  )

  for (const eid of query(world, [PositionComponent])) {
    const position = PositionComponent.values[eid]
    map.addEntityAtLocation(eid, position)
  }

  const log = new MessageLog()
  log.messages = parsedWorld.messages

  return {
    world,
    map,
    log,
    gameStats: parsedWorld.gameStats,
    level: parsedWorld.level,
  }
}
