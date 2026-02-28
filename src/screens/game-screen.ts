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
  UpdateWantCauseSpellEffectSystem,
  UpdateAnimationSystem,
  UpdateRemoveAnimationSystem,
} from '../ecs/systems/update-systems'
import { Map } from '../map'
import {
  CellularGenerator,
  DefaultGenerator,
  DefaultGeneratorV2,
  DungeonGenerator,
  MazeGenerator,
  type Generator,
} from '../map/generators'
import type { GameStats, HandleInputInfo, Vector2 } from '../types'
import { createPlayer } from '../ecs/templates'
import { MessageLog } from '../utils/message-log'
import {
  InventoryWindow,
  MessageHistoryWindow,
  TargetingWindow,
  LevelUpWindow,
  HelpWindow,
} from '../windows'
import { processPlayerFOV } from '../utils/fov-funcs'
import { Screen } from './screen'
import type { ScreenManager } from '../screen-manager'
import { MainMenuScreen } from './main-menu-screen'
import { deserializeWorld, serializeWorld } from '../serialization'
import { ItemActionTypes, type ItemActionType } from '../constants'
import { getRandomNumber } from '../utils/random'
import { GameOverScreen } from './game-over-screen'

export class GameScreen extends Screen {
  public static readonly MAP_WIDTH = 80
  public static readonly MAP_HEIGHT = 45

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
  levelUpWindow: LevelUpWindow
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

