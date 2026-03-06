import { Display } from 'rot-js'
import {
  createWorld,
  type World,
  type EntityId,
  query,
  hasComponent,
  removeEntity,
  Not,
} from 'bitecs'
import {
  ActionComponent,
  AnimationComponent,
  DeadComponent,
  EquipmentComponent,
  KeyComponent,
  OwnerComponent,
  PlayerComponent,
  PositionComponent,
  RemoveComponent,
} from '../ecs/components'
import {
  type RenderSystem,
  RenderEntitySystem,
  RenderHudSystem,
  RenderMapSystem,
} from '../ecs/systems/render-systems'
import {
  type UpdateSystem,
  UpdateActionSystem,
  UpdateWantAttackSystem,
  UpdateRemoveSystem,
  UpdateAiActionSystem,
  UpdateWantUseItemSystem,
  UpdateTurnsLeftSystem,
  UpdateWantCauseEffectSystem,
  UpdateAnimationSystem,
  UpdateRemoveAnimationSystem,
  UpdateWantInteractSystem,
} from '../ecs/systems/update-systems'
import { Map } from '../map'
import {
  L1FirstFloorGenerator,
  L2SecondFloorGenerator,
  L3ThirdFloorGenerator,
  L4FourthFloorGenerator,
  L5BasementGenerator,
  L6FirstFloorDestroyedGenerator,
  L7HangarGenerator,
  L8ShipGenerator,
  type Generator,
} from '../map/generators'
import type { GameStats, HandleInputInfo, Vector2 } from '../types'
import { createPlayer } from '../ecs/templates'
import { MessageLog } from '../utils/message-log'
import {
  InventoryWindow,
  MessageHistoryWindow,
  TargetingWindow,
  HelpWindow,
} from '../windows'
import { processPlayerFOV } from '../utils/fov-funcs'
import { Screen } from './screen'
import type { ScreenManager } from '../screen-manager'
import { MainMenuScreen, saveFileName } from './main-menu-screen'
import { deserializeWorld, serializeWorld } from '../serialization'
import {
  ELEVATOR_TILE,
  ItemActionTypes,
  type ItemActionType,
} from '../constants'
import { GameOverScreen } from './game-over-screen'
import { MapTriggerManager } from '../utils/map-trigger-manager'

export class GameScreen extends Screen {
  public static readonly MAP_WIDTH = 100
  public static readonly MAP_HEIGHT = 100

  world: World
  player: EntityId
  actors: EntityId[]
  currentActor: EntityId
  playerFOV: Vector2[]
  map: Map
  level: number
  log: MessageLog
  historyViewer: MessageHistoryWindow
  inventoryWindow: InventoryWindow
  targetingWindow: TargetingWindow
  helpWindow: HelpWindow
  renderSystems: RenderSystem[]
  renderHudSystem: RenderHudSystem
  renderMapSystem: RenderMapSystem
  updateSystems: UpdateSystem[]
  renderUpdateSystems: UpdateSystem[]
  removeSystem: UpdateRemoveSystem
  playerTurn: boolean
  processingMove: boolean
  gameStats: GameStats
  triggerManager: MapTriggerManager

  constructor(
    display: Display,
    manager: ScreenManager,
    saveGame: string | undefined = undefined,
  ) {
    super(display, manager)
    this.playerFOV = []
    this.actors = []

    if (saveGame !== undefined) {
      const { world, map, log, level, gameStats } = deserializeWorld(saveGame)
      this.world = world
      this.map = map
      this.log = log
      this.level = level
      this.gameStats = gameStats
    } else {
      this.world = createWorld()
      this.level = 6
      this.log = new MessageLog()
      this.map = this.generateMap()
      this.gameStats = {
        enemiesKilled: 0,
        healthPotionsDrank: 0,
        stepsWalked: 0,
        stairsDescended: 0,
        killedBy: '',
      }
    }

    this.player = (query(this.world, [PlayerComponent]) as EntityId[])[0]
    this.triggerManager = new MapTriggerManager(
      this.world,
      this.map,
      this.log,
      this.player,
      this.playerFOV,
      this.gameStats,
      this,
    )
    if (saveGame === undefined) {
      this.triggerManager.resetForNewMap()
    }
    this.postProcessMap()

    this.removeSystem = new UpdateRemoveSystem(this.map, this.log)
    this.updateSystems = [
      this.removeSystem,
      new UpdateAiActionSystem(this.map, this.player, this.log),
      new UpdateActionSystem(
        this.log,
        this.map,
        this.playerFOV,
        this.gameStats,
      ),
      new UpdateWantUseItemSystem(this.log, this.map, this.gameStats),
      new UpdateWantAttackSystem(this.log, this.gameStats, this.map),
      new UpdateWantCauseEffectSystem(this.log),
      new UpdateWantInteractSystem(
        this.log,
        this.map,
        this.gameStats,
        this.playerFOV,
      ),
      new UpdateTurnsLeftSystem(this.log, this.map, this.playerFOV),
    ]

    this.renderHudSystem = new RenderHudSystem(
      this.world,
      this.map,
      this.player,
      this.log,
      this.playerFOV,
    )

    this.renderMapSystem = new RenderMapSystem(
      this.world,
      this.map,
      this.player,
      this.playerFOV,
    )

    this.renderSystems = [
      this.renderMapSystem,
      new RenderEntitySystem(this.world, this.map, this.playerFOV),
      this.renderHudSystem,
    ]

    this.renderUpdateSystems = [
      new UpdateAnimationSystem(),
      new UpdateRemoveAnimationSystem(this.map),
    ]

    this.historyViewer = new MessageHistoryWindow(this.log)
    this.inventoryWindow = new InventoryWindow(
      this.world,
      this.player,
      this.gameStats,
    )
    this.targetingWindow = new TargetingWindow(
      this.world,
      this.log,
      this.map,
      this.player,
      this.playerFOV,
    )
    this.helpWindow = new HelpWindow()

    this.playerTurn = true
    this.processingMove = false
    this.currentActor = this.player
  }

