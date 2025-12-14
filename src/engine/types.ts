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
  activeNegotiations: NegotiationState[];
  renters: RenterContract[];
  employees: Employee[];
}

export interface NegotiationState {
  id: string;
  type: 'buy' | 'sell' | 'rent';
  npcId: string;
  itemId: string;
  status: 'active' | 'accepted' | 'rejected' | 'walked_away';
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
  pay: number;
  day: number;
  requirements: string[];
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
  events?: GameEvent[];
}

export type GameEventType =
  | 'food_eaten'
  | 'new_day'
  | 'hunger_warning'
  | 'hunger_critical'
  | 'death_imminent'
  | 'death';

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
