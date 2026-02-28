import { Colors } from '../constants/colors'
import type { Message } from '../types'

export class MessageLog {
  messages: Message[]

  constructor() {
    this.messages = []
  }

  addMessage(
    text: string,
    fg: string = Colors.White,
    bg: string | null = null,
  ) {
    this.messages.push({ text, fg, bg })
  }
}
