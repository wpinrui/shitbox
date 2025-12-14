# Shitbox

A car-themed economic life simulation where you hustle your way from poverty to prosperity.

## Concept

Start as an 18-year-old with nothing but a broken-down vehicle salvaged from a scrapyard. Buy, fix, flip, race, and negotiate your way to the top. Victory is measured by days elapsed - reach your goal fastest.

The ultimate aspiration: the Ferrari 250 GTO (~$70M).

## Core Mechanics

- **Negotiation** - Read NPC personality traits, use multi-dimensional trade levers
- **Car Flipping** - Buy low, repair, sell high
- **Road Trips** - Top Gear-inspired content creation for engagement and income
- **Resource Management** - Balance money, energy, and time
- **Stat Progression** - Charisma, Mechanical, Fitness, Knowledge, Driving (see [Shitbox_Skills.md](Shitbox_Skills.md))

## Locations

- Scrapyard - Labor, scavenge parts, find project cars
- Garage/Workshop - Store and repair vehicles
- Auction Lot - Bi-weekly car auctions
- Bank - Savings, investments, loans
- Showroom - Buy new cars, work as dealer
- School/Library - Training and licenses
- Gym - Fitness training
- Film School - Cinematography for content creation

## Tech Stack

- Electron + React + TypeScript
- Zustand for state management
- Data-driven design (JSON configs)
- Pure engine logic separated from UI

## Architecture

```
src/
  engine/     # Pure game logic (no React)
  store/      # Zustand state management
  ui/         # React components
data/         # JSON config files
electron/     # Electron shell
```

## Design Principles

1. Data-driven - All tunable values in JSON
2. Engine/UI separation - Core logic has zero React dependencies
3. Deterministic - Same state + action + RNG seed = identical results
4. Serializable - Entire game state can be JSON stringified
5. Event-sourced - Actions logged for replay/debugging
