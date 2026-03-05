import {
  addComponent,
  hasComponent,
  query,
  type EntityId,
  type World,
} from 'bitecs'
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
  BlindComponent,
  FieldOfViewComponent,
  InfoComponent,
  KeyComponent,
  OwnerComponent,
  PositionComponent,
  RenderableComponent,
  SuitStatsComponent,
} from '../ecs/components'
import { createActor, createAnimation } from '../ecs/templates'
import type { GameScreen } from '../screens'
import { add, distance, equal } from './vector-2-funcs'

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
      case 3:
        triggers.push(TriggerTypes.L3SeeExplodingSpider)
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
        triggers.push(TriggerTypes.L6KilledSentryBoss)
        break
      case 8:
        triggers.push(TriggerTypes.L8SeeBossCyborg)
        triggers.push(TriggerTypes.L8KilledBossCyborg)
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
          case TriggerTypes.L2SpawnPickpocket:
            this.processL2SpawnPickpocket(t)
            break
          case TriggerTypes.L2SeePickpocket:
            this.processL2SeePickpocket(t)
            break
          case TriggerTypes.L3SeeExplodingSpider:
            this.processL3SeeExplodingSpider(t)
            break
          case TriggerTypes.L4SpawnSpecialCyborgs:
            this.processL4SpawnSpecialCyborgs(t)
            break
          case TriggerTypes.L4EndLevel:
            this.processL4EndLevel(t)
            break
          case TriggerTypes.L5StartLevel:
            this.processL5StartLevel(t)
            break
          case TriggerTypes.L6SeeSentryBoss:
            this.processL6SeeSentryBoss(t)
            break
          case TriggerTypes.L6KilledSentryBoss:
            this.processL6KilledSentryBoss(t)
            break
          case TriggerTypes.L8SeeBossCyborg:
            this.processL8SeeBossCyborg(t)
            break
          case TriggerTypes.L8KilledBossCyborg:
            this.processL8KilledBossCyborg(t)
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
      const cyborg = createActor(this.world, this.map.exitPosition, 'Cyborg')!
      this.map.addEntityAtLocation(cyborg, this.map.exitPosition)
      this.gameScreen.actors.push(cyborg)

      for (let x = 0; x < this.map.width; x++) {
        for (let y = 0; y < this.map.height; y++) {
          if (
            !equal({ x, y }, this.map.exitPosition) &&
            this.map.getEntitiesAtLocation({ x, y }).find((a) => a === cyborg)
          ) {
            this.map.removeEntityAtLocation(cyborg, { x, y })
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
            if (
              info.name === 'Cyborg' &&
              distance(p, PositionComponent.values[this.player]) <= 6
            ) {
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

  processL2SpawnPickpocket(t: MapTrigger) {
    for (const eid of query(this.world, [KeyComponent])) {
      const key = KeyComponent.values[eid]
      if (key.level === this.map.level) {
        t.triggerExecuted = hasComponent(this.world, eid, OwnerComponent)
      }
    }

    if (t.triggerExecuted) {
      const pickpocket = createActor(
        this.world,
        this.map.exitPosition,
        'Pickpocket Bot',
      )!
      this.map.addEntityAtLocation(pickpocket, this.map.exitPosition)
      this.gameScreen.actors.push(pickpocket)
      for (let x = 0; x < this.map.width; x++) {
        for (let y = 0; y < this.map.height; y++) {
          if (
            !equal({ x, y }, this.map.exitPosition) &&
            this.map
              .getEntitiesAtLocation({ x, y })
              .find((a) => a === pickpocket)
          ) {
            this.map.removeEntityAtLocation(pickpocket, { x, y })
          }
        }
      }
    }
  }

  processL2SeePickpocket(t: MapTrigger) {
    this.playerFov.forEach((p) => {
      const entities = this.map.getEntitiesAtLocation(p)
      if (entities.length > 0) {
        entities.forEach((e) => {
          if (hasComponent(this.world, e, ActorComponent)) {
            const info = InfoComponent.values[e]
            if (
              info.name === 'Pickpocket Bot' &&
              distance(p, PositionComponent.values[this.player]) <= 6
            ) {
              t.triggerExecuted = true
            }
          }
        })
      }
    })

    if (t.triggerExecuted) {
      this.log.addMessage(
        'You see a bot in the distance. It appears unarmed, but the overflowing junk coming from its makes you wary as it approaches you',
      )
    }
  }

  processL3SeeExplodingSpider(t: MapTrigger) {
    this.playerFov.forEach((p) => {
      const entities = this.map.getEntitiesAtLocation(p)
      if (entities.length > 0) {
        entities.forEach((e) => {
          if (hasComponent(this.world, e, ActorComponent)) {
            const info = InfoComponent.values[e]
            if (
              info.name === 'Exploding Spider' &&
              distance(p, PositionComponent.values[this.player]) <= 6
            ) {
              t.triggerExecuted = true
            }
          }
        })
      }
    })

    if (t.triggerExecuted) {
      this.log.addMessage(
        'Who thought it would be a good idea to make little mechanical spiders? Also, why are they ticking?',
      )
    }
  }

  processL4SpawnSpecialCyborgs(t: MapTrigger) {
    let endLocation = undefined
    this.playerFov.forEach((p) => {
      const tile = this.map.tiles[p.x][p.y]
      if (tile.name === STAIRS_DOWN_TILE.name) {
        t.triggerExecuted = true
        endLocation = p
      }
    })

    if (t.triggerExecuted && endLocation !== undefined) {
      const cyborgA = createActor(this.world, endLocation, 'Special Cyborg')!
      const cyborgB = createActor(
        this.world,
        add(endLocation, { x: 1, y: 0 }),
        'Special Cyborg',
      )!
      this.map.addEntityAtLocation(cyborgA, endLocation)
      this.gameScreen.actors.push(cyborgA)
      this.map.addEntityAtLocation(cyborgB, add(endLocation, { x: 1, y: 0 }))
      this.gameScreen.actors.push(cyborgB)
      for (let x = 0; x < this.map.width; x++) {
        for (let y = 0; y < this.map.height; y++) {
          if (
            !equal({ x, y }, endLocation) &&
            this.map.getEntitiesAtLocation({ x, y }).find((a) => a === cyborgA)
          ) {
            this.map.removeEntityAtLocation(cyborgA, { x, y })
          }

          if (
            !equal({ x, y }, add(endLocation, { x: 1, y: 0 })) &&
            this.map.getEntitiesAtLocation({ x, y }).find((a) => a === cyborgB)
          ) {
            this.map.removeEntityAtLocation(cyborgB, { x, y })
          }
        }
      }
    }
  }

  processL4EndLevel(t: MapTrigger) {
    const playerPosition = PositionComponent.values[this.player]
    if (
      this.map.tiles[playerPosition.x][playerPosition.y].name ===
      STAIRS_DOWN_TILE.name
    ) {
      t.triggerExecuted = true
    } else {
      let specialCyborgAliveCount = 0
      for (const eid of query(this.world, [ActorComponent])) {
        const info = InfoComponent.values[eid]
        if (info.name === 'Special Cyborg') {
          specialCyborgAliveCount++
        }
      }

      t.triggerExecuted = specialCyborgAliveCount === 0
    }

    if (t.triggerExecuted) {
      this.gameScreen.descend()
    }
  }

  processL5StartLevel(t: MapTrigger) {
    t.triggerExecuted = true

    for (const eid of query(this.world, [SuitStatsComponent])) {
      addComponent(this.world, eid, BlindComponent)
      BlindComponent.values[eid] = { turnsLeft: 10 }
      const fov = FieldOfViewComponent.values[eid]
      fov.currentFOV = Math.floor(0.1 * fov.baseFOV)
      createAnimation(
        this.world,
        this.map,
        -1,
        PositionComponent.values[eid],
        'Flash Grenade',
        undefined,
        PositionComponent.values[eid],
      )
    }

    this.log.addMessage(
      "The building crashing down sure didn't do anything to help your vision",
    )
  }

  processL6SeeSentryBoss(t: MapTrigger) {
    this.playerFov.forEach((p) => {
      const entities = this.map.getEntitiesAtLocation(p)
      if (entities.length > 0) {
        entities.forEach((e) => {
          if (hasComponent(this.world, e, ActorComponent)) {
            const info = InfoComponent.values[e]
            if (
              info.name === 'Sentry Boss' &&
              distance(p, PositionComponent.values[this.player]) <= 10
            ) {
              t.triggerExecuted = true
            }
          }
        })
      }
    })

    if (t.triggerExecuted) {
      this.log.addMessage(
        'Intruder still alive. Termination protocol theta initiated',
      )
    }
  }

  processL6KilledSentryBoss(t: MapTrigger) {
    let sentryBossAliveCount = 0
    for (const eid of query(this.world, [ActorComponent])) {
      const info = InfoComponent.values[eid]
      if (info.name === 'Sentry Boss') {
        sentryBossAliveCount++
      }
    }

    t.triggerExecuted = sentryBossAliveCount === 0

    if (t.triggerExecuted) {
      this.log.addMessage(
        'After an arduous battle with the gigantic sentry bot, it looks like you might finally be able to return to your ship',
      )
    }
  }

  processL8SeeBossCyborg(t: MapTrigger) {
    this.playerFov.forEach((p) => {
      const entities = this.map.getEntitiesAtLocation(p)
      if (entities.length > 0) {
        entities.forEach((e) => {
          if (hasComponent(this.world, e, ActorComponent)) {
            const info = InfoComponent.values[e]
            if (
              info.name === 'Boss Cyborg' &&
              distance(p, PositionComponent.values[this.player]) <= 10
            ) {
              t.triggerExecuted = true
            }
          }
        })
      }
    })

    if (t.triggerExecuted) {
      this.log.addMessage(
        "Apparently there's still one more cyborg that needs cleaned up to finish this security inspection and head back to base",
      )
    }
  }

  processL8KilledBossCyborg(t: MapTrigger) {
    let sentryBossAliveCount = 0
    for (const eid of query(this.world, [ActorComponent])) {
      const info = InfoComponent.values[eid]
      if (info.name === 'Boss Cyborg') {
        sentryBossAliveCount++
      }
    }

    t.triggerExecuted = sentryBossAliveCount === 0

    if (t.triggerExecuted) {
      this.gameScreen.descend()
    }
  }
}
