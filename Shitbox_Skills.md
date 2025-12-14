# Shitbox Skill System Design

## Overview

- **5 Core Stats:** Charisma, Mechanical, Fitness, Knowledge, Driving
- **Starting Points:** 10 (all stats start at 0)
- **Max per Stat:** 20
- **Domain Skills:** Cinematography (hidden until unlocked)

---

## Core Stats

### Charisma (CHA)

Affects negotiation outcomes. All modifiers are multiplicative on trait/RNG-determined base values.

| Effect | Per Point | At 20 CHA |
|--------|-----------|-----------|
| Counter-offer shift | +1% closer to your offer | +20% shift |
| Insult threshold (buying) | ×0.99 | ×0.80 (can lowball 20% harder) |
| Interest ceiling (selling) | ×1.01 | ×1.20 (can ask 20% higher) |

**Mechanics:**
- **Counter-offer shift:** When you make an offer, NPC counter-offers move closer to your price
- **Insult threshold (buying):** Base threshold is trait/RNG dependent. Charisma multiplies it down, allowing harder lowballs before NPC walks away
- **Interest ceiling (selling):** Base ceiling is trait/RNG dependent. Charisma multiplies it up, allowing higher asking prices before buyers lose interest

---

### Mechanical (MEC)

Affects repairs, car assessment, and mechanic work income.

| Effect | Per Point | At 20 MEC |
|--------|-----------|-----------|
| DIY repair time | -2% | 40% faster |
| DIY repair material cost | -2% | 40% cheaper |
| Condition assessment error | -0.4% | ±2% (from ±10% base) |
| Lemon chance | -0.2% | 1% (from 5% base) |
| Mechanic work earnings | +5% | +100% hourly rate |

**Mechanics:**
- **DIY repairs:** Bonuses only apply when player does repairs themselves (not when paying others)
- **Condition assessment:** Displayed car condition has error margin. True condition = displayed ± error%
- **Lemon chance:** After purchase, car may reveal hidden problems and lose ~30% value. High MEC reduces this risk

---

### Fitness (FIT)

Affects energy efficiency, physical labor, rest, and road trip endurance.

| Effect | Per Point | At 20 FIT |
|--------|-----------|-----------|
| Energy cost reduction | -2% | 40% less energy per activity |
| Physical labor earnings | +5% | +100% hourly rate |
| Rest efficiency | +2% | +40% energy per hour of sleep |
| Road trip engagement fatigue | +0.005 decay rate | 0.90 decay (from 0.80 base) |

**Mechanics:**
- **Engagement fatigue:** During multi-day road trips, engagement decays exponentially per day
  - Base: ×0.80 per day (Day 1 = 100%, Day 2 = 80%, Day 3 = 64%)
  - At 20 FIT: ×0.90 per day (Day 1 = 100%, Day 2 = 90%, Day 3 = 81%)

---

### Knowledge (KNO)

Affects learning speed, skill gains, and investment returns.

| Effect | Per Point | At 20 KNO |
|--------|-----------|-----------|
| Lessons required for licenses | -3% | 40% fewer lessons |
| Training activity gains | +3% | +60% (0.15 → 0.24/hour) |
| Passive skill gains | +3% | +60% (0.02 → 0.032/hour) |
| Investment return | +0.25% annual | 10% annual (from 5% base) |

**Mechanics:**
- **Training activities:** Gym (Fitness), Library (Mechanical/Knowledge), Driving school (Driving), Film school (Cinematography)
- **Passive gains:** Earned from regular activities (e.g., scrapyard work → Fitness, DIY repairs → Mechanical)
- **Investments:** Single index fund with RNG returns. Knowledge improves expected return

---

### Driving (DRV)

Affects all driving-related activities including road trips, deliveries, and car wear.

| Effect | Per Point | At 20 DRV |
|--------|-----------|-----------|
| Road trip risk reduction | -2% | 40% lower stunt risk |
| Delivery job efficiency | +3% | +60% earnings |
| Ticket avoidance | -2% | 40% lower fine chance |
| Fuel efficiency | -1.5% | 30% less fuel cost |
| Car wear reduction | -1.5% | 30% less wear from driving |

---

## Skill Growth

### Base Rates
- **Passive gain:** 0.02 per hour of relevant activity
- **Training gain:** 0.15 per hour at base

### Growth is Flat
- No diminishing returns at higher levels
- Same rate from 0→1 as from 19→20

### Knowledge Multipliers
- Training: ×(1 + KNO × 0.03) — at 20 KNO: ×1.60
- Passive: ×(1 + KNO × 0.03) — at 20 KNO: ×1.60

### Example Growth
| Activity | Hours to Gain +1 | At 20 KNO |
|----------|------------------|-----------|
| Passive (working) | 50 hours | 31 hours |
| Training (gym/library) | 6.7 hours | 4.2 hours |

---

## Domain Skills

### Cinematography

**Unlocked by:** First content-related activity (planning road trip video, renting equipment, taking film course)

**Growth:** Same as core stats (0.02 passive, 0.15 training)

**Training methods:**
- Film school courses
- Reading/studying cinematography
- Making videos (passive gain while doing road trips)

**Effect:** Video quality multiplier for road trip content

| Cinematography Level | Video Quality Multiplier |
|---------------------|-------------------------|
| 0 | ×1.0 |
| 10 | ×1.5 |
| 20 | ×2.0 |

---

## Equipment System

For content creation (road trips).