  generateMap() {
    if (this.level > 1) {
      for (const eid of query(this.world, [OwnerComponent])) {
        if (OwnerComponent.values[eid].owner !== this.player) {
          removeEntity(this.world, eid)
        }
      }

      for (const eid of query(this.world, [Not(PlayerComponent)])) {
        if (!hasComponent(this.world, eid, OwnerComponent)) {
          removeEntity(this.world, eid)
        }
      }
    }

    const map = new Map(
      this.world,
      GameScreen.MAP_WIDTH,
      GameScreen.MAP_HEIGHT,
      this.level,
    )

    const generator = this.pickGenerator(map)

    let success = false
    do {
      generator.generate()
      if (
        map.getPath(
          generator.playerStartPosition(),
          generator.exitLocation(),
          true,
        ).length > 0 &&
        generator.isValid()
      ) {
        success = true
      }
    } while (!success)

    generator.placeEntities()
    const startPosition = generator.playerStartPosition()

    if (this.player === undefined) {
      createPlayer(this.world, startPosition)
    } else {
      PositionComponent.values[this.player].x = startPosition.x
      PositionComponent.values[this.player].y = startPosition.y
    }

    this.log.addMessage(generator.levelStartMessage())
    if (this.level > 1) {
      if (this.triggerManager === undefined) {
        this.triggerManager = new MapTriggerManager(
          this.world,
          map,
          this.log,
          this.player,
          this.playerFOV,
          this.gameStats,
          this,
        )
      }
      this.triggerManager.resetForNewMap()
    }
    return map
  }

  pickGenerator(map: Map): Generator {
    const maxMonsters = 5 + Math.floor(this.level / 2)
    const maxItems = 2 + Math.floor(this.level / 4)

    switch (this.level % 8) {
      case 2:
        return new L2SecondFloorGenerator(this.world, map)
      case 3:
        return new L3ThirdFloorGenerator(this.world, map)
      case 4:
        return new L4FourthFloorGenerator(this.world, map)
      case 5:
        return new L5BasementGenerator(this.world, map)
      case 6:
        return new L6FirstFloorDestroyedGenerator(this.world, map)
      case 7:
        return new L7HangarGenerator(
          this.world,
          map,
          maxMonsters,
          maxItems,
          { x: 80, y: 50 },
          4,
          12,
        )
      case 0:
        return new L8ShipGenerator(
          this.world,
          map,
          maxMonsters,
          maxItems,
          { x: 80, y: 50 },
          4,
          12,
        )
      case 1:
      default:
        return new L1FirstFloorGenerator(this.world, map)
    }
  }

  postProcessMap() {
    this.actors.length = 0
    this.actors.push(this.player)
    this.map.addEntityAtLocation(
      this.player,
      PositionComponent.values[this.player],
    )
    for (const eid of query(this.world, [PositionComponent])) {
      if (
        hasComponent(this.world, eid, ActionComponent) &&
        eid !== this.player
      ) {
        this.actors.push(eid)
      }
    }

    this.triggerManager.checkTriggers()
    processPlayerFOV(this.map, this.player, this.playerFOV)
  }

