import { RNG } from 'rot-js'

export const getRandomNumber = (min: number, max: number) => {
  return RNG.getUniformInt(min, max)
}

export const shuffle = <T>(items: T[]): T[] => {
  let n: number = items.length
  while (n > 1) {
    n--
    let k: number = getRandomNumber(0, n + 1)
    let item: T = items[k]
    items[k] = items[n]
    items[n] = item
  }
  return items
}
