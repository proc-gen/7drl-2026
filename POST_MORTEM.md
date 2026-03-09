# Routine Inspection RL - Post Mortem

This year's entry into 7DRL seemed like a good balance between getting things done and not a ton of bug fixing, though no development process would be complete without at least some of those popping up along the way. Even things that needed to get cut out to stay within the time limit were things that would've added variety to the game and didn't take away from the heart of it. 

## Things that ate time

### Forgetting to remove entities from the map

Until the advent of the Sweeper and pickups for energy and shield, removing entities from the map made sense to only do if something had died. This caused a fairly large issue that I spent the better part of an afternoon trying to figure out, not figuring it out, and then adding in extra code for trigger-based spawns so that there weren't invisible enemies all over the map. It was either late Friday or early Saturday that I realized this and updated the `UpdateRemoveSystem` to handle it appropriately, but it still doesn't bring back the time spent on it.

### Trying to write some map generation on the fly

I thought I had a working verson of a BSP interior(rectangular subdivision) style generator somewhere, but making them work in TS turned out to be more trouble than it was worth. Sadly, I resorted to the default generators provided by ROT.js, which are good for what they're meant to do, just not quite what I had originally intended for an office building with some varied layouts. This time was all spent on the starting level thankfully and I didn't need to learn my lesson again.

I did make a node-ish based generator for level 8 because I wanted the ship to have a much different layout than all the previous levels. Original intent here was to begin with an octagonal room for the start and then append shapes like rectangles, diamonds, trapezoids, and anything else that fit the bill like puzzle pieces with an option for forced symmetry.

### Things I didn't realize were broken from existing code

While some things I knew, like the message log not wrapping, I didn't know that making the player always centered on the screen had broken both inspection and targeting when using the mouse. I probably should've scrapped any sort of mouse control instead of spending time to fix it.

## Places I got lucky

### Having previous code from the ROT.js tutorial

I know enough TS to get by, but taking the time to do the tutorial and make it with an ECS instead of following it verbatim was the best thing I could've done. Nothing is more helpful than having a generic code-base to build from.

### Staying focused on the game design document

The GDD gave me very clear guidelines on what I needed to make. Things definitely evolved based on it because a good set of guidelines should always have room to be adjusted. For example, the Energy Sword was a quick addition not in the doc because I felt like melee should have an upgrade path instead of a single weapon. Another is that while all the enemies were implemented, the special and boss cyborgs both got nerfed. They were supposed to choose between their primary and secondary weapons, and in the end the special cyborg was just a bigger, stronger version of the original and the boss cyborg only fired explosive shots.

### Coming up with ways to fill the space

One of the hardest things I've found in every year of 7DRL is coming up with level designs that aren't just a bunch of random rooms connected by doors. Levels 1, 2, and kind of 7 had some extra "stuff" like the maze of crates, cafeteria tables with empty plates, cubicles for the missing employees, and several different designs for spaceships in the hangar. 

## Things I wish made the final version

This list is purely for things that were in the GDD and couldn't make it in due to time constraints

- Fully fleshed out bosses
  - As noted previously, certain enemies got nerfed that were supposed to have multiple weapons and they ended up just being beefed up enemies
- Bouncing for Singularity Discs
  - The goal for these was not just to have them be another throwable weapon. If you walked around a corner and saw a group of enemies, I wanted the player to be able to run away and bounce the disc to where the enemies might be, with it exploding on hit or after the max distance was reached. Probably should've updated the max distance to correspond with this, but oh well
- The Randomness Crate
  - There's a tiny bit of code for this included, but the non-inclusion was for 2 reasons, one of them obviously being time. The other was that there just weren't enough weapons for it to make sense. Getting the Plasma Cannon a couple levels early wasn't going to be a massive game changer unless you didn't have weapons already. I had considered it being more of a Pandora's box type of situation where it could give a bunch of stuff or it could take everything away. That idea never got off the ground because I was too busy working on other things to even make a list of what it could do
- The RC Car Bomb
  - This was completely taken out of the GDD in favor of the Flash Grenade. It seemed like a cool concept that the player could put it down and drive it around for recon and then have it either blow up at the time limit or on command. Shifting the display focus back and forth along with the weapon implementation probably would've been an entire day on its own, which wasn't in the cards for getting the rest of the project done
- Story-based interactables
  - For an AI takeover of the lab, there's a distinct lack of dead bodies lying around. I really wanted there to be one near the first keycard to be part of the reason why you know you need to go up to the next floor. Maybe have some computers on desks or at cubicles that had any sort of info about the experiments going on. Some of this comes across in the trigger-based blurbs, but there could be more without it being obtrusive to those that don't care about the walls of text

## The list of I WANT I WANT I WANT

- A Shotgun
  - Can I really say this game took some inspiration from Doom if it doesn't have a shotgun? It doesn't even need to be the double barrel. It would be a hit-scan type of weapon with some number of pellets getting shot out per shell in semi-random directions. Maybe an energy based one called the Spreader that shoots energy blips out in a fan shape?
- More items/equippables
  - Beyond missing the shotgun, there's a distinct "lack of things" in the game on purpose, which was the time limit. You always have a slight sense of getting stronger through leveling up the weapon proficiencies, but there's never a sense of being able to take more hits. The Energy to Shield Tool is a glorified free health item unless you have some insanely bad luck. Things like armor, hologram projectors, cloaking devices, etc.
- The intended level generation
- Adjustable difficulty
  - Beyond something like Easy, Medium, and Hard, I wanted a Story mode that could be played where everything except the player would die instantly so that the story of the game could be experienced without the rage induced by getting some horrible RNG. Very not 90's of me considering the inspiration I used
- Graphics
  - I only just found this out after 7DRL had ended, but ROT.js does support floating point positions if you use tile based graphics instead of text based. Granted, this wouldn't change anything about how I completed the project in its current state, it just makes things more interesting for the future
- Infinite Looping
  - I thought I was going to have time to make a groundhog day type loop so that you could continue playing past the final boss. Alas, it was not so.
- Locked doors and similar
  - Whether it's a key, a switch, or something else, this would have been a nice touch
- Moving platforms
  - This was an early idea I had before writing the GDD that just didn't make it into the final list of ideas
- Dash/Lunge move
  - Right now it's impossible to get away from things that have a move speed of 2 spaces per turn, or in the case of the Pickpocket Bot catch back up to it. At the end of the week, I was thinking about how a dash that costs energy could be helpful in that regard. The lunge was a different path that would be tied to the melee weapon because right now it doesn't feel worth it to melee because you have to take so much damage to get in close.

## Inspirations, in case I forget

In alphabetical order by game

- Call of Duty (Any of them with Zombies)
  - Mystery Crate = The Random Box
- Command and Conquer: Tiberian Sun
  - Bouncing discs from the Disc Throwers
  - Cyborgs sometimes becoming a damaged cyborg on death
- Descent 2
  - Using the Shield/Energy mechanic
  - The Energy to Shield Tool
  - Pickpocket Bot = Thief Bot
- Doom
  - Colored keycards
  - (Beam) Saw
- Duke Nukem 2
  - Laser Rifle (blue laser in game pierces through everything)
  - Exploding Spiders (they don't explode in Duke Nukem, they just jump on you and cause trouble)
- Duke Nukem 3D
  - (Energy) Ripper
- Halo 2
  - Energy Sword

Funny how almost all of these ended up being sequels without my realizing it

## Conclusion

Overall, I think this was my best submission yet of the three years I've had an entry. Hopefully the decision to make it browser playable allows it to reach an audience that wants to play this style of game.