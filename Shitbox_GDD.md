# SHITBOX — Game Design Document

**Version 1.0 — December 2025**

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

Stats are distributed at game start (10 points total, all stats start at 0, max 20 per stat). They grow through a hybrid system: slow passive gain from relevant activities (0.02/hour), faster gains from dedicated training at gym, library, or driving school (0.15/hour base). See [Shitbox_Skills.md](Shitbox_Skills.md) for complete stat system details.

| Stat | Effects | Archetype |
|------|---------|-----------|
| **Charisma** | Counter-offer shift (+1%/pt), insult threshold (×0.99/pt), interest ceiling (×1.01/pt) — all multiplicative on trait/RNG base | *"Charisma Chad"* — wins through deals |
| **Mechanical** | DIY repair time/cost (-2%/pt), condition assessment error (-0.4%/pt from ±10% base), lemon chance (-0.2%/pt from 5% base), mechanic earnings (+5%/pt) | *"Grease Monkey"* — hidden gems |
| **Fitness** | Energy cost (-2%/pt), physical labor earnings (+5%/pt), rest efficiency (+2%/pt), road trip engagement fatigue decay (+0.005/pt from 0.80 base) | *"Workhorse"* — grind master |
| **Knowledge** | Lessons required (-3%/pt), training gains (+3%/pt), passive skill gains (+3%/pt), investment return (+0.25%/pt annual from 5% base) | *"Scholar"* — plays the system |
| **Driving** | Road trip risk (-2%/pt), delivery earnings (+3%/pt), ticket avoidance (-2%/pt), fuel efficiency (-1.5%/pt), car wear (-1.5%/pt) | *"Content Creator"* — road trip revenue |

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
| Power/Speed | Road trip stunt performance, job efficiency (faster deliveries) |
| Engine Condition | Affects power output, fuel efficiency. Degrades with use. At zero, engine dies (requires expensive replacement) |
| Body Condition | Cosmetic only. Affects resale value and eligibility for prestige gigs. No catastrophic failure |
| Capacity | Passengers (taxi), cargo (deliveries), towing capability |
| Fuel Efficiency | Running cost per trip. Poor engine condition worsens this |
| Style/Prestige | Affects sale price premium, road trip engagement bonuses (luxury or shitbox), content appeal |

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
| **Film School** | Cinematography training, equipment rental, content creation courses |
| **Gym** | Fitness training |
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
- **Trending content** — What road trip stunts are popular right now
- **Index fund updates** — "Markets up 3% this week"

*Knowledge stat payoff:* Higher Knowledge could mean spotting "hidden" listings others miss.

---

## 9. Advertising & Rental System

Players can rent out owned assets or find tenants/buyers through advertising:

- **Free ads** — Lower probability per hour of someone being interested
- **Paid ads** — Higher probability, costs money
- When someone responds, enter negotiation (they have personality traits)

**Rentable assets:**

- Cars (to drivers)
- Garage space
- Workshop bench time
- Trucks (to hired drivers)
- Apartments (if owned)

---

## 10. Road Trip Content Creation

Road trips are the content creation system—Top Gear/Grand Tour inspired adventures that generate social media engagement and income.

### 10.1 How It Works

1. **Select a car** — High base value OR low current value cars get engagement bonuses
2. **Plan stunts** — Choose from available activities (road test, rally racing, desert crossing, etc.)
3. **Execute trip** — Risk/reward for each stunt, Driving stat reduces risk
4. **Release video** — Engagement calculated based on stunts, equipment quality, and cinematography skill
5. **Grow audience** — Subscribers increase, revenue per video increases

### 10.2 Engagement System

**Base Engagement = Car Bonus + Sum(Stunt Engagement × Stunt Interest × Fatigue)**

- **Stunt Interest**: Each stunt has a cooldown (drops to 10% after use, recovers +10%/day)
- **Fatigue**: Engagement decays per day of trip (base ×0.80/day, Fitness improves this)
- **Video Quality**: Cinematography skill (×1.0 to ×2.0) × Equipment tier (low/mid/high)

### 10.3 Car Bonuses

- **High base value cars** (>$100k): Luxury adventure bonus
- **Low current value cars** (<$2k): Shitbox survival bonus
- **Exotic destruction**: Massive engagement if you destroy an expensive car (but huge financial loss)

### 10.4 Risk & Breakdown

- Each stunt has a base risk % (reduced by Driving stat at -2%/point)
- Failed stunts damage the car (10-40%)
- If car condition hits 0, it breaks down (towed home, trip ends, but partial content still released)
- "How to Destroy a Car" stunt = 100% risk, car is gone, very high engagement

### 10.5 Domain Skill: Cinematography

- Hidden until unlocked (first content-related activity)
- 0-20 scale like core stats, same growth rates
- Trained via: film school, studying cinematography, or making videos
- Effect: Video quality multiplier (×1.0 at 0, ×2.0 at 20)

---

## 11. Progression Tiers

These tiers are not rigid gates but typical stages players pass through. Mechanics remain consistent throughout; what changes is access and scale.

### Tier 0: Survival

Player spawns as an 18-year-old with nothing. They've wandered to the scrapyard and claimed a shitbox (might be worth scrap value). No driver's license, no cash. Fail to afford food for 2 days = death. Options: manual labor, scavenge parts, sell scrap, maybe sell the shitbox for seed money.

### Tier 1: Mobile

Working car + driver's license. Can do deliveries, taxi rides. These incur fuel costs and risk (speeding tickets, damaged products). Can browse used car market—buy low, sell high. Negotiation becomes central. Need garage or season parking to hold multiple cars. Can access school/library for skill training.

### Tier 2: Operator

Equipment to buy/fix/flip seriously. Own a workshop. Buy a truck warehouse, become a truck driver (need license or risk fines). Hire drivers, negotiate their pay, RNG generates their revenue. Start road trip content creation—buy equipment, learn cinematography, grow your subscriber base.

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

One core loop: *Activity(parameters, context) → {Δmoney, Δenergy, Δtime, outcomes}*. Each "feature" is content in a data structure, not a new system. The engine stays small; variety comes from the activity catalog. Only negotiation and road trip content creation get dedicated interaction systems.

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
- **Lens of Actions**: Decision-making is the core skill, not dexterity
- **Lens of the Toy**: Negotiation should be fun to play with even outside optimal strategy
- **Lens of Character Traits**: Stats reflect how your hustler hustles—implicit narrative
- **Lens of Scope**: Everything reduces to one formula; complexity comes from content, not systems
- **Lens of Chance**: RNG creates variance without randomizing outcomes entirely

---

*— End of Document —*
