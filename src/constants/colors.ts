import { Color } from 'rot-js'

export const Colors = {
  White: '#ffffff',
  Black: '#000000',
  Ambient: '#333333',
  LightGrey: '#999999',
  MediumGrey: '#666666',
  DarkGrey: '#444444',
  VeryDarkGrey: '#222222',
  DarkRed: '#660000',

  Stairs: '#009fff',
  Door: '#cb8553',

  HealthBar: '#aa0000',
  ExperienceBar: '#aaaa00',
  InspectLocation: '#00ee00',
  WarningLocation: '#eeee00',
  ErrorLocation: '#ee0000',

  Player: '#ffee00',
  Orc: '#7fbf7f',
  Troll: '#00af00',
  Goblin: '#00cf3f',

  LightningScroll: '#aaaa00',
  ConfusionScroll: '#cf3fff',
  FireballScroll: '#ff0000',

  WeaponPickup: '#00bfff',
  ArmorPickup: '#8b4513',
  AmmunitionPickup: '#009f9f',
}

export const HexColors = {
  White: Color.fromString(Colors.White),
  Black: Color.fromString(Colors.Black),
  Ambient: Color.fromString(Colors.Ambient),
  LightGrey: Color.fromString(Colors.LightGrey),
  MediumGrey: Color.fromString(Colors.MediumGrey),
  DarkGrey: Color.fromString(Colors.DarkGrey),
  VeryDarkGrey: Color.fromString(Colors.VeryDarkGrey),
  DarkRed: Color.fromString(Colors.DarkRed),

  Stairs: Color.fromString(Colors.Stairs),
  Door: Color.fromString(Colors.Door),

  HealthBar: Color.fromString(Colors.HealthBar),
  ExperienceBar: Color.fromString(Colors.ExperienceBar),
  InspectLocation: Color.fromString(Colors.InspectLocation),
  WarningLocation: Color.fromString(Colors.WarningLocation),
  ErrorLocation: Color.fromString(Colors.ErrorLocation),

  Player: Color.fromString(Colors.Player),
  Orc: Color.fromString(Colors.Orc),
  Troll: Color.fromString(Colors.Troll),
  Goblin: Color.fromString(Colors.Goblin),

  LightningScroll: Color.fromString(Colors.LightningScroll),
  ConfusionScroll: Color.fromString(Colors.ConfusionScroll),
  FireballScroll: Color.fromString(Colors.FireballScroll),

  WeaponPickup: Color.fromString(Colors.WeaponPickup),
  ArmorPickup: Color.fromString(Colors.ArmorPickup),
  AmmunitionPickup: Color.fromString(Colors.AmmunitionPickup),
}
