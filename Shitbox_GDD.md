# SHITBOX — Game Design Document

**Version 1.0 — December 2025**

> **Note:** The skill system and racing mechanics in this document have been superseded. See [Shitbox_Skills.md](Shitbox_Skills.md) for the current skill system design (5 stats: Charisma, Mechanical, Fitness, Knowledge, Driving) and Road Trip content creation system.

---

## 1. Executive Summary

**Shitbox** is a car-themed economic life simulation where players experience the ultimate rags-to-riches fantasy. Starting as an 18-year-old with nothing but a broken-down vehicle salvaged from a scrapyard, players must hustle, negotiate, and strategize their way from poverty to prosperity.

The core fantasy is **The Hustle**—reading opportunities, managing scarce resources, and making clever decisions under pressure. Every interaction is a potential deal, every asset can be flipped, and the player who masters the system will rise fastest.

Victory is measured by **days elapsed**. The player who reaches their goal fastest wins. The ultimate aspiration is the Ferrari 250 GTO (~$70M), but players define their own finish line—a paid-off apartment and a reliable car is a valid victory for many.

---

## 2. Core Design Pillars

### 2.1 The Hustler Fantasy

The player character is an idealized hustler: infinite resilience, perfect discipline, no vices, no self-sabotage. The only limits are the systems and the player's skill at navigating them. This creates a power fantasy of pure optimization in human form.

### 2.2 Economic Consistency

Four principles govern all transactions:

- **Everything that can be bought can be sold**
- **Everything that can be sold can be negotiated** (unless at official shops/showrooms)
- **Almost anything can be rented out** (or rented by the player)
- **Realistic economics**—real-world prices, real consequences

### 2.3 Abstracted Depth

Almost every activity reduces to: *Activity(parameters, context) → {Δmoney, Δenergy, Δtime, outcomes}*. The engine stays small; variety comes from the activity catalog. Only negotiation gets dedicated interaction.

---

## 3. Player Resources

### 3.1 Primary Resources

| Resource | Function | Dynamics |
|----------|----------|----------|
| **Money** | Primary progression metric; enables all purchases and unlocks | Earned through work, flipping, rentals. Spent on assets, food (constant daily cost), repairs, rent/mortgage |
| **Energy** | Limits daily activity; harder labor drains faster | Regenerates through rest. Rest quality depends on shelter (shitbox = poor, apartment = good) |
| **Time** | Day counter is the score; time-of-day affects availability and visuals | Activities skip time forward. Lower day count = better run. Some locations/activities are time-gated |

### 3.2 Player Stats

Stats are distributed at game start (fewer points = harder challenge). They grow through a hybrid system: slow passive gain from relevant activities, faster gains from dedicated training (school, gym, racing lessons).

| Stat | Effects | Archetype |
|------|---------|-----------|
| **Charisma** | Negotiation effectiveness; probability of seeing NPC personality traits; better rental/sales ad response rates | *"Charisma Chad"* — wins through deals |
| **Mechanical** | Repair speed/quality; spotting true car value; better scrapyard finds | *"Grease Monkey"* — hidden gems |
| **Fitness** | Energy efficiency (-X% drain); manual labor output bonus | *"Workhorse"* — grind master |
| **Knowledge** | Unlock opportunities earlier; better research outcomes; spot hidden listings | *"Scholar"* — plays the system |
| **Racing** | Bonus power in races; affects racing minigame performance | *"Speed Demon"* — prize money |

### 3.3 Inventory

- **Cars** — Owned vehicles with individual stats and condition tracking
- **Engine Parts** — Generic, stackable. Reduce engine repair costs when used
- **Body Parts** — Generic, stackable. Reduce body repair costs when used

---

## 4. Cars

Cars are the central object of the game—both tools for making money and assets to be traded. Each car is represented by a **Car Card** showing: picture (Wikipedia-sourced), stats, condition bars, estimated value, and a short bio.

### 4.1 Car Stats

| Stat | Description |
|------|-------------|
| Power/Speed | Racing performance, job efficiency (faster deliveries) |
| Engine Condition | Affects power output, fuel efficiency. Degrades with use. At zero, engine dies (requires expensive replacement) |
| Body Condition | Cosmetic only. Affects resale value and eligibility for prestige gigs. No catastrophic failure |
| Capacity | Passengers (taxi), cargo (deliveries), towing capability |
| Fuel Efficiency | Running cost per trip. Poor engine condition worsens this |
| Style/Prestige | Affects sale price premium, unlocks certain gigs, racing class eligibility |

### 4.2 Repairs

Two repair paths exist:

- **DIY** — Costs time + parts. Mechanical stat affects speed and quality. Cheaper in the long run. Requires workshop for major repairs (engine replacement)
- **Pay a mechanic** — Costs money only. Faster, but expensive. Available anywhere

