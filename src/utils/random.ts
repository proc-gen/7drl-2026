import { RNG } from 'rot-js'

export const getRandomNumber = (min: number, max: number) => {
  return RNG.getUniformInt(min, max)
}
