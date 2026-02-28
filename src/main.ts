import { ScreenManager } from './screen-manager'

const runGame = () => {
  const screenManager = new ScreenManager()

  const container = screenManager.display.getContainer()!
  document.getElementById('game-window')?.appendChild(container)

  setInterval(() => {
    screenManager.render()
  }, 50)
}

window.addEventListener('DOMContentLoaded', () => {
  runGame()
})
