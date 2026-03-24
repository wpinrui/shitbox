/**
 * Core game state types
 * All game state is serializable (JSON.stringify safe)
 */

export interface GameState {
  meta: GameMeta;
  time: GameTime;
  player: Player;
  inventory: Inventory;
  assets: Assets;
  finance: Finance;
  market: Market;
  npcs: NpcState;
  newspaper: NewspaperState;
  progression: Progression;
  history: History;
}

export interface GameMeta {
  saveId: string;
  version: string;
  createdAt: number;
  lastSavedAt: number;
  rngSeed: number;
}

export interface GameTime {
  currentDay: number;
  currentHour: number; // 0-23
  currentMinute: number;
}

export interface Player {
  name: string;
  money: number;
  energy: number;
  position: GridPosition; // Grid coordinate on town map

  stats: PlayerStats;
  licenses: string[];
  completedCourses: string[];

  housing: {
    type: 'shitbox' | 'renting' | 'owning';
    propertyId: string | null;
  };

  daysWithoutFood: number;
}

export interface PlayerStats {
  charisma: number;
  mechanical: number;
  fitness: number;
  knowledge: number;
  driving: number;
}

export type StatName = keyof PlayerStats;

export interface GridPosition {
  x: number;
  y: number;
}

export interface Inventory {
  cars: OwnedCar[];
  engineParts: number;
  bodyParts: number;
}

export interface OwnedCar {
  instanceId: string;
  carId: string;
  engineCondition: number; // 0-100
  bodyCondition: number; // 0-100
  fuel: number; // Liters of fuel
  fuelCapacity: number; // Max liters
  position: GridPosition; // Grid coordinate on town map
  acquiredDay: number;
  acquiredPrice: number;
}

export interface CarDefinition {
  id: string;
  make: string;
  model: string;
  year: number;
  category: string;
  tier: number;
  baseStats: {
    power: number;
    topSpeed: number;
    weight: number;
    fuelEfficiency: number; // L/100km
    capacity: { passengers: number; cargo: number };
    prestige: number;
  };
  marketValue: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
    scrap: number;
  };
  repairCosts: {
    enginePerPercent: number;
    bodyPerPercent: number;
    engineReplacement: number;
  };
  fuelCapacity: number;
  fuelCostPerKm: number;
  imageUrl: string;
  bio: string;
  isVictoryCar?: boolean;
}

export type ConditionRating = 'excellent' | 'good' | 'fair' | 'poor' | 'scrap';

export interface ConditionRatingRange {
  min: number;
  max: number;
}

export interface CarDataConfig {
  version: string;
  scrapPricePerKg: number;
  cars: CarDefinition[];
  conditionRatings: Record<ConditionRating, ConditionRatingRange>;
}

export interface Assets {
  garage: OwnedGarage | null;
  workshop: OwnedWorkshop | null;
  properties: OwnedProperty[];
  dealership: OwnedDealership | null;
}

export interface OwnedGarage {
  id: string;
  capacity: number;
  value: number;
}

export interface OwnedWorkshop {
  id: string;
  equipmentLevel: number;
  value: number;
}

export interface OwnedProperty {
  id: string;
  propertyId: string;
  currentValue: number;
  acquiredPrice: number;
  acquiredDay: number;
}

export interface OwnedDealership {
  id: string;
  name: string;
  reputation: number;
  inventory: string[]; // Car instance IDs
}

export interface Finance {
  savings: number;
  indexFund: {
    invested: number;
    pendingWithdrawal: number;
    withdrawalAvailableDay: number;
  };
  loans: Loan[];
}

export interface Loan {
  id: string;
  type: 'personal' | 'auto' | 'mortgage' | 'business';
  principal: number;
  remainingBalance: number;
  apr: number;
  monthlyPayment: number;
  missedPayments: number;
  collateralId: string | null;
  startDay: number;
}

export interface Market {
  currentListings: CarListing[];
  playerListings: PlayerListing[];
  auctionSchedule: AuctionEvent[];
  marketTrends: MarketTrend[];
}

export interface CarListing {
  id: string;
  carId: string;
  condition: { engine: number; body: number };
  askingPrice: number;
  sellerId: string;
  expiresDay: number;
  source: 'scrapyard' | 'private' | 'auction' | 'dealer';
}

export interface PlayerListing {
  id: string;
  carInstanceId: string;
  askingPrice: number;
  adType: 'free' | 'paid';
  createdDay: number;
}

export interface AuctionEvent {
  id: string;
  day: number;
  carIds: string[];
}