  render() {
    this.display.clear()

    this.renderUpdateSystems.forEach((rus) => {
      rus.update(this.world, -1)
    })

    const playerPosition = PositionComponent.values[this.player]
    this.renderMapSystem.update(this.world, -1)
    this.renderSystems.forEach((rs) => {
      rs.render(this.display, playerPosition)
    })

    if (this.targetingWindow.active) {
      this.targetingWindow.render(this.display)
    } else if (this.inventoryWindow.active) {
      this.inventoryWindow.render(this.display)
    } else if (this.historyViewer.active) {
      this.historyViewer.render(this.display)
    } else if (this.helpWindow.active) {
      this.helpWindow.render(this.display)
    }
  }

  update() {
    this.updateSystems.forEach((us) => {
      us.update(this.world, this.currentActor)
    })
    this.triggerManager.checkTriggers()
    this.actors = this.actors.filter(
      (a) =>
        !hasComponent(this.world, a, DeadComponent) ||
        !hasComponent(this.world, a, RemoveComponent),
    )
    if (!this.playerTurn) {
      this.changeCurrentActor()
    } else {
      this.changeCurrentActor()
    }
  }

  changeCurrentActor() {
    if (query(this.world, [AnimationComponent]).length > 0) {
      setTimeout(() => {
        this.changeCurrentActor()
      }, 50)
    } else {
      const action = ActionComponent.values[this.currentActor]

      if (action.actionSuccessful) {
        this.actors.push(this.actors.shift()!)
        this.currentActor = this.actors[0]
      }
      if (this.actors.length === 1) {
        this.removeSystem.update(this.world, -1)
      }

      this.playerTurn = this.currentActor === this.player
      if (!this.playerTurn) {
        this.update()
      } else {
        this.processingMove = false
      }
    }
  }

  keyDown(event: KeyboardEvent) {
    if (this.playerTurn) {
      if (hasComponent(this.world, this.player, DeadComponent)) {
        this.backToMainMenu(false)
      }

      if (!this.processingMove) {
        if (this.targetingWindow.active) {
          const inputInfo = this.targetingWindow.handleKeyboardInput(event)
          this.handleInputInfo(inputInfo)
        } else if (this.inventoryWindow.active) {
          const inputInfo = this.inventoryWindow.handleKeyboardInput(event)
          this.handleInputInfo(inputInfo)
        } else if (this.renderHudSystem.active) {
          const inputInfo = this.renderHudSystem.handleKeyboardInput(event)
          this.handleInputInfo(inputInfo)
        } else if (this.historyViewer.active) {
          const inputInfo = this.historyViewer.handleKeyboardInput(event)
          this.handleInputInfo(inputInfo)
        } else if (this.helpWindow.active) {
          this.helpWindow.handleKeyboardInput(event)
        } else {
          switch (event.key) {
            case 'ArrowUp':
              this.setPlayerAction(0, -1)
              break
            case 'ArrowDown':
              this.setPlayerAction(0, 1)
              break
            case 'ArrowLeft':
              this.setPlayerAction(-1, 0)
              break
            case 'ArrowRight':
              this.setPlayerAction(1, 0)
              break
            case ' ':
              this.setPlayerAction(0, 0)
              break
            case 'g':
              this.setPlayerAction(0, 0, true)
              break
            case 'r':
              this.setPlayerAction(
                0,
                0,
                false,
                ItemActionTypes.Reload as ItemActionType,
              )
              break
            case 'f':
              this.setPlayerAction(
                0,
                0,
                false,
                ItemActionTypes.ReloadSecondary as ItemActionType,
              )
              break
            case '1':
              this.targetingWindow.setActive(true)
              this.targetingWindow.setTargetingEntity(
                EquipmentComponent.values[this.player].rangedWeapon,
              )
              break
            case '2':
              this.targetingWindow.setActive(true)
              this.targetingWindow.setTargetingEntity(
                EquipmentComponent.values[this.player].secondaryRangedWeapon,
              )
              break
            case 'e':
              this.renderHudSystem.setActive(true)
              break
            case 'l':
              this.historyViewer.setActive(true)
              break
            case 'i':
              this.inventoryWindow.setActive(true)
              break
            case 'F1':
              this.helpWindow.setActive(true)
              break
            case 'v':
              this.tryToDescend()
              break
            case 'Escape':
              this.backToMainMenu(true)
              break
          }
        }
      }
    }
  }

