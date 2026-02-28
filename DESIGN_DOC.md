# Routine Inspection RL - Game Design Doc

## Premise

You've just arrived at a research facility on Pluto. Immediately upon entering, the building goes into lockdown with no way out.

## Character

Armed with a special suit, it links up to any energy based weapons automatically. You're also protected by a shield that it emits. When the shield goes down, so do you.

## Upgrades

Not a strict leveling up of the character, but perks will come from using various weapons to kill enemies. Probably a Fibonacci adjacent kill count like 3, 6, 9, 15, 24, 39

### Single Target Guns

- Level 1: +5% damage
- Level 2: +10% damage
- Level 3: 25% chance to fire additional shot
- Level 4: +20% damage
- Level 5: 50% chance to fire additional shot

### Thrown Weapons

- Level 1: +5% damage
- Level 2: +10% damage
- Level 3: Splash radius increased by 1
- Level 4: +20% damage
- Level 5: Splash radius increased by 1

### Explosive Weapons

- Level 1: +5% damage
- Level 2: +10% damage
- Level 3: Splash radius increased by 1
- Level 4: +20% damage
- Level 5: Knockback power increased by 1

### Melee

- Level 1: +10% damage
- Level 2: +20% damage
- Level 3: 1 less energy for attack
- Level 4: +40% damage
- Level 5: 2 less energy for attack

## Levels

- Elevator: E
- Stairs Up: ▲
- Stairs Down: ▼
- Closed Door: +
- Open Door: \
- Wall: X

### First Floor

Player starts in a security check-in area. Sentry bots are at the checkpoint. Once through, they can explore areas like security offices, the cafeteria, and shipments area. More sentry bots are dispersed in all these areas. Elevators to the upper floors are shut down, and the stairs are locked. In the security offices, a wounded soldier will have the key to go to the next floor. When getting back to the stairs, a cyborg human will burst out of the stairwell.

#### Generation

- Start with 80x50 map
- Divide sections of the map
  - One side is Shipments and Security
  - Other side is Cafeteria and Kitchen
  - Center hallway has stairs and elevator
- Shipments and Security
  - Base size is 40x40
  - Larger central room with a series of smaller rooms along the outside
  - Boxes are all over in a maze-like fashion in the middle of the larger room
  - Some smaller rooms have boxes
  - At least 2 smaller rooms are offices
- Cafeteria and Kitchen
  - Base size is 30x50
  - Bigger main room with lots of tables and chairs
  - Decent sized room in the back for the kitchen
  - 2-3 rooms towards the front for private meeting and eating
- Center Hallway
  - Elevator and stairs at the back
  - Connections to both other main areas
  - Security checkpoint at entrance to the south

#### Items Available

- Laser Rifle
- Exploding Discs
- Robotic Remnants
- Level 2 Access Keycard

#### Enemies

- Sentry Bot
- Cyborg / Damaged Cyborg

### Second Floor

Player is thrown into a large area of cubicles where computer research used to happen. There's also a prototype lab where technical projects from level 3 are demoed. The level is a 70/30 mix of Sentry Bots and Cyborgs. The access card for the next level could be hidden anywhere. After finding the card, the Pickpocket Bot will spawn near the elevators.

#### Generation

- Start with 80x50 map
- Match elevator and stair locations to the first floor
- Make a maze of cubicles
  - Start with a point grid with everything separated by one point
  - When a maze connection is made, connect those cubes
  - At the end, if a cube is can't connect to the outside, remove it
  - Cubes are 4x4 blocks and always open towards an empty block
- At the southeast and southwest corners, make some rooms that are 10-15 on each side
  - These are the prototype labs
  - Make some U-shaped tables in the rooms with another table in the middle with a demo
  - Each room is guaranteed to have a security crate

#### Items Available

- Laser Rifle
- Exploding Discs
- Energy Ripper
- Beam Saw
- Energy to Shield Converter
- Robotic Remnants
- Level 3 Access Keycard

#### Enemies

- Sentry Bot
- Cyborg / Damaged Cyborg
- Pickpocket Bot

### Third Floor

The fun research floor, even if ASCII makes it hard to display. Larger rooms similar to the prototype lab are all over. The floor is also infested with exploding mechanical spiders.

#### Generation