| Tier | Video Quality | Audio Quality | Rent Cost | Buy Cost |
|------|---------------|---------------|-----------|----------|
| Low | ×1.0 | ×1.0 | Cheap | Cheap |
| Mid | ×1.25 | ×1.25 | Moderate | Moderate |
| High | ×1.5 | ×1.5 | Expensive | Expensive |

**Final video quality = Cinematography multiplier × Equipment video × Equipment audio**

---

## Road Trip System

### Overview
Take a car on an adventure, film it, earn money from engagement.

### Car Selection Bonuses
- **High base value cars:** Engagement bonus (luxury adventure)
- **Low current value cars:** Engagement bonus (shitbox survival challenge)
- **Exotic car destruction:** Massive engagement from shock factor (but financial loss)

### Stunt Selection
Each stunt has:
- **Risk %:** Chance of car damage/breakdown
- **Engagement:** Base viewer interest
- **Cooldown:** After performing, interest drops to 10%, recovers +10% per day
- **Requirements:** Some need mods (lifted suspension, snorkel, etc.)

### Example Stunts

**Low Risk / Low Reward:**
| Stunt | Base Risk | Engagement | Notes |
|-------|-----------|------------|-------|
| Road test | 5% | Low | Basic review content |
| Handbrake turn | 10% | Low-Med | Skill showcase |
| Track day | 10% | Medium | Controlled environment |

**Medium Risk / Medium Reward:**
| Stunt | Base Risk | Engagement | Notes |
|-------|-----------|------------|-------|
| Rally racing | 25% | Medium | Requires mods |
| Driving on ice | 30% | Medium-High | Seasonal? |
| Endurance racing | 20% | High | Long time investment |

**High Risk / High Reward:**
| Stunt | Base Risk | Engagement | Notes |
|-------|-----------|------------|-------|
| Climb a mountain | 40% | High | Mods required |
| Cross a desert | 45% | High | Multi-day trip |
| Cross salt pans | 35% | High | Unique visuals |

**Extreme Risk / Extreme Reward:**
| Stunt | Base Risk | Engagement | Notes |
|-------|-----------|------------|-------|
| Fit a jet engine | 50% | Very High | Massive mod cost |
| How to destroy a car | 100% | Very High | Car is destroyed |
| Turn into house/pub | 10% | Very High | Car unusable after |

### Engagement Calculation

```
Base Engagement = Car Bonus + Sum(Stunt Engagement × Stunt Interest × Fatigue)
Video Quality = Cinematography × Equipment
Final Engagement = Base Engagement × Video Quality
```

### Engagement Fatigue
- **Base decay:** ×0.80 per day of road trip
- **Fitness bonus:** +0.005 per FIT point to decay rate
- Example (5-day trip at 0 FIT): 100% → 80% → 64% → 51% → 41%
- Example (5-day trip at 20 FIT): 100% → 90% → 81% → 73% → 66%

### Stunt Cooldown
- After performing: interest drops to 10%
- Recovers +10% per day
- Full recovery: ~9 days

### Car Breakdown
If a car "fails" during a stunt:
- **Car is broken down** (not destroyed, unless stunt is "destroy car")
- **Towed home** (towing fee applies)
- **Needs major repairs** before usable again
- **Road trip ends early** — stunts before failure are released as content
- **Dramatic failure = content** — the breakdown itself may boost engagement

### Audience Growth
```
Reach = (Subscribers × Engagement) + Non-subscriber views
New Subscribers = Non-subscriber views × Conversion Rate
```

### Monetization
- Earn money only when posting videos
- Revenue based on reach
- No passive subscriber income
- No explicit sponsorship simulation

---

## Repair System

### Three Repair Options

| Method | Time | Cost | Notes |
|--------|------|------|-------|
| Pay someone | Low | High | No stat bonuses apply |
| DIY | Medium | Medium | MEC bonuses apply |
| Scrapyard parts | High | Low | MEC bonuses apply, uses scavenged parts |

### Mechanical Bonuses (DIY only)
- Time: -2% per MEC point (40% faster at 20)
- Material cost: -2% per MEC point (40% cheaper at 20)

---

## Condition System

### Display vs Reality
- Displayed condition has error margin based on Mechanical stat
- Base error: ±10%
- Per MEC point: -0.4%
- At 20 MEC: ±2%

### Value Calculation
```
Car Value = Base Price × (Condition / 100)
```

### Lemon Mechanic
- Base chance: 5% on any purchase
- Per MEC point: -0.2%
- At 20 MEC: 1% chance
- Effect: Car loses ~30% value after purchase due to hidden problems

---

## Summary Table

| Stat | Primary Domain | Key Benefit at 20 |
|------|----------------|-------------------|
| Charisma | Negotiation | 20% better deals |
| Mechanical | Cars & Repairs | 40% faster/cheaper DIY, 1% lemon chance |
| Fitness | Energy & Endurance | 40% less energy cost, better road trip stamina |
| Knowledge | Learning & Growth | 60% faster skill gains, 10% investment returns |
| Driving | All Driving | 40% less risk/tickets, 30% less fuel/wear |

---

## Notes for Balancing

- Road trips should be profitable at max skills but require significant time investment
- Cinematography + Equipment at max should roughly double engagement
- Exotic car destruction: huge engagement but almost never profitable (shock factor for content, not money)
- Stunt cooldowns prevent road-trip-only gameplay
- Knowledge is the "snowball" stat — invest early for faster growth in everything
