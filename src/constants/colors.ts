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

  L1Wall: '#eeeeee',
  L2Wall: '#00ee00',
  L3Wall: '#0000ee',
  L4Wall: '#bb0000',
  L5Wall: '#00f0f3',
  L6Wall: '#eeeeee',
  L7Wall: '#888888',
  L8Wall: '#006600',

  L1WallChar: '#000000',
  L2WallChar: '#000000',
  L3WallChar: '#ffffff',
  L4WallChar: '#000000',
  L5WallChar: '#ffffff',
  L6WallChar: '#000000',
  L7WallChar: '#000000',
  L8WallChar: '#ffffff',

  ShieldBar: '#0000aa',
  EnergyBar: '#aaaa00',
  InspectLocation: '#00ee00',
  WarningLocation: '#eeee00',
  ErrorLocation: '#ee0000',

  Player: '#ffee00',
  Hostile: '#cf0000',
  Peaceful: '#00cf00',

  Blaster: '#00cf3f',
  LaserRifle: '#00aacf',
  EnergyRipper: '#cf6600',
  PlasmaCannon: '#cf3fff',
  Rocket: '#ffcccc',
  RocketExplode: '#ff0000',
  Disc: '#0066aa',
  FlashGrenade: '#f8f9c1',

  LightningScroll: '#aaaa00',
  BlindScroll: '#cf3fff',
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

  HealthBar: Color.fromString(Colors.ShieldBar),
  ExperienceBar: Color.fromString(Colors.EnergyBar),
  InspectLocation: Color.fromString(Colors.InspectLocation),
  WarningLocation: Color.fromString(Colors.WarningLocation),
  ErrorLocation: Color.fromString(Colors.ErrorLocation),

  Player: Color.fromString(Colors.Player),
  Blaster: Color.fromString(Colors.Blaster),

  LightningScroll: Color.fromString(Colors.LightningScroll),
  BlindScroll: Color.fromString(Colors.BlindScroll),
  FireballScroll: Color.fromString(Colors.FireballScroll),

  WeaponPickup: Color.fromString(Colors.WeaponPickup),
  ArmorPickup: Color.fromString(Colors.ArmorPickup),
  AmmunitionPickup: Color.fromString(Colors.AmmunitionPickup),
}