export interface MarketTrend {
  category: string;
  modifier: number; // multiplier like 1.1 or 0.9
  expiresDay: number;
}

export interface NpcState {
  renters: RenterContract[];
  employees: Employee[];
}

export interface NegotiationNpc {
  id: string;
  name: string;
  traits: string[];
  revealedTraits: string[];
  targetPrice: number;
  walkAwayPrice: number;
  currentMood: number; // -1 to 1
}

export interface NegotiationItem {
  type: 'car';
  id: string; // listing ID
  carId: string;
  marketValue: number;
  askingPrice: number;
}

export interface NegotiationOffer {
  price: number;
}

export interface NpcResponse {
  type: 'counter' | 'accept' | 'walk_away';
  counterOffer?: NegotiationOffer;
  moodChange: number;
  dialogue: string;
}

export interface NegotiationRound {
  roundNumber: number;
  playerOffer: NegotiationOffer;
  npcResponse: NpcResponse;
}

export interface NegotiationState {
  id: string;
  type: 'buy';
  npc: NegotiationNpc;
  item: NegotiationItem;
  history: NegotiationRound[];
  status: 'active' | 'accepted' | 'walked_away';
  acceptedPrice?: number;
}

export interface RenterContract {
  id: string;
  npcId: string;
  assetType: 'car' | 'garage' | 'workshop' | 'property';
  assetId: string;
  dailyRate: number;
  startDay: number;
  endDay: number | null;
}

export interface Employee {
  id: string;
  npcId: string;
  role: 'driver' | 'mechanic' | 'salesperson';
  dailyWage: number;
  dailyRevenue: number;
  hiredDay: number;
}

export interface NewspaperState {
  currentDay: number;
  content: NewspaperContent | null;
  purchased: boolean;
}

export interface NewspaperContent {
  headlines: string[];
  classifieds: ClassifiedAd[];
  auctionPreviews: string[];
  marketNews: string[];
  gigs: GigListing[];
  roadTripNews: string[];
  indexFundNews: string;
}

export interface ClassifiedAd {
  id: string;
  type: 'car' | 'job' | 'equipment';
  title: string;
  description: string;
  price?: number;
}

export interface GigListing {
  id: string;
  title: string;
  description: string;
  pay: number;
  timeCost: number;
  energyPerHour: number;
  day: number;
  requirements: string[];
  taken: boolean;
}

export interface Progression {
  totalEarnings: number;
  carsFlipped: number;
  roadTripsCompleted: number;
  totalEngagement: number;
  subscribers: number;
  highestCarValue: number;
  gtoAcquired: boolean;
  gtoAcquiredDay: number | null;
}

export interface History {
  actions: ActionLog[];
}

export interface ActionLog {
  timestamp: number;
  day: number;
  action: string;
  params: Record<string, unknown>;
  result: 'success' | 'failure';
}

// Activity-related types
export interface ActivityResult {
  success: boolean;
  error?: string;
  delta?: StateDelta;
  narrative?: string;
}

export interface StateDelta {
  player?: Partial<{
    energy: number;
    money: number;
    stats: Partial<PlayerStats>;
    daysWithoutFood: number;
  }>;
  time?: {
    hours: number;
  };
  inventory?: Partial<{
    engineParts: number;
    bodyParts: number;
  }>;
  carUpdates?: Array<{
    instanceId: string;
    fuel?: number;
    engineCondition?: number;
    bodyCondition?: number;
    position?: GridPosition;
  }>;
  removedCarInstanceId?: string;
  marketUpdates?: Partial<Market>;
  newspaper?: Partial<NewspaperState>;
  events?: GameEvent[];
}

export type GameEventType =
  | 'food_eaten'
  | 'food_purchased'
  | 'new_day'
  | 'hunger_warning'
  | 'hunger_critical'
  | 'death_imminent'
  | 'death'
  | 'items_found'
  | 'car_refueled'
  | 'listings_shown'
  | 'car_acquired'
  | 'car_removed'
  | 'conditional_cost'
  | 'newspaper_purchased'
  | 'gig_completed'
  | 'car_repaired'
  | 'car_scrapped'
  | 'car_towed'
  | 'engine_replaced';

export interface GameEvent {
  type: GameEventType;
  message: string;
  data?: Record<string, unknown>;
}

// Stat allocation for new game
export interface StatAllocation {
  charisma: number;
  mechanical: number;
  fitness: number;
  knowledge: number;
  driving: number;
}