- Start with 80x50 map
- Match elevator and stair locations to the first floor
- Make a tic-tac-toe board of hallways 3-4 spaces wide
- BSP Interior for the non-hallway sections
- Use weird characters for the science experiments

#### Items Available

- Laser Rifle
- Exploding Discs
- Energy Ripper
- Rocket Launcher
- Plasma Cannon
- Beam Saw
- Robotic Remnants
- Level 4 Access Card

#### Enemies

- Sentry Bot
- Cyborg / Damaged Cyborg
- Exploding Spider

### Fourth Floor

A bunch of offices with desks. In a larger one, the building director will be wounded with the boss cyborg and two special cyborgs. The boss cyborg will escape, and after the special cyborgs are killed the building will collapse and send the player to the next level.

#### Generation

- Start with 80x50 map
- Match elevator and stair locations to the first floor
- Divide level into 4 quadrants with hallways 3-4 spaces wide
- Each quadrant gets a semi-large room in the outermost corner, 8-10 per side
- Make a maze of the rest of the quadrant, then randomly place some smaller 5-6 per side rooms
- Boss room can be any one of the bigger quadrant rooms

#### Items Available

- Laser Rifle
- Exploding Discs
- Energy Ripper
- Rocket Launcher
- Plasma Cannon
- Beam Saw
- Robotic Remnants

#### Enemies

- Sentry Bot
- Cyborg / Damaged Cyborg
- Special Cyborg
- Boss Cyborg

### Basement

This is where manufacturing happens, though now it's really just a conglomeration of all the above floors with no rhyme or reason to how things are situated. No sign of the boss cyborg from the top floor, but with the building in its current state, egress needs to happen sooner rather than later.

#### Generation

- Start with 80x50 map
- Match elevator and stair locations to the first floor
- Make a cellular map
- Randomly place 5x5 sections of the above 4 floors across the map

#### Items Available

- Laser Rifle
- Exploding Discs
- Energy Ripper
- Rocket Launcher
- Plasma Cannon
- Beam Saw
- Exploding RC Car
- Robotic Remnants

#### Enemies

- Sentry Bot
- Cyborg / Damaged Cyborg
- Exploding Spiders
- Pickpocket Bot

### First Floor Post Collapse

Like the basement, most of the first floor has been demolished. Rubble and debris are all that stand between you and getting to the hangar now that the lockdown has been lifted. Except for an extra large Sentry Bot hovering in front of the security checkpoint, and all the other enemies that have been tossed around.

#### Generation

- Start with the original form of level 1
- Add a bunch of debris and randomly picked sections of the above 3 floors
- Ensure that a path still exists to the security checkpoint from the beginning of the game

#### Items Available

- Laser Rifle
- Exploding Discs
- Energy Ripper
- Rocket Launcher
- Plasma Cannon
- Beam Saw
- Robotic Remnants

#### Enemies

- Sentry Bot
- Cyborg / Damaged Cyborg
- Exploding Spiders
- Pickpocket Bot
- Boss Sentry Bot

### Hangar

Hallway empties out into a large area for ships.

#### Generation

- Start with 80x50 map
- Make a large arena area with some 2x2 pillar walls in a patterned fashion for support
- Randomly place some diamonds and trapezoids for ships
- Color the destination ship something unique

#### Items Available

- Laser Rifle
- Exploding Discs
- Energy Ripper
- Rocket Launcher
- Plasma Cannon
- Beam Saw
- Robotic Remnants

#### Enemies

- Cyborg / Damaged Cyborg
- Special Cyborg
- Exploding Spiders

### Your Ship

Just when you thought you'd escaped the madness, you find yourself face to face with the Boss Cyborg for the final battle.

#### Generation

- Start with a 40x40 map
- String together a series of rooms that have an octagon at the center
- Boss cannot be in the octagon starting room or any room directly adjacent to it

#### Items Available

- Energy Chargers

#### Enemies

- Boss Cyborg

## Weapons

### Blaster - b

Standard issue pistol that uses suit energy to fire

- 1 shot per turn
- 5 damage per shot
- 1 energy per shot
- 6 max distance

### Laser Rifle - l

Higher powered rifle that will pierce through all targets in a line

- 1 shot per turn
- 15 damage per shot
- 3 energy per shot
- No max distance

### Exploding Discs - d

Thrown projectile that can bounce off walls

