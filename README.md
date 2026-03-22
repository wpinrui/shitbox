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

## Image Attributions

Background photos in `public/assets/backgrounds/`:

| # | File | Attribution |
|---|---|---|
| 1 | `hero.jpg` | Photo by [Adrien Brunat](https://unsplash.com/@adrienbrunat_pro?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/photos/black-suv-on-road-during-daytime-sp0jSprmqLg?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) |
| 2 | `scrapyard.jpg` | Photo by [Raymond Kotewicz](https://unsplash.com/@raymondkotewicz?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/photos/an-aerial-view-of-a-construction-site-blBJecOqOsM?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) |
| 3 | `school.jpg` | [Teine Driving School](https://upload.wikimedia.org/wikipedia/commons/4/43/Teine_Driving_School.JPG), Wikimedia Commons |
| 4 | `bank.jpg` | Photo by [Andy Wang](https://unsplash.com/@andywang?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/photos/modern-lobby-with-marble-floors-and-decorative-ceiling-08MQb0SSUDQ?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) |
| 5 | `gas_station.jpg` | Photo by [Elwaid Mohamed](https://unsplash.com/@mohamedelwaid?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/photos/a-row-of-gas-pumps-sitting-in-a-parking-lot-rPfaCWODxrc?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) |
| 6 | `auction.jpg` | Photo by [Quentin Martinez](https://unsplash.com/@quentin_martinez?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/photos/a-row-of-old-cars-parked-in-a-building-VpuGQjdpvww?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) |
| 7 | `showroom.jpg` | Photo by [Kenjiro Yagi](https://unsplash.com/@kenji4861?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/photos/a-car-showroom-filled-with-lots-of-cars-RVEdgp-dkYY?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) |
| 8 | `garage.jpg` | Photo by [Alex Suprun](https://unsplash.com/@sooprun?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/photos/several-vehicles-parked-beside-wall-AHnhdjyTNGM?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) |
| 9 | `workshop.jpg` | Photo by [Barthélemy de Mazenod](https://unsplash.com/@thebarlemy?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/photos/cars-parked-in-parking-lot-DI7E79H3joQ?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) |
| 10 | `car_wash.jpg` | Photo by [Erik McLean](https://unsplash.com/@introspectivedsgn?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/photos/white-ford-vehicle-D-eFjDWxIQs?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) |
| 11 | `apartments.jpg` | Photo by [Isaac Quesada](https://unsplash.com/@isaacquesada?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/photos/brown-and-white-concrete-building-s34TlUTPIf4?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) |
| 12 | `parking_lot.jpg` | Photo by [John Matychuk](https://unsplash.com/@john_matychuk?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/photos/aerial-view-of-cars-parked-on-parking-lot-yvfp5YHWGsc?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) |
| 13 | `map.jpg` | Photo by [Miguel Picq](https://unsplash.com/@miguelpicq?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/photos/a-group-of-houses-and-trees-nciVbT45HrI?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) |
| 14 | `gameover.jpg` | Photo by [Marek Piwnicki](https://unsplash.com/@marekpiwnicki?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/photos/white-car-on-green-grass-field-during-daytime-5WLgvjjFUqE?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) |
| 15 | `budget_house.jpg` | Photo by [Artem Polezhaev](https://unsplash.com/@artem_polezhaev?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/photos/FShi9jYAyJg?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) |
| 16 | `film_school.jpg` | Photo by [Brands&People](https://unsplash.com/@brandspeople?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/photos/br2HgQuvq6I?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) |
| 17 | `gym.jpg` | Photo by [Samuel Girven](https://unsplash.com/@samuelgirven?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/photos/fqMu99l8sqo?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) |
| 18 | `penthouse.jpg` | Photo by [Peter Thomas](https://unsplash.com/@peterthomas?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/photos/efLcMHXtrg0?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) |

## Music Attribution

"Late Night Radio" Kevin MacLeod (incompetech.com)
Licensed under Creative Commons: By Attribution 4.0 License
http://creativecommons.org/licenses/by/4.0/
