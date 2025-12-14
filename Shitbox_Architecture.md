# SHITBOX — Software Architecture & Build Plan

> **Note:** The skill system and racing mechanics in this document have been superseded. See [Shitbox_Skills.md](Shitbox_Skills.md) for the current skill system design (5 stats: Charisma, Mechanical, Fitness, Knowledge, Driving) and Road Trip content creation system.

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Directory Structure](#2-directory-structure)
3. [Data Schema Design](#3-data-schema-design)
4. [Core Systems](#4-core-systems)
5. [State Management](#5-state-management)
6. [Build Phases](#6-build-phases)
7. [Testing Strategy](#7-testing-strategy)

---

## 1. Architecture Overview

### Design Principles

1. **Data-Driven Everything**: All tunable values live in JSON. Code never contains magic numbers.
2. **Engine/UI Separation**: Core game logic is pure TypeScript with zero React dependencies. UI is a thin layer that renders state and dispatches actions.
3. **Deterministic Core**: Given the same state + action + RNG seed, the engine produces identical results. Enables replay, testing, and debugging.
4. **Serializable State**: Entire game state can be JSON.stringify'd at any moment for save/load.
5. **Event-Sourced History**: Actions are logged, enabling undo (if desired) and replay analysis.

### Layer Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        ELECTRON SHELL                           │
│  - Window management                                            │
│  - File system (saves, data loading)                            │
│  - Native menus                                                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         REACT UI LAYER                          │
│  - Components (Map, Location, Negotiation, Racing, HUD)         │
│  - Renders from state                                           │
│  - Dispatches actions to engine                                 │
│  - Animations, transitions, sound (future)                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      STATE MANAGEMENT                           │
│  - Zustand store (or Redux if preferred)                        │
│  - Holds GameState                                              │
│  - Calls engine functions, updates state                        │
│  - Handles save/load serialization                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        GAME ENGINE                              │
│  - Pure functions: (state, action, rng) => newState             │
│  - Zero side effects                                            │
│  - Imports data from JSON configs                               │
│  - Modules: Activity, Negotiation, Racing, Economy, Time        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                               │
│  - JSON config files                                            │
│  - Loaded at startup, cached in memory                          │
│  - Hot-reloadable in dev mode                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure

```
shitbox/
├── package.json
├── tsconfig.json
├── electron/
│   ├── main.ts                 # Electron main process
│   ├── preload.ts              # IPC bridge
│   └── fileSystem.ts           # Save/load helpers
│
├── src/
│   ├── index.tsx               # React entry point
│   ├── App.tsx                 # Root component, router
│   │
│   ├── engine/                 # PURE GAME LOGIC (no React)
│   │   ├── index.ts            # Public API
│   │   ├── types.ts            # All TypeScript interfaces
│   │   ├── constants.ts        # Derived constants from data
│   │   ├── core/
│   │   │   ├── gameLoop.ts     # Main update function
│   │   │   ├── activity.ts     # Activity execution
│   │   │   ├── time.ts         # Time advancement
│   │   │   └── resources.ts    # Resource calculations
│   │   ├── systems/
│   │   │   ├── negotiation.ts  # Negotiation logic
│   │   │   ├── racing.ts       # Racing simulation
│   │   │   ├── economy.ts      # Prices, markets, interest
│   │   │   ├── cars.ts         # Car operations
│   │   │   ├── npcs.ts         # NPC generation, traits
│   │   │   ├── newspaper.ts    # Daily content generation
│   │   │   └── events.ts       # Random events, risks
│   │   ├── utils/
│   │   │   ├── rng.ts          # Seeded random number generator
│   │   │   ├── validators.ts   # Prerequisite checking
│   │   │   └── calculations.ts # Shared math helpers
│   │   └── __tests__/          # Engine unit tests
│   │
│   ├── store/                  # STATE MANAGEMENT
│   │   ├── index.ts            # Zustand store definition
│   │   ├── actions.ts          # Action creators
│   │   ├── selectors.ts        # Derived state selectors
│   │   └── persistence.ts      # Save/load logic
│   │
│   ├── ui/                     # REACT COMPONENTS
│   │   ├── components/
│   │   │   ├── common/         # Buttons, modals, cards
│   │   │   ├── hud/            # Resource bars, clock, stats
│   │   │   ├── map/            # World map, location nodes
│   │   │   ├── location/       # Location menus, activity lists
│   │   │   ├── negotiation/    # Negotiation UI
│   │   │   ├── racing/         # Racing minigame UI
│   │   │   ├── cars/           # Car cards, garage view
│   │   │   ├── bank/           # Banking interface
│   │   │   └── newspaper/      # Newspaper reader
│   │   ├── screens/
│   │   │   ├── MainMenu.tsx
│   │   │   ├── NewGame.tsx     # Stat allocation
│   │   │   ├── GameScreen.tsx  # Main gameplay
│   │   │   ├── GameOver.tsx
│   │   │   └── Victory.tsx
│   │   ├── hooks/              # Custom React hooks
│   │   └── styles/             # CSS/Tailwind
│   │
│   └── assets/                 # Static assets
│       ├── images/
│       └── fonts/
│
├── data/                       # JSON CONFIG FILES
│   ├── economy.json            # Base economic values
│   ├── activities/
│   │   ├── scrapyard.json
│   │   ├── garage.json
│   │   ├── workshop.json
│   │   ├── apartments.json
│   │   ├── auction.json
│   │   ├── racetrack.json
│   │   ├── school.json
│   │   ├── showroom.json
│   │   ├── bank.json
│   │   ├── driving.json
│   │   └── misc.json
│   ├── cars.json               # Car database
│   ├── traits.json             # NPC personality traits
│   ├── races.json              # Race definitions
│   ├── properties.json         # Apartments, houses, commercial
│   ├── licenses.json           # License requirements
│   ├── loans.json              # Loan products
│   └── newspaper-templates.json # Content generation templates
│
├── saves/                      # Player save files (gitignored)
│
└── tools/                      # Dev tools
    ├── balance-tester.ts       # Automated playthrough simulation
    └── data-validator.ts       # JSON schema validation
```

---

## 3. Data Schema Design

### 3.1 Economy Base Values (`data/economy.json`)

```json
{
  "version": "1.0.0",
  
  "resources": {
    "maxEnergy": 100,
    "startingMoney": 0,
    "startingStatPoints": 25
  },
  
  "survival": {
    "dailyFoodCost": 25,
    "daysWithoutFoodUntilDeath": 2
  },
  
  "rest": {
    "shitboxEnergyPerHour": 4,
    "basicApartmentEnergyPerHour": 8,
    "niceApartmentEnergyPerHour": 10,
    "ownedHomeEnergyPerHour": 10,
    "lightRestEnergyPerHour": 2
  },
  
  "housing": {
    "basicApartmentRent": 1200,
    "niceApartmentRent": 2400,
    "basicApartmentBuyPrice": { "min": 150000, "max": 250000 },
    "niceApartmentBuyPrice": { "min": 300000, "max": 500000 },
    "houseBuyPrice": { "min": 400000, "max": 800000 }
  },
  
  "parking": {
    "seasonParkingMonthly": { "min": 100, "max": 300 }
  },
  
  "newspaper": {
    "dailyCost": 2
  },
  
  "ads": {
    "freeAdResponseChancePerDay": 0.05,
    "paidAdCost": { "min": 20, "max": 100 },
    "paidAdResponseChancePerDay": { "min": 0.20, "max": 0.40 }
  },
  
  "bank": {
    "savingsInterestMonthly": 0.005,
    "indexFund": {
      "averageAnnualReturn": 0.07,
      "dailyVolatility": 0.02,
      "withdrawalDelayDays": 1
    },
    "loans": {
      "personal": { "aprMin": 0.08, "aprMax": 0.15 },
      "auto": { "aprMin": 0.06, "aprMax": 0.12 },
      "mortgage": { "aprMin": 0.04, "aprMax": 0.08 },
      "business": { "aprMin": 0.07, "aprMax": 0.12 }
    },
    "missedPaymentLateFeePercent": 0.05,
    "missedPaymentsUntilRateIncrease": 2,
    "missedPaymentsUntilRepo": 3
  },
  
  "fines": {
    "speedingTicket": { "min": 150, "max": 400 }
  },
  
  "commissions": {
    "auctionHouseFee": 0.05,
    "consignmentCommission": 0.10,
    "realEstateAgentFee": { "min": 0.03, "max": 0.06 },
    "dealerTradeInPercent": 0.75
  },
  
  "statEffects": {
    "charisma": {
      "traitVisibilityPerPoint": 0.02,
      "adResponseBonusPerPoint": 0.005
    },
    "mechanical": {
      "repairQualityBonusPerPoint": 0.01,
      "partFindBonusPerPoint": 0.02,
      "valueSpotAccuracyPerPoint": 0.015
    },
    "fitness": {
      "energyDrainReductionPerPoint": 0.01,
      "laborOutputBonusPerPoint": 0.008
    },
    "knowledge": {
      "researchAccuracyPerPoint": 0.02,
      "hiddenListingChancePerPoint": 0.01
    },
    "racing": {
      "powerBonusPerPoint": 0.015
    }
  }
}
```

### 3.2 Activity Definition (`data/activities/scrapyard.json`)

```json
{
  "locationId": "scrapyard",
  "locationName": "Scrapyard",
  "activities": [
    {
      "id": "manual_labor",
      "name": "Manual Labor",
      "description": "Hard work sorting scrap. Always available.",
      "category": "work",
      
      "time": {
        "type": "variable",
        "minHours": 1,
        "maxHours": 8,
        "unit": "hour"
      },
      
      "energy": {
        "type": "perHour",
        "base": 10,
        "statModifier": { "stat": "fitness", "effect": "reduce", "formula": "base * (1 - fitness * 0.01)" }
      },
      
      "money": {
        "type": "earn",
        "mode": "perHour",
        "base": 12,
        "variance": 3,
        "statModifier": { "stat": "fitness", "effect": "increase", "formula": "base * (1 + fitness * 0.008)" }
      },
      
      "prerequisites": [],
      
      "statGain": [
        { "stat": "fitness", "amount": 0.01, "per": "hour" }
      ],
      
      "risks": [],
      
      "unlocks": []
    },
    {
      "id": "scavenge_parts",
      "name": "Scavenge Parts",
      "description": "Search for usable car parts in the junk piles.",
      "category": "scavenge",
      
      "time": {
        "type": "fixed",
        "hours": 2
      },
      
      "energy": {
        "type": "fixed",
        "base": 15
      },
      
      "money": {
        "type": "none"
      },
      
      "prerequisites": [],
      
      "outcomes": [
        {
          "type": "items",
          "itemType": "random_part",
          "quantity": { "min": 0, "max": 3 },
          "statModifier": { "stat": "mechanical", "effect": "increaseMax", "formula": "max + floor(mechanical / 10)" }
        }
      ],
      
      "statGain": [
        { "stat": "mechanical", "amount": 0.02, "per": "activity" }
      ],
      
      "risks": [],
      
      "unlocks": []
    },
    {
      "id": "focused_scavenge_engine",
      "name": "Focused Scavenge: Engine Parts",
      "description": "Specifically hunt for engine components.",
      "category": "scavenge",
      
      "time": {
        "type": "fixed",
        "hours": 3
      },
      
      "energy": {
        "type": "fixed",
        "base": 20
      },
      
      "money": {
        "type": "none"
      },
      
      "prerequisites": [
        { "type": "stat", "stat": "mechanical", "minimum": 15 }
      ],
      
      "outcomes": [
        {
          "type": "items",
          "itemType": "engine_part",
          "quantity": { "min": 1, "max": 4 },
          "statModifier": { "stat": "mechanical", "effect": "increaseMax", "formula": "max + floor(mechanical / 15)" }
        }
      ],
      
      "statGain": [
        { "stat": "mechanical", "amount": 0.03, "per": "activity" }
      ],
      
      "risks": [],
      
      "unlocks": []
    },
    {
      "id": "browse_junkers",
      "name": "Browse Junkers",
      "description": "See what project cars are available.",
      "category": "browse",
      
      "time": {
        "type": "fixed",
        "hours": 1
      },
      
      "energy": {
        "type": "fixed",
        "base": 5
      },
      
      "money": {
        "type": "none"
      },
      
      "prerequisites": [],
      
      "outcomes": [
        {
          "type": "showListings",
          "listingType": "junker_cars",
          "priceRange": { "min": 200, "max": 2000 }
        }
      ],
      
      "statGain": [
        { "stat": "knowledge", "amount": 0.01, "per": "activity" }
      ],
      
      "risks": [],
      
      "unlocks": []
    },
    {
      "id": "negotiate_junker_purchase",
      "name": "Buy Junker",
      "description": "Negotiate to purchase a project car.",
      "category": "negotiate",
      
      "time": {
        "type": "variable",
        "minHours": 0.5,
        "maxHours": 2
      },
      
      "energy": {
        "type": "fixed",
        "base": 5
      },
      
      "money": {
        "type": "spend",
        "mode": "negotiated"
      },
      
      "prerequisites": [
        { "type": "context", "requirement": "selectedCar" },
        { "type": "money", "minimum": "carPrice" }
      ],
      
      "outcomes": [
        {
          "type": "acquireCar",
          "source": "selectedCar"
        },
        {
          "type": "conditionalCost",
          "condition": "needsTowing",
          "cost": { "min": 50, "max": 100 },
          "description": "Towing fee"
        }
      ],
      
      "statGain": [
        { "stat": "charisma", "amount": 0.02, "per": "activity" }
      ],
      
      "risks": [],
      
      "unlocks": []
    },
    {
      "id": "sell_for_scrap",
      "name": "Sell Car for Scrap",
      "description": "Scrap your car for metal value. Permanent.",
      "category": "sell",
      
      "time": {
        "type": "fixed",
        "hours": 1
      },
      
      "energy": {
        "type": "fixed",
        "base": 5
      },
      
      "money": {
        "type": "earn",
        "mode": "carScrapValue",
        "formula": "carWeight * scrapPricePerKg"
      },
      
      "prerequisites": [
        { "type": "ownership", "itemType": "car" }
      ],
      
      "outcomes": [
        {
          "type": "removeCar",
          "source": "selectedCar"
        }
      ],
      
      "statGain": [],
      
      "risks": [],
      
      "confirmationRequired": true,
      "confirmationMessage": "Are you sure? This will permanently destroy your car."
    }
  ]
}
```

### 3.3 Car Definition (`data/cars.json`)

```json
{
  "version": "1.0.0",
  
  "scrapPricePerKg": 0.15,
  
  "cars": [
    {
      "id": "civic_1995",
      "make": "Honda",
      "model": "Civic",
      "year": 1995,
      "category": "economy",
      "tier": 0,
      
      "baseStats": {
        "power": 125,
        "topSpeed": 180,
        "weight": 1100,
        "fuelEfficiency": 7.5,
        "capacity": { "passengers": 4, "cargo": 300 },
        "prestige": 10
      },
      
      "marketValue": {
        "excellent": 4500,
        "good": 3200,
        "fair": 2000,
        "poor": 800,
        "scrap": 165
      },
      
      "repairCosts": {
        "enginePerPercent": 25,
        "bodyPerPercent": 15,
        "engineReplacement": 1800
      },
      
      "fuelCostPerKm": 0.12,
      
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/...",
      "bio": "The '95 Civic is legendary for reliability. Cheap to run, easy to fix, and surprisingly fun to drive."
    },
    {
      "id": "corolla_1998",
      "make": "Toyota",
      "model": "Corolla",
      "year": 1998,
      "category": "economy",
      "tier": 0,
      
      "baseStats": {
        "power": 120,
        "topSpeed": 175,
        "weight": 1150,
        "fuelEfficiency": 7.2,
        "capacity": { "passengers": 4, "cargo": 350 },
        "prestige": 12
      },
      
      "marketValue": {
        "excellent": 5000,
        "good": 3500,
        "fair": 2200,
        "poor": 900,
        "scrap": 172
      },
      
      "repairCosts": {
        "enginePerPercent": 22,
        "bodyPerPercent": 14,
        "engineReplacement": 1600
      },
      
      "fuelCostPerKm": 0.11,
      
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/...",
      "bio": "The Corolla refuses to die. Not exciting, but it will outlast you."
    },
    {
      "id": "ferrari_250_gto",
      "make": "Ferrari",
      "model": "250 GTO",
      "year": 1962,
      "category": "hypercar",
      "tier": 4,
      "isVictoryCar": true,
      
      "baseStats": {
        "power": 300,
        "topSpeed": 280,
        "weight": 880,
        "fuelEfficiency": 18,
        "capacity": { "passengers": 2, "cargo": 50 },
        "prestige": 100
      },
      
      "marketValue": {
        "excellent": 70000000,
        "good": 55000000,
        "fair": 40000000,
        "poor": 25000000,
        "scrap": 50000
      },
      
      "repairCosts": {
        "enginePerPercent": 50000,
        "bodyPerPercent": 30000,
        "engineReplacement": 2000000
      },
      
      "fuelCostPerKm": 0.80,
      
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/...",
      "bio": "The Holy Grail. Only 36 were ever made. If you own this, you've won."
    }
  ],
  
  "conditionRatings": {
    "excellent": { "min": 90, "max": 100 },
    "good": { "min": 70, "max": 89 },
    "fair": { "min": 40, "max": 69 },
    "poor": { "min": 10, "max": 39 },
    "scrap": { "min": 0, "max": 9 }
  }
}
```

### 3.4 NPC Traits (`data/traits.json`)

```json
{
  "version": "1.0.0",
  
  "traits": [
    {
      "id": "impatient",
      "name": "Impatient",
      "description": "Wants to close quickly. Will walk if you stall.",
      "incompatibleWith": ["patient"],
      "effects": {
        "maxNegotiationRounds": -3,
        "acceptanceThreshold": 0.05,
        "walkAwayChancePerRound": 0.15
      }
    },
    {
      "id": "patient",
      "name": "Patient",
      "description": "Happy to haggle forever.",
      "incompatibleWith": ["impatient"],
      "effects": {
        "maxNegotiationRounds": 10,
        "acceptanceThreshold": -0.05,
        "walkAwayChancePerRound": 0.02
      }
    },
    {
      "id": "desperate",
      "name": "Desperate",
      "description": "Needs this deal. Flexible on terms.",
      "incompatibleWith": ["firm"],
      "effects": {
        "priceFlexibility": 0.20,
        "acceptanceThreshold": 0.10
      }
    },
    {
      "id": "firm",
      "name": "Firm",
      "description": "Knows their price. Won't budge much.",
      "incompatibleWith": ["desperate"],
      "effects": {
        "priceFlexibility": -0.15,
        "counterOfferAggression": 0.8
      }
    },
    {
      "id": "prideful",
      "name": "Prideful",
      "description": "Lowballs are an insult.",
      "incompatibleWith": ["pragmatic"],
      "effects": {
        "lowballInsultThreshold": 0.15,
        "walkAwayOnInsult": 0.70
      }
    },
    {
      "id": "pragmatic",
      "name": "Pragmatic",
      "description": "It's just business. Numbers only.",
      "incompatibleWith": ["prideful"],
      "effects": {
        "lowballInsultThreshold": 0,
        "emotionalResponse": 0
      }
    },
    {
      "id": "naive",
      "name": "Naive",
      "description": "Doesn't know the real value.",
      "incompatibleWith": ["savvy"],
      "effects": {
        "valueKnowledge": 0.3,
        "manipulationVulnerability": 0.5
      }
    },
    {
      "id": "savvy",
      "name": "Savvy",
      "description": "Knows exactly what it's worth.",
      "incompatibleWith": ["naive"],
      "effects": {
        "valueKnowledge": 1.0,
        "manipulationVulnerability": 0
      }
    },
    {
      "id": "cautious",
      "name": "Cautious",
      "description": "Needs reassurance before committing.",
      "incompatibleWith": ["impulsive"],
      "effects": {
        "decisionDelay": 2,
        "requiresMultipleRounds": true
      }
    },
    {
      "id": "impulsive",
      "name": "Impulsive",
      "description": "Makes snap decisions.",
      "incompatibleWith": ["cautious"],
      "effects": {
        "decisionDelay": 0,
        "randomAcceptanceBonus": 0.15,
        "randomOverpay": 0.10
      }
    }
  ],
  
  "generation": {
    "minTraits": 2,
    "maxTraits": 4,
    "traitProbabilities": {
      "impatient": 0.25,
      "patient": 0.25,
      "desperate": 0.15,
      "firm": 0.30,
      "prideful": 0.20,
      "pragmatic": 0.25,
      "naive": 0.20,
      "savvy": 0.25,
      "cautious": 0.20,
      "impulsive": 0.20
    }
  }
}
```

### 3.5 Races (`data/races.json`)

```json
{
  "version": "1.0.0",
  
  "raceClasses": [
    {
      "id": "amateur",
      "name": "Amateur Race",
      "tier": 0,
      "entryFee": 50,
      "prizes": { "1st": 500, "2nd": 200, "3rd": 100 },
      "requirements": {
        "carValueMin": 0,
        "license": "driver"
      },
      "opponentSkillRange": { "min": 10, "max": 30 },
      "statGain": { "racing": 0.05 }
    },
    {
      "id": "club",
      "name": "Club Race",
      "tier": 1,
      "entryFee": 200,
      "prizes": { "1st": 2000, "2nd": 800, "3rd": 400 },
      "requirements": {
        "carValueMin": 10000,
        "license": "driver"
      },
      "opponentSkillRange": { "min": 25, "max": 50 },
      "statGain": { "racing": 0.08 }
    },
    {
      "id": "pro",
      "name": "Pro Race",
      "tier": 2,
      "entryFee": 1000,
      "prizes": { "1st": 10000, "2nd": 4000, "3rd": 2000 },
      "requirements": {
        "carValueMin": 50000,
        "license": "driver"
      },
      "opponentSkillRange": { "min": 45, "max": 75 },
      "statGain": { "racing": 0.10 }
    },
    {
      "id": "elite",
      "name": "Elite Race",
      "tier": 3,
      "entryFee": 5000,
      "prizes": { "1st": 50000, "2nd": 20000, "3rd": 10000 },
      "requirements": {
        "carValueMin": 200000,
        "license": "driver"
      },
      "opponentSkillRange": { "min": 70, "max": 95 },
      "statGain": { "racing": 0.12 }
    }
  ],
  
  "racingMechanics": {
    "gears": 6,
    "optimalShiftWindowMs": 150,
    "earlyShiftPenalty": 0.08,
    "lateShiftPenalty": 0.12,
    "skillBonusPerRacingStat": 0.015,
    "engineConditionPowerMultiplier": true
  },
  
  "practiceSession": {
    "trackFee": 30,
    "hours": 1,
    "energy": 15,
    "statGain": { "racing": 0.03 }
  }
}
```

---

## 4. Core Systems

### 4.1 Engine Module Structure

```typescript
// src/engine/types.ts

export interface GameState {
  meta: {
    saveId: string;
    version: string;
    createdAt: number;
    lastSavedAt: number;
    rngSeed: number;
  };
  
  time: {
    currentDay: number;
    currentHour: number;  // 0-23
    currentMinute: number;
  };
  
  player: {
    name: string;
    money: number;
    energy: number;
    
    stats: {
      charisma: number;
      mechanical: number;
      fitness: number;
      knowledge: number;
      racing: number;
    };
    
    licenses: string[];  // ["driver", "taxi", "truck"]
    completedCourses: string[];
    
    housing: {
      type: "shitbox" | "renting" | "owning";
      propertyId: string | null;
    };
    
    daysWithoutFood: number;
  };
  
  inventory: {
    cars: OwnedCar[];
    engineParts: number;
    bodyParts: number;
  };
  
  assets: {
    garage: OwnedGarage | null;
    workshop: OwnedWorkshop | null;
    properties: OwnedProperty[];
    dealership: OwnedDealership | null;
  };
  
  finance: {
    savings: number;
    indexFund: {
      invested: number;
      pendingWithdrawal: number;
      withdrawalAvailableDay: number;
    };
    loans: Loan[];
  };
  
  market: {
    currentListings: CarListing[];
    playerListings: PlayerListing[];
    auctionSchedule: AuctionEvent[];
    marketTrends: MarketTrend[];
  };
  
  npcs: {
    activeNegotiations: NegotiationState[];
    renters: RenterContract[];
    employees: Employee[];
  };
  
  newspaper: {
    currentDay: number;
    content: NewspaperContent;
    purchased: boolean;
  };
  
  progression: {
    totalEarnings: number;
    carsFlipped: number;
    racesWon: number;
    highestCarValue: number;
    gtoAcquired: boolean;
    gtoAcquiredDay: number | null;
  };
  
  history: {
    actions: ActionLog[];  // Last N actions for debugging
  };
}

export interface OwnedCar {
  instanceId: string;
  carId: string;  // References cars.json
  engineCondition: number;  // 0-100
  bodyCondition: number;    // 0-100
  location: "garage" | "parking" | "workshop" | "in_use";
  acquiredDay: number;
  acquiredPrice: number;
}

export interface Loan {
  id: string;
  type: "personal" | "auto" | "mortgage" | "business";
  principal: number;
  remainingBalance: number;
  apr: number;
  monthlyPayment: number;
  missedPayments: number;
  collateralId: string | null;
  startDay: number;
}

// ... more interfaces
```

### 4.2 Activity Execution

```typescript
// src/engine/core/activity.ts

import { GameState, ActivityResult } from '../types';
import { RNG } from '../utils/rng';
import { checkPrerequisites } from '../utils/validators';
import { calculateStatModifier } from '../utils/calculations';

export function executeActivity(
  state: GameState,
  activityId: string,
  params: ActivityParams,
  rng: RNG
): ActivityResult {
  
  const activityDef = getActivityDefinition(activityId);
  
  // 1. Validate prerequisites
  const prereqResult = checkPrerequisites(state, activityDef.prerequisites, params);
  if (!prereqResult.valid) {
    return { success: false, error: prereqResult.reason };
  }
  
  // 2. Calculate costs
  const energyCost = calculateEnergyCost(state, activityDef, params);
  const moneyCost = calculateMoneyCost(state, activityDef, params);
  const timeCost = calculateTimeCost(activityDef, params);
  
  // 3. Check if player can afford
  if (state.player.energy < energyCost) {
    return { success: false, error: "Not enough energy" };
  }
  if (state.player.money < moneyCost) {
    return { success: false, error: "Not enough money" };
  }
  
  // 4. Calculate outcomes
  const moneyEarned = calculateMoneyEarned(state, activityDef, params, rng);
  const itemsGained = calculateItemsGained(state, activityDef, rng);
  const statGains = calculateStatGains(activityDef, params);
  const risks = evaluateRisks(state, activityDef, params, rng);
  
  // 5. Build state delta
  const delta: StateDelta = {
    player: {
      energy: -energyCost,
      money: -moneyCost + moneyEarned - risks.moneyCost,
      stats: statGains
    },
    time: {
      hours: timeCost
    },
    inventory: {
      engineParts: itemsGained.engineParts || 0,
      bodyParts: itemsGained.bodyParts || 0
    },
    events: risks.events
  };
  
  return {
    success: true,
    delta,
    narrative: generateNarrative(activityDef, delta, risks)
  };
}
```

### 4.3 Negotiation System

```typescript
// src/engine/systems/negotiation.ts

export interface NegotiationState {
  id: string;
  type: "buy" | "sell" | "rent";
  npc: {
    id: string;
    name: string;
    traits: string[];          // Trait IDs
    revealedTraits: string[];  // What player can see
    targetPrice: number;       // Their ideal price
    walkAwayPrice: number;     // Their limit
    currentMood: number;       // -1 to 1
  };
  item: {
    type: "car" | "property" | "equipment";
    id: string;
    marketValue: number;
  };
  history: NegotiationRound[];
  status: "active" | "accepted" | "rejected" | "walked_away";
}

export interface NegotiationRound {
  roundNumber: number;
  playerOffer: Offer | null;
  npcResponse: NpcResponse;
}

export interface Offer {
  price: number;
  extras: string[];      // ["include_spare_parts", "delivery"]
  paymentTerms: "cash" | "installments";
}

export interface NpcResponse {
  type: "counter" | "accept" | "reject" | "walk_away" | "thinking";
  counterOffer?: Offer;
  moodChange: number;
  dialogue: string;
}

export function startNegotiation(
  state: GameState,
  type: "buy" | "sell" | "rent",
  npcId: string,
  itemId: string,
  rng: RNG
): NegotiationState {
  
  const npc = generateNpc(rng);
  const item = getItemDetails(state, itemId);
  
  // Determine NPC's target and walkaway based on traits
  const { targetPrice, walkAwayPrice } = calculateNpcPricing(
    npc.traits,
    item.marketValue,
    type,
    rng
  );
  
  // Reveal traits based on charisma
  const revealedTraits = npc.traits.filter(traitId => {
    const revealChance = state.player.stats.charisma * 0.02;
    return rng.random() < revealChance;
  });
  
  return {
    id: generateId(),
    type,
    npc: {
      id: npc.id,
      name: npc.name,
      traits: npc.traits,
      revealedTraits,
      targetPrice,
      walkAwayPrice,
      currentMood: 0
    },
    item: {
      type: item.type,
      id: item.id,
      marketValue: item.marketValue
    },
    history: [],
    status: "active"
  };
}

export function submitOffer(
  negotiation: NegotiationState,
  offer: Offer,
  playerCharisma: number,
  rng: RNG
): { negotiation: NegotiationState; response: NpcResponse } {
  
  const traits = loadTraits(negotiation.npc.traits);
  const isBuying = negotiation.type === "buy";
  
  // Calculate how good this offer is from NPC's perspective
  const offerQuality = isBuying
    ? (offer.price - negotiation.npc.walkAwayPrice) / (negotiation.npc.targetPrice - negotiation.npc.walkAwayPrice)
    : (negotiation.npc.walkAwayPrice - offer.price) / (negotiation.npc.walkAwayPrice - negotiation.npc.targetPrice);
  
  // Check for insult (lowball)
  const insultThreshold = traits.reduce((acc, t) => acc + (t.effects.lowballInsultThreshold || 0), 0.3);
  const isInsulting = offerQuality < -insultThreshold;
  
  // Determine response
  let response: NpcResponse;
  
  if (isInsulting && traits.some(t => t.id === "prideful")) {
    const walkChance = traits.find(t => t.id === "prideful")!.effects.walkAwayOnInsult;
    if (rng.random() < walkChance) {
      response = {
        type: "walk_away",
        moodChange: -0.5,
        dialogue: pickDialogue("insulted_walkaway", rng)
      };
    } else {
      response = {
        type: "reject",
        moodChange: -0.3,
        dialogue: pickDialogue("insulted_reject", rng)
      };
    }
  } else if (offerQuality >= getAcceptanceThreshold(traits)) {
    response = {
      type: "accept",
      moodChange: 0.2,
      dialogue: pickDialogue("accept", rng)
    };
  } else {
    // Generate counter offer
    const counterPrice = generateCounterOffer(
      negotiation,
      offer,
      traits,
      rng
    );
    
    response = {
      type: "counter",
      counterOffer: { ...offer, price: counterPrice },
      moodChange: offerQuality > 0 ? 0.1 : -0.1,
      dialogue: pickDialogue("counter", rng)
    };
  }
  
  // Check for random walk away (impatient NPCs)
  const walkAwayChance = traits.reduce((acc, t) => acc + (t.effects.walkAwayChancePerRound || 0), 0);
  if (response.type === "counter" && rng.random() < walkAwayChance) {
    response = {
      type: "walk_away",
      moodChange: -0.2,
      dialogue: pickDialogue("impatient_walkaway", rng)
    };
  }
  
  // Update negotiation state
  const updatedNegotiation: NegotiationState = {
    ...negotiation,
    npc: {
      ...negotiation.npc,
      currentMood: Math.max(-1, Math.min(1, negotiation.npc.currentMood + response.moodChange))
    },
    history: [
      ...negotiation.history,
      { roundNumber: negotiation.history.length + 1, playerOffer: offer, npcResponse: response }
    ],
    status: response.type === "accept" ? "accepted" 
          : response.type === "walk_away" ? "walked_away"
          : "active"
  };
  
  return { negotiation: updatedNegotiation, response };
}
```

### 4.4 Racing Minigame

```typescript
// src/engine/systems/racing.ts

export interface RaceState {
  raceId: string;
  raceClass: string;
  playerCar: OwnedCar;
  playerPosition: number;     // 0-1000 (finish line)
  playerSpeed: number;
  playerGear: number;         // 1-6
  playerRpm: number;          // 0-1
  
  opponents: OpponentState[];
  
  status: "countdown" | "racing" | "finished";
  raceTimeMs: number;
  
  shiftHistory: ShiftEvent[];
}

export interface OpponentState {
  id: string;
  name: string;
  skill: number;
  position: number;
  finished: boolean;
  finishTime: number | null;
}

export interface ShiftEvent {
  gear: number;
  rpm: number;
  quality: "perfect" | "good" | "early" | "late";
  timeLost: number;
}

export function initializeRace(
  state: GameState,
  raceClassId: string,
  carInstanceId: string,
  rng: RNG
): RaceState {
  
  const raceClass = getRaceClass(raceClassId);
  const car = state.inventory.cars.find(c => c.instanceId === carInstanceId)!;
  const carDef = getCarDefinition(car.carId);
  
  // Generate opponents
  const opponents: OpponentState[] = [];
  for (let i = 0; i < 5; i++) {
    const skill = rng.randomInRange(
      raceClass.opponentSkillRange.min,
      raceClass.opponentSkillRange.max
    );
    opponents.push({
      id: `opponent_${i}`,
      name: generateDriverName(rng),
      skill,
      position: 0,
      finished: false,
      finishTime: null
    });
  }
  
  return {
    raceId: generateId(),
    raceClass: raceClassId,
    playerCar: car,
    playerPosition: 0,
    playerSpeed: 0,
    playerGear: 1,
    playerRpm: 0,
    opponents,
    status: "countdown",
    raceTimeMs: 0,
    shiftHistory: []
  };
}

export function updateRace(
  race: RaceState,
  deltaMs: number,
  playerStats: { racing: number },
  rng: RNG
): RaceState {
  
  if (race.status !== "racing") return race;
  
  const carDef = getCarDefinition(race.playerCar.carId);
  const racingConfig = getRacingMechanics();
  
  // Calculate player's effective power
  const basePower = carDef.baseStats.power;
  const conditionMultiplier = race.playerCar.engineCondition / 100;
  const statBonus = 1 + (playerStats.racing * racingConfig.skillBonusPerRacingStat);
  const effectivePower = basePower * conditionMultiplier * statBonus;
  
  // RPM increases over time in current gear
  const newRpm = Math.min(1, race.playerRpm + (deltaMs / 1000) * 0.3);
  
  // Speed based on gear and RPM
  const gearMultiplier = race.playerGear / 6;
  const rpmEfficiency = newRpm > 0.8 ? 1 - (newRpm - 0.8) * 2 : newRpm / 0.8;
  const acceleration = (effectivePower / carDef.baseStats.weight) * gearMultiplier * rpmEfficiency;
  
  const newSpeed = race.playerSpeed + acceleration * (deltaMs / 1000);
  const newPosition = race.playerPosition + newSpeed * (deltaMs / 1000);
  
  // Update opponents
  const updatedOpponents = race.opponents.map(opp => {
    if (opp.finished) return opp;
    
    const oppSpeed = 50 + opp.skill * 0.8 + rng.random() * 5;
    const newOppPosition = opp.position + oppSpeed * (deltaMs / 1000);
    
    if (newOppPosition >= 1000) {
      return { ...opp, position: 1000, finished: true, finishTime: race.raceTimeMs };
    }
    return { ...opp, position: newOppPosition };
  });
  
  // Check if player finished
  const status = newPosition >= 1000 ? "finished" : "racing";
  
  return {
    ...race,
    playerPosition: Math.min(1000, newPosition),
    playerSpeed: newSpeed,
    playerRpm: newRpm,
    opponents: updatedOpponents,
    status,
    raceTimeMs: race.raceTimeMs + deltaMs
  };
}

export function shiftGear(
  race: RaceState,
  playerStats: { racing: number }
): { race: RaceState; shiftQuality: string } {
  
  if (race.playerGear >= 6) {
    return { race, shiftQuality: "max_gear" };
  }
  
  const racingConfig = getRacingMechanics();
  
  // Determine shift quality based on RPM
  let quality: "perfect" | "good" | "early" | "late";
  let timeLost = 0;
  
  if (race.playerRpm >= 0.85 && race.playerRpm <= 0.95) {
    quality = "perfect";
    timeLost = 0;
  } else if (race.playerRpm >= 0.75 && race.playerRpm < 0.85) {
    quality = "good";
    timeLost = racingConfig.earlyShiftPenalty * 0.5;
  } else if (race.playerRpm < 0.75) {
    quality = "early";
    timeLost = racingConfig.earlyShiftPenalty;
  } else {
    quality = "late";
    timeLost = racingConfig.lateShiftPenalty;
  }
  
  const shiftEvent: ShiftEvent = {
    gear: race.playerGear + 1,
    rpm: race.playerRpm,
    quality,
    timeLost
  };
  
  return {
    race: {
      ...race,
      playerGear: race.playerGear + 1,
      playerRpm: 0.3,  // Drop RPM on shift
      playerSpeed: race.playerSpeed * (1 - timeLost),
      shiftHistory: [...race.shiftHistory, shiftEvent]
    },
    shiftQuality: quality
  };
}
```

---

## 5. State Management

### 5.1 Zustand Store

```typescript
// src/store/index.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, ActivityParams } from '../engine/types';
import { executeActivity } from '../engine/core/activity';
import { advanceTime } from '../engine/core/time';
import { RNG } from '../engine/utils/rng';

interface GameStore {
  // State
  gameState: GameState | null;
  isLoading: boolean;
  error: string | null;
  
  // UI State (not persisted)
  currentScreen: Screen;
  selectedLocation: string | null;
  activeNegotiation: string | null;
  activeRace: RaceState | null;
  
  // Actions
  newGame: (playerName: string, statAllocation: StatAllocation) => void;
  loadGame: (saveId: string) => Promise<void>;
  saveGame: () => Promise<void>;
  
  performActivity: (activityId: string, params: ActivityParams) => ActivityResult;
  advanceTime: (hours: number) => void;
  
  // Negotiation
  startNegotiation: (type: string, npcId: string, itemId: string) => void;
  submitOffer: (offer: Offer) => NpcResponse;
  cancelNegotiation: () => void;
  
  // Racing
  enterRace: (raceClassId: string, carId: string) => void;
  updateRace: (deltaMs: number) => void;
  shiftGear: () => void;
  
  // Navigation
  setLocation: (locationId: string) => void;
  setScreen: (screen: Screen) => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      gameState: null,
      isLoading: false,
      error: null,
      currentScreen: "main_menu",
      selectedLocation: null,
      activeNegotiation: null,
      activeRace: null,
      
      newGame: (playerName, statAllocation) => {
        const seed = Date.now();
        const initialState = createInitialState(playerName, statAllocation, seed);
        set({ gameState: initialState, currentScreen: "game" });
      },
      
      performActivity: (activityId, params) => {
        const state = get().gameState;
        if (!state) throw new Error("No active game");
        
        const rng = new RNG(state.meta.rngSeed + state.time.currentDay);
        const result = executeActivity(state, activityId, params, rng);
        
        if (result.success) {
          const newState = applyDelta(state, result.delta);
          const timeAdvanced = advanceTime(newState, result.delta.time.hours);
          
          // Check for daily events (new day, loan payments, etc.)
          const withDailyEvents = processDailyEvents(timeAdvanced, rng);
          
          // Check for death conditions
          const finalState = checkDeathConditions(withDailyEvents);
          
          set({ gameState: finalState });
        }
        
        return result;
      },
      
      // ... other actions
    }),
    {
      name: 'shitbox-game',
      partialize: (state) => ({ gameState: state.gameState })
    }
  )
);
```

### 5.2 Selectors

```typescript
// src/store/selectors.ts

import { GameState, OwnedCar } from '../engine/types';
import { getCarDefinition } from '../engine/data';

export const selectNetWorth = (state: GameState): number => {
  const cash = state.player.money;
  const savings = state.finance.savings;
  const investments = state.finance.indexFund.invested;
  
  const carValue = state.inventory.cars.reduce((sum, car) => {
    return sum + calculateCarValue(car);
  }, 0);
  
  const propertyValue = state.assets.properties.reduce((sum, prop) => {
    return sum + prop.currentValue;
  }, 0);
  
  const garageValue = state.assets.garage?.value || 0;
  const workshopValue = state.assets.workshop?.value || 0;
  
  const totalDebt = state.finance.loans.reduce((sum, loan) => {
    return sum + loan.remainingBalance;
  }, 0);
  
  return cash + savings + investments + carValue + propertyValue + garageValue + workshopValue - totalDebt;
};

export const selectAvailableActivities = (state: GameState, locationId: string): Activity[] => {
  const allActivities = getLocationActivities(locationId);
  
  return allActivities.filter(activity => {
    return checkPrerequisites(state, activity.prerequisites, {}).valid;
  });
};

export const selectCarValue = (car: OwnedCar): number => {
  const carDef = getCarDefinition(car.carId);
  const avgCondition = (car.engineCondition + car.bodyCondition) / 2;
  
  if (avgCondition >= 90) return carDef.marketValue.excellent;
  if (avgCondition >= 70) return carDef.marketValue.good;
  if (avgCondition >= 40) return carDef.marketValue.fair;
  if (avgCondition >= 10) return carDef.marketValue.poor;
  return carDef.marketValue.scrap;
};

export const selectDailyExpenses = (state: GameState): number => {
  const food = 25;  // From economy.json
  const rent = calculateRent(state);
  const loanPayments = calculateDailyLoanPayments(state);
  
  return food + rent + loanPayments;
};

export const selectPassiveIncome = (state: GameState): number => {
  const rentalIncome = state.npcs.renters.reduce((sum, r) => sum + r.dailyRate, 0);
  const employeeRevenue = state.npcs.employees.reduce((sum, e) => sum + e.dailyRevenue * 0.55, 0);
  
  return rentalIncome + employeeRevenue;
};
```

---

## 6. Build Phases

### Phase 0: Foundation (Week 1)
**Goal**: Project skeleton that runs

- [ ] Initialize Electron + React + TypeScript project
- [ ] Set up directory structure
- [ ] Create data loading system (JSON → typed objects)
- [ ] Implement seeded RNG
- [ ] Create basic Zustand store
- [ ] Build development hot-reload for data files
- [ ] Create data validator tool

**Deliverable**: App launches, loads JSON, displays "Hello Shitbox"

---

### Phase 1: Core Loop (Weeks 2-3)
**Goal**: Playable time/energy/money cycle

- [ ] Implement `GameState` type and initial state creation
- [ ] Build time system (hours, days, time-of-day)
- [ ] Build resource system (money, energy)
- [ ] Create activity execution engine
- [ ] Implement prerequisite checking
- [ ] Build stat system with growth
- [ ] Create basic HUD (money, energy, time, stats)
- [ ] Implement save/load
- [ ] Add death conditions (starvation)

**Data files needed**:
- `economy.json` (base values)
- `activities/misc.json` (eat, sleep, wait)

**Deliverable**: Can start game, watch time pass, energy deplete, eat food, sleep, die if broke

---

### Phase 2: World & Basic Activities (Weeks 4-5)
**Goal**: Navigate locations, perform work

- [ ] Build map screen with clickable locations
- [ ] Create location menu system
- [ ] Implement activity UI (select, confirm, see results)
- [ ] Add scrapyard activities (labor, scavenge)
- [ ] Add basic car wash job
- [ ] Implement inventory (parts)
- [ ] Build time-of-day visuals
- [ ] Add newspaper system (basic)

**Data files needed**:
- `activities/scrapyard.json`
- `newspaper-templates.json`

**Deliverable**: Can work at scrapyard, earn money, buy newspaper, survive

---

### Phase 3: Cars & Garage (Weeks 6-7)
**Goal**: Own, store, and maintain cars

- [ ] Implement car data structure
- [ ] Build car card component
- [ ] Create garage system (storage, basic repairs)
- [ ] Implement engine/body condition
- [ ] Add repair activities
- [ ] Create workshop (major repairs, engine replacement)
- [ ] Build parts usage system
- [ ] Add car degradation over use

**Data files needed**:
- `cars.json` (start with 10-15 cars)
- `activities/garage.json`
- `activities/workshop.json`

**Deliverable**: Can own cars, store them, repair them, watch them degrade

---

### Phase 4: Negotiation (Weeks 8-10)
**Goal**: Buy and sell through negotiation

- [ ] Implement NPC generation with traits
- [ ] Build negotiation state machine
- [ ] Create negotiation UI
- [ ] Implement trait effects on behavior
- [ ] Add charisma-based trait visibility
- [ ] Build offer/counter-offer system
- [ ] Add multi-dimensional trade options
- [ ] Implement research mechanic (learn about seller)
- [ ] Connect to scrapyard car buying
- [ ] Add private sale listings

**Data files needed**:
- `traits.json`
- Activity updates for negotiate activities

**Deliverable**: Can negotiate to buy/sell cars with personality-driven NPCs

---

### Phase 5: Driving Jobs & Licenses (Weeks 11-12)
**Goal**: Earn money with your car

- [ ] Implement license system
- [ ] Add school/library location
- [ ] Create license courses and tests
- [ ] Build delivery job system
- [ ] Add taxi job system
- [ ] Implement risk system (tickets, damage)
- [ ] Add fuel costs
- [ ] Create rideshare variant

**Data files needed**:
- `licenses.json`
- `activities/school.json`
- `activities/driving.json`

**Deliverable**: Can get license, do deliveries/taxi, manage fuel and risk

---

### Phase 6: Financial Systems (Weeks 13-14)
**Goal**: Banking, loans, investments

- [ ] Build bank location
- [ ] Implement savings account
- [ ] Create index fund with daily returns
- [ ] Build loan system
- [ ] Implement interest calculations
- [ ] Add missed payment consequences
- [ ] Create repossession system
- [ ] Implement bankruptcy death condition

**Data files needed**:
- `loans.json`
- `activities/bank.json`

**Deliverable**: Can save, invest, borrow, go bankrupt

---

### Phase 7: Racing (Weeks 15-16)
**Goal**: Racing minigame

- [ ] Build racetrack location
- [ ] Create race initialization
- [ ] Implement gear-shifting minigame
- [ ] Build RPM gauge UI
- [ ] Add opponent simulation
- [ ] Create race finish and results
- [ ] Implement prize payouts
- [ ] Add practice sessions
- [ ] Create car lending system

**Data files needed**:
- `races.json`
- `activities/racetrack.json`

**Deliverable**: Can enter and race, skill matters, win prizes

---

### Phase 8: Housing & Properties (Week 17)
**Goal**: Rest quality progression, property ownership

- [ ] Implement apartment renting
- [ ] Add property buying
- [ ] Create rest quality system
- [ ] Build rental income (renting out)
- [ ] Add property value fluctuation
- [ ] Implement mortgages

**Data files needed**:
- `properties.json`
- `activities/apartments.json`

**Deliverable**: Can rent/buy housing, rest quality affects gameplay

---

### Phase 9: Auction & Market (Week 18)
**Goal**: Car auctions, market dynamics

- [ ] Build auction lot location
- [ ] Implement auction schedule
- [ ] Create bidding system
- [ ] Add consignment
- [ ] Implement market trends
- [ ] Connect trends to newspaper

**Data files needed**:
- `activities/auction.json`
- Expand `newspaper-templates.json`

**Deliverable**: Can attend auctions, bid, consign cars

---

### Phase 10: Scaling Up (Weeks 19-20)
**Goal**: Tier 2+ content

- [ ] Add truck driving system
- [ ] Implement employee hiring
- [ ] Build truck warehouse/fleet
- [ ] Create showroom location
- [ ] Add salesperson job
- [ ] Implement dealer license
- [ ] Build dealership ownership

**Data files needed**:
- `activities/showroom.json`
- Expand `cars.json` with more vehicles
- Employee types data

**Deliverable**: Can build a fleet, hire drivers, work toward dealer status

---

### Phase 11: Victory & Polish (Weeks 21-22)
**Goal**: Complete game loop

- [ ] Add Ferrari 250 GTO to car database
- [ ] Implement victory detection
- [ ] Create victory screen with stats
- [ ] Build post-victory sandbox mode
- [ ] Add stat allocation screen for new game
- [ ] Implement multiple save slots
- [ ] Add autosave
- [ ] Create progress warnings

**Deliverable**: Complete playable game from start to GTO

---

### Phase 12: Balance & QA (Weeks 23-24)
**Goal**: Tune the numbers

- [ ] Build automated balance tester
- [ ] Run simulations for each archetype
- [ ] Tune early game survival curve
- [ ] Balance mid-game income scaling
- [ ] Verify late-game reachability
- [ ] Test edge cases (max debt, etc.)
- [ ] Playtest with humans
- [ ] Iterate on data files

**Deliverable**: Balanced, playtested game

---

## 7. Testing Strategy

### 7.1 Unit Tests (Engine)

All engine code is pure functions, making testing straightforward:

```typescript
// src/engine/__tests__/activity.test.ts

describe('executeActivity', () => {
  it('should deduct energy and time for manual labor', () => {
    const state = createTestState({ energy: 100 });
    const rng = new RNG(12345);
    
    const result = executeActivity(state, 'manual_labor', { hours: 4 }, rng);
    
    expect(result.success).toBe(true);
    expect(result.delta.player.energy).toBeLessThan(0);
    expect(result.delta.time.hours).toBe(4);
  });
  
  it('should fail if not enough energy', () => {
    const state = createTestState({ energy: 5 });
    const rng = new RNG(12345);
    
    const result = executeActivity(state, 'manual_labor', { hours: 4 }, rng);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('energy');
  });
});
```

### 7.2 Integration Tests

```typescript
// src/__tests__/gameLoop.integration.test.ts

describe('Full day simulation', () => {
  it('should survive a day with proper money management', () => {
    const store = createTestStore();
    store.getState().newGame('Test', { charisma: 5, mechanical: 5, fitness: 5, knowledge: 5, racing: 5 });
    
    // Work
    store.getState().performActivity('manual_labor', { hours: 8 });
    
    // Should have earned money
    expect(store.getState().gameState!.player.money).toBeGreaterThan(0);
    
    // Sleep
    store.getState().performActivity('sleep', { hours: 8 });
    
    // Should be next day
    expect(store.getState().gameState!.time.currentDay).toBe(2);
    
    // Should still be alive
    expect(store.getState().gameState!.player.daysWithoutFood).toBe(0);
  });
});
```

### 7.3 Balance Testing Tool

```typescript
// tools/balance-tester.ts

interface SimulationConfig {
  archetype: 'charisma' | 'mechanical' | 'fitness' | 'knowledge' | 'racing' | 'balanced';
  strategy: 'conservative' | 'aggressive' | 'random';
  maxDays: number;
  runs: number;
}

interface SimulationResult {
  daysToMilestones: {
    firstCar: number[];
    tenThousand: number[];
    hundredThousand: number[];
    million: number[];
    gto: number[];
  };
  deathRate: number;
  averageNetWorthByDay: Map<number, number>;
}

async function runSimulation(config: SimulationConfig): Promise<SimulationResult> {
  // Automated playthrough with strategy-based decisions
  // Returns statistics for balance analysis
}

// Run from CLI:
// npx ts-node tools/balance-tester.ts --archetype=mechanical --runs=1000
```

### 7.4 Data Validation

```typescript
// tools/data-validator.ts

import Ajv from 'ajv';
import { economySchema, activitySchema, carSchema, traitSchema } from './schemas';

function validateAllData(): ValidationResult {
  const ajv = new Ajv();
  const errors: ValidationError[] = [];
  
  // Validate each JSON file against its schema
  // Check cross-references (car IDs exist, trait IDs exist, etc.)
  // Verify no broken formulas
  // Check for balance red flags (negative costs, etc.)
  
  return { valid: errors.length === 0, errors };
}
```

---

## Summary

This architecture prioritizes:

1. **Data-driven balance**: All numbers in JSON for easy tuning
2. **Testability**: Pure engine functions with no side effects
3. **Maintainability**: Clear separation of concerns
4. **Iterability**: Hot-reload data in dev, automated balance testing

The 24-week timeline gets you to a complete, balanced game. Phases 1-4 give you a playable core loop around week 10. Each subsequent phase adds a complete feature vertical.

The JSON structure means you can tweak every number without touching code—essential for the extensive playtesting this game will need.