Parts (body/engine) found at the scrapyard reduce repair costs. Higher Mechanical stat = better chance of finding usable parts per scavenge trip.

---

## 5. World & Locations

The world is presented as a **point-and-click map**. Players click locations to travel there (travel may cost a small amount of time). Time-of-day affects visual appearance and what's available. Each location opens a menu of available activities.

| Location | Available Activities |
|----------|---------------------|
| **Scrapyard** | Scavenge for parts (body/engine), sell scrap, find cheap project cars, manual labor jobs |
| **Garage** | Store cars, perform basic repairs (if owned), view owned vehicles |
| **Workshop** | Major repairs (engine replacement), equipment storage, can rent bench time if not owned, work as mechanic |
| **Apartments** | Rent or buy housing. Better shelter = better rest quality = more efficient energy recovery |
| **Auction Lot** | Car auctions (twice weekly). Browse, bid, buy. Higher volume, less negotiation flexibility |
| **Racetrack** | Race for prize money (requires car), lend car to pro drivers, work as track mechanic |
| **School / Library** | Training: spend time + money to increase stats. Get licenses (driver's, taxi, truck) |
| **Showroom** | Buy new cars at list price (no negotiation). Later: work as salesperson, become dealer |
| **Bank** | Savings account, index fund investment, loans |

---

## 6. Negotiation System

Negotiation is the core interactive verb of Shitbox. Unlike other activities (which are abstracted button presses), negotiation is a dedicated mini-system where player skill and character stats combine.

### 6.1 Flow

1. **Encounter** — See item/service listed at asking price
2. **Research (optional)** — Spend time/energy to learn more about true value and seller's floor
3. **Open** — Make initial offer (or accept list price to skip)
4. **Counter** — They respond with counter-offer or reaction
5. **Iterate** — Continue back-and-forth, use multi-dimensional levers
6. **Close** — Deal accepted, rejected, or they walk away

### 6.2 Multi-Dimensional Trades

Negotiations aren't just about price. Available levers include:

- Price adjustment
- Include/exclude extras (spare parts, accessories)
- Payment terms (cash now vs. later)
- Delivery/pickup arrangements
- Bundle deals

### 6.3 NPC Personality Traits

Every buyer, seller, renter, and rentee has procedurally generated personality traits (2-4 compatible traits per NPC). **Charisma determines the probability of each trait being visible** on first meeting. Unrevealed traits still govern behavior—players can deduce from patterns.

| Trait | Effect on Negotiation |
|-------|----------------------|
| Impatient | Accepts faster, but walks away quickly if you stall |
| Patient | Willing to haggle forever, waits for their price |
| Desperate | Has urgent need, will accept worse deals |
| Firm | Knows what they want, narrow negotiation band |
| Prideful | Lowball offers insult them, deal dies fast |
| Pragmatic | Doesn't take offers personally, pure numbers |
| Naive | Doesn't know true value, exploitable |
| Savvy | Knows the market, hard to fool |
| Cautious | Wants guarantees, slow to commit |
| Impulsive | Quick decisions, might overpay or undersell |

---

## 7. Financial Systems

### 7.1 Bank Services

| Service | Risk | Return | Use Case |
|---------|------|--------|----------|
| **Savings** | None | Low interest | Parking cash safely |
| **Index Fund** | Medium (RNG variance) | Variable, potentially high | Passive income |
| **Loan** | High (repo → bankruptcy) | Immediate capital | Leveraged plays |

### 7.2 Index Fund Details

- Updates daily (RNG-driven returns)
- Withdraw anytime, but 1-day delay on liquidity
- Safe fund: no negative returns, but can have low/zero returns
- Can borrow to invest (leveraged degen play)

### 7.3 Loan Consequences

Debt is very punishing:

1. **Interest compounds** — Missed payments grow the debt
2. **Repossession** — Miss payments and the bank takes your assets (car, workshop, etc.)
3. **Bankruptcy = Game Over** — If debt becomes unpayable, the run ends

---

## 8. Newspaper

The newspaper is the dynamic content delivery system. It costs a small amount of money (no time to read). Each day's paper is procedurally generated from world state + RNG. It keeps the world feeling alive without interrupting player agency.

**Contents:**

- **Classifieds** — Private car sales, job listings, equipment for sale
- **Auction previews** — What's coming up this week
- **Market trends** — "Truck prices up this month" (affects flip strategy)
- **One-off gigs** — "Moving company needs driver Saturday, $200"
- **Race announcements** — Upcoming events, entry fees, prize pools
- **Index fund updates** — "Markets up 3% this week"

*Knowledge stat payoff:* Higher Knowledge could mean spotting "hidden" listings others miss.

---

## 9. Advertising & Rental System

Players can rent out owned assets or find tenants/buyers through advertising:

- **Free ads** — Lower probability per hour of someone being interested
- **Paid ads** — Higher probability, costs money
- When someone responds, enter negotiation (they have personality traits)

**Rentable assets:**

- Cars (to drivers, to racers)
- Garage space
- Workshop bench time
- Trucks (to hired drivers)
- Apartments (if owned)

---

## 10. Racing Minigame

Racing is the one active skill moment in an otherwise decision-based game. It's a reaction-based gear-shifting minigame where player execution matters.

### 10.1 Mechanics

- **Visual**: RPM gauge + progress line with dots (you and opponents)
- **Input**: Player shifts gears 1→6, timing matters
- **Optimal shift**: Shift at peak RPM for maximum acceleration
- **Early shift**: Sluggish acceleration, lose time
- **Late shift**: Hit the limiter, waste time

### 10.2 Variables

- **Your speed** = Base car power × engine condition % + Racing stat bonus
- **Car condition**: Down on power if engine is worn
- **Car quality**: Irrelevant to winning (you race similar cars), but affects prize money (more glamorous = higher stakes)
- **Opponents**: Simulated as dots on the progress line at their own competence level
- **Stakes**: Time and entry fee only. Bad shifts cost time, not car damage

---

## 11. Progression Tiers

These tiers are not rigid gates but typical stages players pass through. Mechanics remain consistent throughout; what changes is access and scale.

### Tier 0: Survival

Player spawns as an 18-year-old with nothing. They've wandered to the scrapyard and claimed a shitbox (might be worth scrap value). No driver's license, no cash. Fail to afford food for 2 days = death. Options: manual labor, scavenge parts, sell scrap, maybe sell the shitbox for seed money.

### Tier 1: Mobile

Working car + driver's license. Can do deliveries, taxi rides. These incur fuel costs and risk (speeding tickets, damaged products). Can browse used car market—buy low, sell high. Negotiation becomes central. Need garage or season parking to hold multiple cars. Can access school/library for skill training.

### Tier 2: Operator

Equipment to buy/fix/flip seriously. Own a workshop. Buy a truck warehouse, become a truck driver (need license or risk fines). Hire drivers, negotiate their pay, RNG generates their revenue. Loan cars to pro racers or race yourself. Work as mechanic at the racetrack.

### Tier 3: Mogul

Become a dealer. Work with car companies to sell their inventory. Negotiate with customers, run marketing campaigns. Buy properties. Real estate investment. Rent out assets at scale.

### Tier 4: Legend

Ferrari 250 GTO acquired. Game records the day count. Player can continue indefinitely—no more goals, just sandbox. Most players will stop long before this, satisfied with their personal definition of success.

---

## 12. Fail States

- **Starvation**: Fail to afford food for 2 consecutive days → Death → Run ends
- **Bankruptcy**: Debt becomes unpayable after repossession → Run ends

---

## 13. Technical Specification

### 13.1 Stack

- Electron + React + TypeScript
- Desktop only (Windows, Mac, Linux)

### 13.2 Architecture Philosophy

One core loop: *Activity(parameters, context) → {Δmoney, Δenergy, Δtime, outcomes}*. Each "feature" is content in a data structure, not a new system. The engine stays small; variety comes from the activity catalog. Only negotiation and racing get dedicated interaction systems.

### 13.3 Save System

- Multiple save slots
- Autosave
- Progress loss warning and confirmation on overwrite/delete

### 13.4 Visual Design

- Point-and-click map (location nodes)
- Menu overlays for activities
- Car cards with Wikipedia-sourced images
- Time-of-day visual changes on map
- Minimal art assets overall

### 13.5 Audio

Silent for initial release. Music/SFX to be added later if desired.

### 13.6 Onboarding

None. Players are thrown in and figure it out. The game is designed to be readable through its UI.

---

## 14. Appendix: Schell's Lenses Applied

This design was developed using principles from "The Art of Game Design: A Book of Lenses":

- **Lens of Essential Experience**: The Hustle—reading opportunities, managing scarcity, making clever decisions
- **Lens of the Protagonist**: Player IS the underdog, not watching one
- **Lens of the Ramp**: Progression is about recognizing minimum investment to reach next tier
- **Lens of the Pyramid**: Early game = survival, mid game = accumulation, late game = optimization
- **Lens of Time**: Skip-ahead system with day counter as score
- **Lens of Actions**: Decision-making is the core skill, not dexterity (except racing)
- **Lens of the Toy**: Negotiation should be fun to play with even outside optimal strategy
- **Lens of Character Traits**: Stats reflect how your hustler hustles—implicit narrative
- **Lens of Scope**: Everything reduces to one formula; complexity comes from content, not systems
- **Lens of Chance**: RNG creates variance without randomizing outcomes entirely

---

*— End of Document —*