  constructor(
    display: Display,
    manager: ScreenManager,
    saveGame: string | undefined = undefined,
  ) {
    super(display, manager)
    this.playerFOV = []
    this.actors = []

    if (saveGame !== undefined) {
      localStorage.removeItem('rogue-save')
      const { world, map, log, level, gameStats } = deserializeWorld(saveGame)
      this.world = world
      this.map = map
      this.log = log
      this.level = level
      this.gameStats = gameStats

      this.log.addMessage('Welcome back, adventurer...')
    } else {
      this.world = createWorld()
      this.level = 1
      this.log = new MessageLog()
      this.map = this.generateMap()
      this.gameStats = {
        enemiesKilled: 0,
        healthPotionsDrank: 0,
        stepsWalked: 0,
        stairsDescended: 0,
        killedBy: ''
      }
    }

    this.player = (query(this.world, [PlayerComponent]) as EntityId[])[0]

    this.postProcessMap()

    this.removeSystem = new UpdateRemoveSystem(this.map)
    this.updateSystems = [
      this.removeSystem,
      new UpdateAiActionSystem(this.map, this.player),
      new UpdateActionSystem(this.log, this.map, this.playerFOV, this.gameStats),
      new UpdateWantUseItemSystem(this.log, this.map, this.gameStats),
      new UpdateWantAttackSystem(this.log, this.gameStats),
      new UpdateWantCauseSpellEffectSystem(this.log),
      new UpdateTurnsLeftSystem(this.log),
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
    this.inventoryWindow = new InventoryWindow(this.world, this.player, this.gameStats)
    this.targetingWindow = new TargetingWindow(
      this.world,
      this.log,
      this.map,
      this.player,
      this.playerFOV,
    )
    this.levelUpWindow = new LevelUpWindow(this.world, this.log, this.player)
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
          generator.stairsLocation(),
          true,
        ).length > 0 &&
        generator.isValid()
      ) {
        success = true
      }
    } while (!success)

    generator.placeEntities()
    const startPosition = generator.playerStartPosition()

    if (this.level === 1) {
      createPlayer(this.world, startPosition)
      this.log.addMessage('Welcome to your doom, adventurer...')
    } else {
      this.log.addMessage('You journey closer to your doom, adventurer...')
      PositionComponent.values[this.player].x = startPosition.x
      PositionComponent.values[this.player].y = startPosition.y
    }

    return map
  }

  pickGenerator(map: Map): Generator {
    const maxRooms = 8 + Math.floor(this.level / 2)
    const maxMonsters = 5 + Math.floor(this.level / 2)
    const maxItems = 2 + Math.floor(this.level / 4)

    const pick = getRandomNumber(0, 4)

    if (pick === 0) {
      return new DefaultGenerator(
        this.world,
        map,
        maxRooms,
        5,
        12,
        maxMonsters,
        maxItems,
      )
    } else if (pick === 1) {
      return new DefaultGeneratorV2(
        this.world,
        map,
        maxRooms,
        5,
        12,
        maxMonsters,
        maxItems,
      )
    } else if (pick === 2) {
      return new MazeGenerator(this.world, map, maxMonsters, maxItems, {
        x: maxRooms * 2,
        y: maxRooms * 2,
      })
    } else if (pick === 3) {
      return new CellularGenerator(this.world, map, maxMonsters, maxItems, {
        x: maxRooms * 2,
        y: maxRooms * 2,
      })
    } else {
      return new DungeonGenerator(
        this.world,
        map,
        maxMonsters,
        maxItems,
        {
          x: maxRooms * 2,
          y: maxRooms * 2,
        },
        5,
        12,
      )
    }
  }

  postProcessMap() {
    processPlayerFOV(this.map, this.player, this.playerFOV)

    this.actors.length = 0
    this.actors.push(this.player)

    for (const eid of query(this.world, [PositionComponent])) {
      const position = PositionComponent.values[eid]
      this.map.addEntityAtLocation(eid, { x: position.x, y: position.y })

      if (
        hasComponent(this.world, eid, ActionComponent) &&
        eid !== this.player
      ) {
        this.actors.push(eid)
      }
    }
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

    if (this.levelUpWindow.active) {
      this.levelUpWindow.render(this.display)
    } else if (this.targetingWindow.active) {
      this.targetingWindow.render(this.display)
    } else if (this.inventoryWindow.active) {
      this.inventoryWindow.render(this.display)
    } else if (this.historyViewer.active) {
      this.historyViewer.render(this.display)
    } else if (this.helpWindow.active){
      this.helpWindow.render(this.display)
    }
  }

  update() {
    this.updateSystems.forEach((us) => {
      us.update(this.world, this.currentActor)
    })

    this.actors = this.actors.filter(
      (a) =>
        !hasComponent(this.world, a, DeadComponent) ||
        !hasComponent(this.world, a, RemoveComponent),
    )
    if (!this.playerTurn) {
      this.changeCurrentActor()
    } else {
      const playerStats = PlayerComponent.values[this.player]
      if (playerStats.currentXp >= playerStats.experienceToNextLevel) {
        this.levelUpWindow.setActive(true)
      } else {
        this.changeCurrentActor()
      }
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

      if (this.levelUpWindow.active) {
        const inputInfo = this.levelUpWindow.handleKeyboardInput(event)
        this.handleInputInfo(inputInfo)
      } else if (!this.processingMove) {
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
            case 't':
              this.targetingWindow.setActive(true)
              this.targetingWindow.setTargetingEntity(
                EquipmentComponent.values[this.player].weapon,
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
    if (tile.name === 'Stairs Down') {
      this.level++
      this.gameStats.stairsDescended++
      this.map.copyFromOtherMap(this.generateMap())
      this.postProcessMap()
    } else {
      this.log.addMessage('The stairs are not here')
    }
    this.processingMove = false
  }

  backToMainMenu(saveGame: boolean) {
    if (saveGame) {
      const serializedWorld = serializeWorld(this.world, this.map, this.log, this.gameStats)

      try {
        localStorage.setItem('rogue-save', JSON.stringify(serializedWorld))
      } catch (ex) {
        console.log(ex)
      }

      this.manager.setNextScreen(new MainMenuScreen(this.display, this.manager))
    } else {
      this.manager.setNextScreen(new GameOverScreen(this.display, this.manager, this.gameStats))
    }
  }

  mouseMove(event: MouseEvent | WheelEvent) {
    if (this.playerTurn) {
      if (this.levelUpWindow.active) {
        const inputInfo = this.levelUpWindow.handleMouseInput(
          event,
          this.getMousePosFromEvent(event),
        )
        this.handleInputInfo(inputInfo)
      } else if (this.targetingWindow.active) {
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
      this.levelUpWindow.setActive(false)
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
      action.useItem = EquipmentComponent.values[this.player].weapon
    }
    action.processed = false

    this.update()
  }
}