  tryToDescend() {
    const playerPosition = PositionComponent.values[this.player]
    const tile = this.map.tiles[playerPosition.x][playerPosition.y]
    if (tile.exit) {
      let canDescend = false
      if (this.level < 4) {
        for (const eid of query(this.world, [KeyComponent, OwnerComponent])) {
          const key = KeyComponent.values[eid]
          if (key.level === this.level) {
            canDescend = true
          }
        }
      } else {
        canDescend = true
      }
      if (canDescend) {
        this.descend()
      } else {
        this.log.addMessage(
          'You need to find the keycard to gain security access for the next level',
        )
      }
    } else {
      if (tile.name.includes('Stairs')) {
        if ([1, 2, 3].includes(this.level)) {
          this.log.addMessage(
            'You need to go up stairs to turn off the alarm and end the building lockdown',
          )
        } else {
          this.log.addMessage(
            'You need to go back to your ship, not try and climb up a demolished building',
          )
        }
      } else if (tile.name === ELEVATOR_TILE.name) {
        if ([1, 2, 3, 4].includes(this.level)) {
          this.log.addMessage(
            "The elevator looks like it's out of service because of lockdown",
          )
        } else {
          this.log.addMessage(
            'You need to go back to your ship, not try and climb up a demolished building',
          )
        }
      } else {
        this.log.addMessage('The exit is not here')
      }
    }
    this.processingMove = false
  }

  descend() {
    this.level++
    if (this.level > 8) {
      this.backToMainMenu(false)
    } else {
      this.gameStats.stairsDescended++
      this.map.copyFromOtherMap(this.generateMap())
      this.postProcessMap()
    }
  }

  backToMainMenu(saveGame: boolean) {
    if (saveGame) {
      const serializedWorld = serializeWorld(
        this.world,
        this.map,
        this.log,
        this.gameStats,
      )

      try {
        localStorage.setItem(saveFileName, JSON.stringify(serializedWorld))
      } catch (_ex) {}

      this.manager.setNextScreen(new MainMenuScreen(this.display, this.manager))
    } else {
      this.manager.setNextScreen(
        new GameOverScreen(this.display, this.manager, this.gameStats),
      )
    }
  }

  mouseMove(event: MouseEvent | WheelEvent) {
    if (this.playerTurn) {
      if (this.targetingWindow.active) {
        const inputInfo = this.targetingWindow.handleMouseInput(
          event,
          this.getMousePosFromEvent(event),
        )
        this.handleInputInfo(inputInfo)
      } else if (this.inventoryWindow.active) {
        const inputInfo = this.inventoryWindow.handleMouseInput(
          event,
          this.getMousePosFromEvent(event),
        )
        this.handleInputInfo(inputInfo)
      } else if (this.renderHudSystem.active) {
        const inputInfo = this.renderHudSystem.handleMouseInput(
          event,
          this.getMousePosFromEvent(event),
        )
        this.handleInputInfo(inputInfo)
      } else if (this.historyViewer.active) {
        const inputInfo = this.historyViewer.handleMouseInput(
          event as WheelEvent,
          this.getMousePosFromEvent(event),
        )
        this.handleInputInfo(inputInfo)
      }
    }
  }

  handleInputInfo(inputInfo: HandleInputInfo) {
    if (inputInfo.needUpdate) {
      if (inputInfo.finishTurn !== undefined && inputInfo.finishTurn) {
        this.changeCurrentActor()
      }
      this.inventoryWindow.setActive(false)
      this.targetingWindow.setActive(false)
      this.historyViewer.setActive(false)
      this.renderHudSystem.setActive(false)
      this.helpWindow.setActive(false)
      this.update()
    } else if (inputInfo.needTargeting !== undefined) {
      this.targetingWindow.setActive(true)
      this.targetingWindow.setTargetingEntity(inputInfo.needTargeting)
    }
  }

  getMousePosFromEvent(event: MouseEvent) {
    const mousePosition = this.display.eventToPosition(event)
    return { x: mousePosition[0], y: mousePosition[1] }
  }

  setPlayerAction(
    xOffset: number,
    yOffset: number,
    pickUpItem: boolean = false,
    itemActionType: ItemActionType | undefined = undefined,
  ) {
    this.processingMove = true

    const action = ActionComponent.values[this.player]
    action.xOffset = xOffset
    action.yOffset = yOffset
    action.pickUpItem = pickUpItem
    action.itemActionType = pickUpItem
      ? (ItemActionTypes.PickUp as ItemActionType)
      : itemActionType
    if (itemActionType === ItemActionTypes.Reload) {
      action.useItem = EquipmentComponent.values[this.player].rangedWeapon
    } else if (itemActionType === ItemActionTypes.ReloadSecondary) {
      action.useItem =
        EquipmentComponent.values[this.player].secondaryRangedWeapon
    }
    action.processed = false

    this.update()
  }
}