- 1 shot per turn
- 15 damage per throw, splash damage of radius 2
- Sucks enemies in towards center of explosion on hit
- No energy, physical projectiles required in inventory
- 12 max distance
- 10 max in inventory

### Energy Ripper - e

Shoots energy rounds in short bursts

- 3 shots per turn
- 7 damage per shot
- 2 energy per shot
- 8 max distance

### Rocket Launcher - r

Because bigger explosions are always better

- 1 shot every other turn (Requires reload)
- 50 damage per shot, splash damage radius of 3
- Knockback of 1 from center of explosion
- No energy, physical projectiles required in inventory
- 10 max distance
- 8 max in inventory

### Plasma Cannon - p

Energy explosions are cool too

- 1 shot every other turn (Requires recharge)
- 35 damage per shot, splash radius of 2
- Knockback of 1 from center of explosion
- 10 energy per shot
- 10 max distance

### Beam Saw - s

For when they get too close

- Melee only
- 25 damage
- 4 energy per use

### Flash Grenade - f

Sometimes you need to run some recon

- Single use item
- 10 damage, splash damage radius of 2
- Blinds everyone within a radius of 5 for 3 turns, scales vision back by 20% per turn
- Inventory item, no energy required
- 10 max distance
- 10 max in inventory

## Pickups

### Robotic Remnants - %

Left behind after killing a mechanical enemy. Can be used to replenish a small amount of energy or shield

### Keycards - ▄

Used for access to various places throughout the building

### Energy to Shield Converter - æ

Converts Energy to Shield at a 2:1 ratio

## Interactibles

### Security Crate - |s|

These are where you'll find pickups like weapon and everything else catered to the specific level

### Randomness Crate - |?|

This box can give a full boost to energy and shield, it can replace your equipped weapon entirely, and many other options. The choice is entirely up to the crate

### Energy Station - |$|

These devices will be able to restore a set amount of energy to your suit

## Enemies

### Sentry Bot - Θ

Base enemy. Very weak

- 15 health
- Can move 2 spaces per turn
- 2 damage per shot
- 3 max weapon distance
- 10 view distance

### Cyborg - Σ

Tanky enemy, but low damage

- 40 health
- Can move 1 space per turn
- Shoots 3 round burst, 2 damage per shot
- 4 max weapon distance
- 10 view distance
- On death, 25% chance to become Damaged Cyborg

### Damaged Cyborg - σ

Last gasp of a cyborg. It's the torso and head still functioning enough to use a gun

- 10 health
- Can't move
- Shoots 3 round burst, 2 damage per shot
- 4 max weapon distance

### Pickpocket Bot - π

Extremely tanky and fast, but doesn't attack anything

- 60 health
- Can move 2 spaces per turn
- Will steal 1 item from the player and then run away
  - Will not steal a level critical item like keycards
- 10 view distance
- On death, 10 splash damage in a radius of 2
  - Also drops stolen item

### Exploding Spider - *

Tiny and annoying. Weak by themselves, but murderous in groups

- 5 health
- Can move 2 spaces per turn
- Can't attack from range, but will explode when in range of the player
- Death explosion does 5 damage in a radius of 2
- Does not drop robotic remnants on death

### Sweeper - δ

Not initially hostile. Will try to clean up robotic remnants if they remain on the ground for more than 10 turns

- 100 health
- Can move 1 space per turn
- If attacked, all enemies in FOV of the hit get a permanent 20% boost to stats
- On kill, counts as 3 towards an upgrade path
- Cannot be targeted while powered down

### Special Cyborg - φ

Like the boss, but not quite there.

- 100 health
- Can move 1 space per turn
- Can fire 3 round burst of 3 damage per shot
- Can fire explosive shot for 10 damage, but takes 2 turns to reload
- 12 view distance
- 4 max weapon distance for burst and 6 for explosive shot

### Boss Cyborg - Ω

The tank. The damage. He is boss.

- 250 health
- Can move 1 space per turn
- Can fire 3 round burst of 4 damage per shot
- Can fire explosive shot for 20 damage, but takes 2 turns to reload
- 12 view distance
- 4 max weapon distance for burst and 6 for explosive shot

### Boss Sentry Bot - Φ

Large. Electrical. Angry.

- 150 health
- Can move 1 space per turn
- 5 damage per shot
- 12 view distance
- 4 max weapon distance