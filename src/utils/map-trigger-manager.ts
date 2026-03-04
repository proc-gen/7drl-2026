import { hasComponent, query, type EntityId, type World } from 'bitecs'
import type { Map, MapTrigger } from '../map'
import type { MessageLog } from './message-log'
import type { GameStats, Vector2 } from '../types'
import {
  Colors,
  PersonalityTypes,
  STAIRS_DOWN_TILE,
  TriggerTypes,
  type TriggerType,
} from '../constants'
import {
  ActorComponent,
  InfoComponent,
  KeyComponent,
  OwnerComponent,
  RenderableComponent,
  SuitStatsComponent,
} from '../ecs/components'
import { createActor } from '../ecs/templates'
import type { GameScreen } from '../screens'

export class MapTriggerManager {
  world: World
  map: Map
  log: MessageLog
  player: EntityId
  playerFov: Vector2[]
  gameStats: GameStats
  gameScreen: GameScreen

  constructor(
    world: World,
    map: Map,
    log: MessageLog,
    player: EntityId,
    playerFov: Vector2[],
    gameStats: GameStats,
    gameScreen: GameScreen,
  ) {
    this.world = world
    this.map = map
    this.log = log
    this.player = player
    this.playerFov = playerFov
    this.gameStats = gameStats
    this.gameScreen = gameScreen
  }

  resetForNewMap() {
    const triggers = []
    switch (this.map.level) {
      case 1:
        triggers.push(TriggerTypes.L1StartLevel)
        triggers.push(TriggerTypes.L1TriggerSecurity)
        triggers.push(TriggerTypes.L1SpawnCyborg)
        triggers.push(TriggerTypes.L1SeeCyborg)
        break
      case 2:
        triggers.push(TriggerTypes.L2SpawnPickpocket)
        triggers.push(TriggerTypes.L2SeePickpocket)
        break
      case 4:
        triggers.push(TriggerTypes.L4SpawnSpecialCyborgs)
        triggers.push(TriggerTypes.L4EndLevel)
        break
      case 5:
        triggers.push(TriggerTypes.L5StartLevel)
        break
      case 6:
        triggers.push(TriggerTypes.L6SeeSentryBoss)
        break
      case 8:
        triggers.push(TriggerTypes.L8SeeBossCyborg)
        break
    }

    this.map.mapTriggers = triggers.map((t) => ({
      triggerType: t as TriggerType,
      triggerExecuted: false,
    }))
  }

  checkTriggers() {
    this.map.mapTriggers
      .filter((t) => !t.triggerExecuted)
      .forEach((t) => {
        switch (t.triggerType) {
          case TriggerTypes.L1StartLevel:
            this.processL1StartLevel(t)
            break
          case TriggerTypes.L1TriggerSecurity:
            this.processL1TriggerSecurity(t)
            break
          case TriggerTypes.L1SpawnCyborg:
            this.processL1SpawnCyborg(t)
            break
          case TriggerTypes.L1SeeCyborg:
            this.processL1SeeCyborg(t)
            break
        }
      })
  }

  processL1StartLevel(t: MapTrigger) {
    for (const eid of query(this.world, [ActorComponent])) {
      ActorComponent.values[eid].hostile = false
      RenderableComponent.values[eid].fg = Colors.Peaceful
    }
    t.triggerExecuted = true
  }

  processL1TriggerSecurity(t: MapTrigger) {
    if (this.gameStats.stepsWalked > 5) {
      t.triggerExecuted = true
    } else {
      for (const eid of query(this.world, [ActorComponent])) {
        const suitStats = SuitStatsComponent.values[eid]
        const actor = ActorComponent.values[eid]
        if (actor.personality !== PersonalityTypes.Clean) {
          if (suitStats.currentShield < suitStats.maxShield) {
            t.triggerExecuted = true
          }
        }
      }
    }

    if (t.triggerExecuted) {
      for (const eid of query(this.world, [ActorComponent])) {
        ActorComponent.values[eid].hostile = ![PersonalityTypes.Clean].includes(
          ActorComponent.values[eid].personality,
        )
        RenderableComponent.values[eid].fg = ActorComponent.values[eid].hostile
          ? Colors.Hostile
          : Colors.Peaceful
      }

      this.log.addMessage(
        'Hostile entity identified. Initiate lockdown procedure',
      )
    }
  }

  processL1SpawnCyborg(t: MapTrigger) {
    for (const eid of query(this.world, [KeyComponent])) {
      const key = KeyComponent.values[eid]
      if (key.level === this.map.level) {
        t.triggerExecuted = hasComponent(this.world, eid, OwnerComponent)
      }
    }

    if (t.triggerExecuted) {
      for (let i = 0; i < this.map.width; i++) {
        for (let j = 0; j < this.map.height; j++) {
          if (this.map.tiles[i][j].name === STAIRS_DOWN_TILE.name) {
            const cyborg = createActor(this.world, { x: i, y: j }, 'Cyborg')!
            this.map.addEntityAtLocation(cyborg, { x: i, y: j })
            this.gameScreen.actors.push(cyborg)
          }
        }
      }
    }
  }

  processL1SeeCyborg(t: MapTrigger) {
    this.playerFov.forEach((p) => {
      const entities = this.map.getEntitiesAtLocation(p)
      if (entities.length > 0) {
        entities.forEach((e) => {
          if (hasComponent(this.world, e, ActorComponent)) {
            const info = InfoComponent.values[e]
            if (info.name === 'Cyborg') {
              t.triggerExecuted = true
            }
          }
        })
      }
    })

    if (t.triggerExecuted) {
      this.log.addMessage(
        'A disfigured combination of human and machine stands between you and your way to the next floor',
      )
    }
  }
}
