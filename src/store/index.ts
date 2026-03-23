import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  GameState,
  GameMeta,
  Player,
  StatAllocation,
  ActivityResult,
  StateDelta,
  GameEvent,
  GridPosition,
  ENGINE_VERSION,
  MAX_ENERGY,
  RNG,
  executeActivity,
  advanceTime,
  processNewDay,
  checkDeathConditions,
  getEconomyConfig,
  applyStatGains,
  executeWalk,
  executeDrive,
  getLocation,
  getCarDefinition,
  advanceTimeWithDayProcessing,
  type ActivityParams,
  type ActivityDefinition,
  type GigListing,
} from '@engine/index';

// Toast message type
export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'earn' | 'spend';
}

export type AudioEvent = 'activity_end' | 'travel';

type GameTab = 'location' | 'map';

interface GameStore {
  // State
  gameState: GameState | null;
  isLoading: boolean;
  error: string | null;

  // UI State (not persisted)
  currentScreen: Screen;
  currentTab: GameTab;
  selectedLocation: string | null;
  selectedActivity: ActivityDefinition | null;
  selectedCarInstanceId: string | null;
  pendingEvents: GameEvent[];
  toasts: ToastMessage[];
  isExecutingActivity: boolean;

  // Sleep/crash state
  crashPromptActive: boolean;

  // Audio state
  muted: boolean;
  audioEvent: AudioEvent | null;

  // Actions
  newGame: (playerName: string, statAllocation: StatAllocation) => void;
  loadGame: (saveId: string) => Promise<void>;
  saveGame: () => Promise<void>;
  resetGame: () => void;

  // Activity execution
  performActivity: (activityId: string, params?: ActivityParams) => ActivityResult;
  clearEvents: () => void;

  // Newspaper
  takeGig: (gigId: string) => { success: boolean; error?: string };

  // Travel
  walkTo: (destination: GridPosition) => { success: boolean; error?: string };
  driveTo: (destination: GridPosition) => { success: boolean; error?: string };

  // Sleep & Chill
  sleep: (rate: number) => void;
  chill: (hours: number) => void;

  // Navigation
  setScreen: (screen: Screen) => void;
  setTab: (tab: GameTab) => void;
  setLocation: (locationId: string | null) => void;
  setSelectedActivity: (activity: ActivityDefinition | null) => void;
  setSelectedCarInstanceId: (id: string | null) => void;
  setExecutingActivity: (isExecuting: boolean) => void;

  // Toast management
  addToast: (message: string, type: ToastMessage['type']) => void;
  removeToast: (id: string) => void;

  // Audio
  toggleMute: () => void;
  triggerAudioEvent: (event: AudioEvent) => void;
  clearAudioEvent: () => void;

  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
}

type Screen = 'main_menu' | 'new_game' | 'load_game' | 'game' | 'game_over' | 'victory';

function createInitialGameState(
  playerName: string,
  statAllocation: StatAllocation,
  seed: number
): GameState {
  const now = Date.now();
  const rng = new RNG(seed);

  const meta: GameMeta = {
    saveId: rng.uuid(),
    version: ENGINE_VERSION,
    createdAt: now,
    lastSavedAt: now,
    rngSeed: seed,
  };

  // Starting position at scrapyard
  const scrapyard = getLocation('scrapyard');
  if (!scrapyard) {
    throw new Error('Scrapyard location not found in map data');
  }
  const startingPosition = scrapyard.position;

  const player: Player = {
    name: playerName,
    money: 0,
    energy: MAX_ENERGY,
    position: startingPosition,
    stats: {
      charisma: statAllocation.charisma,
      mechanical: statAllocation.mechanical,
      fitness: statAllocation.fitness,
      knowledge: statAllocation.knowledge,
      driving: statAllocation.driving,
    },
    licenses: [],
    completedCourses: [],
    housing: {
      type: 'shitbox',
      propertyId: null,
    },
    daysWithoutFood: 0,
  };

  // Starting shitbox - non-functional, 0 fuel
  const starterCarDef = getCarDefinition('shitbox_starter');
  const startingShitbox = {
    instanceId: rng.uuid(),
    carId: 'shitbox_starter', // Reference to cars.json
    engineCondition: 0, // Broken
    bodyCondition: 30, // Rough but intact
    fuel: 0,
    fuelCapacity: starterCarDef?.fuelCapacity ?? 40,
    position: startingPosition, // Same as player
    acquiredDay: 1,
    acquiredPrice: 0, // You already own it
  };

  return {
    meta,
    time: {
      currentDay: 1,
      currentHour: 6, // Start at 6 AM
      currentMinute: 0,
    },
    player,
    inventory: {
      cars: [startingShitbox],
      engineParts: 0,
      bodyParts: 0,
    },
    assets: {
      garage: null,
      workshop: null,
      properties: [],
      dealership: null,
    },
    finance: {
      savings: 0,
      indexFund: {
        invested: 0,
        pendingWithdrawal: 0,
        withdrawalAvailableDay: 0,
      },
      loans: [],
    },
    market: {
      currentListings: [],
      playerListings: [],
      auctionSchedule: [],
      marketTrends: [],
    },
    npcs: {
      activeNegotiations: [],
      renters: [],
      employees: [],
    },
    newspaper: {
      currentDay: 0,
      content: null,
      purchased: false,
    },
    progression: {
      totalEarnings: 0,
      carsFlipped: 0,
      roadTripsCompleted: 0,
      totalEngagement: 0,
      subscribers: 0,
      highestCarValue: 0,
      gtoAcquired: false,
      gtoAcquiredDay: null,
    },
    history: {
      actions: [],
    },
  };
}

/**
 * Apply a state delta to the current game state.
 * Returns a new state object (immutable).
 */
function applyDelta(state: GameState, delta: StateDelta): GameState {
  const newState = { ...state };

  if (delta.player) {
    newState.player = {
      ...state.player,
      energy: Math.min(MAX_ENERGY, state.player.energy + (delta.player.energy ?? 0)),
      money: state.player.money + (delta.player.money ?? 0),
      daysWithoutFood:
        delta.player.daysWithoutFood !== undefined
          ? Math.max(0, state.player.daysWithoutFood + delta.player.daysWithoutFood)
          : state.player.daysWithoutFood,
      stats: delta.player.stats
        ? applyStatGains(state.player.stats, delta.player.stats)
        : state.player.stats,
    };
  }

  if (delta.inventory || delta.carUpdates || delta.removedCarInstanceId) {
    let updatedCars = delta.carUpdates
      ? state.inventory.cars.map((car) => {
          const update = delta.carUpdates!.find((u) => u.instanceId === car.instanceId);
          if (!update) return car;
          return {
            ...car,
            fuel: update.fuel ?? car.fuel,
            engineCondition: update.engineCondition !== undefined
              ? Math.max(0, Math.min(100, update.engineCondition))
              : car.engineCondition,
            bodyCondition: update.bodyCondition !== undefined
              ? Math.max(0, Math.min(100, update.bodyCondition))
              : car.bodyCondition,
            position: update.position ?? car.position,
          };
        })
      : state.inventory.cars;

    // Remove car if scrapped
    if (delta.removedCarInstanceId) {
      updatedCars = updatedCars.filter((c) => c.instanceId !== delta.removedCarInstanceId);
    }

    newState.inventory = {
      ...state.inventory,
      cars: updatedCars,
      engineParts: state.inventory.engineParts + (delta.inventory?.engineParts ?? 0),
      bodyParts: state.inventory.bodyParts + (delta.inventory?.bodyParts ?? 0),
    };
  }

  if (delta.marketUpdates) {
    newState.market = {
      ...state.market,
      ...delta.marketUpdates,
    };
  }

  if (delta.newspaper) {
    newState.newspaper = {
      ...state.newspaper,
      ...delta.newspaper,
    };
  }

  return newState;
}


export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Initial state
      gameState: null,
      isLoading: false,
      error: null,
      currentScreen: 'main_menu',
      currentTab: 'location',
      selectedLocation: null,
      selectedActivity: null,
      selectedCarInstanceId: null,
      pendingEvents: [],
      toasts: [],
      isExecutingActivity: false,
      crashPromptActive: false,
      muted: false,
      audioEvent: null,

      // Actions
      newGame: (playerName, statAllocation) => {
        const seed = Date.now();
        const initialState = createInitialGameState(playerName, statAllocation, seed);
        set({
          gameState: initialState,
          currentScreen: 'game',
          error: null,
        });
      },

      loadGame: async (saveId) => {
        set({ isLoading: true, error: null });
        try {
          const data = await window.electronAPI.loadGame(saveId);
          set({
            gameState: data as GameState,
            currentScreen: 'game',
            isLoading: false,
          });
        } catch (error) {
          set({
            error: `Failed to load game: ${error}`,
            isLoading: false,
          });
        }
      },

      saveGame: async () => {
        const { gameState } = get();
        if (!gameState) return;

        set({ isLoading: true, error: null });
        try {
          const updatedState: GameState = {
            ...gameState,
            meta: {
              ...gameState.meta,
              lastSavedAt: Date.now(),
            },
          };
          await window.electronAPI.saveGame(
            gameState.meta.saveId,
            JSON.stringify(updatedState)
          );
          set({ gameState: updatedState, isLoading: false });
        } catch (error) {
          set({
            error: `Failed to save game: ${error}`,
            isLoading: false,
          });
        }
      },

      resetGame: () => {
        set({
          gameState: null,
          currentScreen: 'main_menu',
          currentTab: 'location',
          selectedLocation: null,
          selectedActivity: null,
          selectedCarInstanceId: null,
          error: null,
          pendingEvents: [],
          toasts: [],
          isExecutingActivity: false,
          crashPromptActive: false,
        });
      },

      // Activity execution
      performActivity: (activityId, params = {}) => {
        const { gameState } = get();
        if (!gameState) {
          return { success: false, error: 'No active game' };
        }

        // Create deterministic RNG based on seed + day + action count
        const actionCount = gameState.history.actions.length;
        const rng = new RNG(
          gameState.meta.rngSeed + gameState.time.currentDay * 1000 + actionCount
        );

        // Execute the activity
        const result = executeActivity({
          state: gameState,
          activityId,
          params,
          rng,
        });

        if (!result.success || !result.delta) {
          return result;
        }

        // Apply delta to state
        let newState = applyDelta(gameState, result.delta);

        // Advance time
        const timeHours = result.delta.time?.hours ?? 0;
        const timeResult = advanceTime(newState.time, timeHours);
        newState = {
          ...newState,
          time: timeResult.newTime,
        };

        // Collect all events
        const allEvents: GameEvent[] = [...(result.delta.events ?? [])];

        // Handle new day
        if (timeResult.newDayStarted) {
          const economyConfig = getEconomyConfig();
          const dayResult = processNewDay(newState, economyConfig);

          newState = {
            ...newState,
            player: {
              ...newState.player,
              money: newState.player.money + dayResult.moneyChange,
              daysWithoutFood: dayResult.daysWithoutFood,
            },
            // Reset newspaper state for the new day
            newspaper: {
              currentDay: newState.time.currentDay,
              content: null,
              purchased: false,
            },
            market: dayResult.expiredListingsRemoved
              ? { ...newState.market, currentListings: dayResult.currentListings }
              : newState.market,
          };

          allEvents.push(...dayResult.events);

          // Check death conditions
          const deathCheck = checkDeathConditions(newState, economyConfig);
          if (deathCheck.isDead) {
            set({
              gameState: newState,
              currentScreen: 'game_over',
              pendingEvents: [
                ...allEvents,
                {
                  type: 'death',
                  message: deathCheck.deathReason ?? 'You died.',
                },
              ],
            });
            return result;
          }
        }

        // Log action to history
        newState = {
          ...newState,
          history: {
            ...newState.history,
            actions: [
              ...newState.history.actions.slice(-99), // Keep last 100 actions
              {
                timestamp: Date.now(),
                day: newState.time.currentDay,
                action: activityId,
                params: params as Record<string, unknown>,
                result: 'success',
              },
            ],
          },
        };

        // Check for crash (energy <= 0)
        const crashed = newState.player.energy <= 0;

        set({
          gameState: newState,
          pendingEvents: allEvents,
          crashPromptActive: crashed,
        });

        return result;
      },

      clearEvents: () => {
        set({ pendingEvents: [] });
      },

      // Newspaper
      takeGig: (gigId) => {
        const { gameState } = get();
        if (!gameState) {
          return { success: false, error: 'No active game' };
        }

        const content = gameState.newspaper.content;
        if (!content) {
          return { success: false, error: 'No newspaper content available.' };
        }

        const gig = content.gigs.find((g: GigListing) => g.id === gigId);
        if (!gig) {
          return { success: false, error: 'Gig not found.' };
        }
        if (gig.taken) {
          return { success: false, error: 'You already took this gig.' };
        }
        if (gig.day !== gameState.time.currentDay) {
          return { success: false, error: 'This gig has expired.' };
        }

        // Calculate energy cost: per-hour rate * hours, reduced by fitness
        const economyConfig = getEconomyConfig();
        const baseEnergy = gig.energyPerHour * gig.timeCost;
        const fitnessReduction = gameState.player.stats.fitness * economyConfig.statEffects.fitness.energyCostReductionPerPoint;
        const energyCost = Math.max(0, Math.round(baseEnergy * (1 - fitnessReduction)));

        // Apply gig: deduct time, deduct energy, add pay, mark taken
        const timeResult = advanceTime(gameState.time, gig.timeCost);
        const updatedGigs = content.gigs.map((g: GigListing) =>
          g.id === gigId ? { ...g, taken: true } : g
        );

        let newState: GameState = {
          ...gameState,
          player: {
            ...gameState.player,
            energy: gameState.player.energy - energyCost,
            money: gameState.player.money + gig.pay,
          },
          time: timeResult.newTime,
          newspaper: {
            ...gameState.newspaper,
            content: { ...content, gigs: updatedGigs },
          },
          history: {
            ...gameState.history,
            actions: [
              ...gameState.history.actions.slice(-99),
              {
                timestamp: Date.now(),
                day: gameState.time.currentDay,
                action: 'take_gig',
                params: { gigId },
                result: 'success' as const,
              },
            ],
          },
        };

        const gigCompletedEvent: GameEvent = {
          type: 'gig_completed',
          message: `Gig complete: "${gig.title}". You earned $${gig.pay}.`,
          data: { gigId, pay: gig.pay, timeCost: gig.timeCost },
        };

        const allEvents: GameEvent[] = [gigCompletedEvent];

        // Handle new day if time ticked over
        if (timeResult.newDayStarted) {
          const economyConfig = getEconomyConfig();
          const dayResult = processNewDay(newState, economyConfig);

          newState = {
            ...newState,
            player: {
              ...newState.player,
              money: newState.player.money + dayResult.moneyChange,
              daysWithoutFood: dayResult.daysWithoutFood,
            },
            newspaper: {
              currentDay: newState.time.currentDay,
              content: null,
              purchased: false,
            },
            market: dayResult.expiredListingsRemoved
              ? { ...newState.market, currentListings: dayResult.currentListings }
              : newState.market,
          };

          allEvents.push(...dayResult.events);

          const deathCheck = checkDeathConditions(newState, economyConfig);
          if (deathCheck.isDead) {
            set({
              gameState: newState,
              currentScreen: 'game_over',
              pendingEvents: [
                ...allEvents,
                { type: 'death', message: deathCheck.deathReason ?? 'You died.' },
              ],
            });
            return { success: true };
          }
        }

        // Check for crash (energy <= 0)
        const crashed = newState.player.energy <= 0;

        set({ gameState: newState, pendingEvents: allEvents, crashPromptActive: crashed });
        return { success: true };
      },

      // Travel
      walkTo: (destination) => {
        const { gameState } = get();
        if (!gameState) {
          return { success: false, error: 'No active game' };
        }

        const result = executeWalk(gameState, destination);
        if (!result.success) {
          return { success: false, error: result.error };
        }

        // Apply travel result
        let newState = { ...gameState };

        // Update player position
        if (result.newPosition) {
          newState = {
            ...newState,
            player: {
              ...newState.player,
              position: result.newPosition,
            },
          };
        }

        // Apply delta (energy cost, time)
        if (result.delta) {
          if (result.delta.player?.energy) {
            newState = {
              ...newState,
              player: {
                ...newState.player,
                energy: newState.player.energy + result.delta.player.energy,
              },
            };
          }

          if (result.delta.time?.hours) {
            const timeResult = advanceTime(newState.time, result.delta.time.hours);
            newState = { ...newState, time: timeResult.newTime };
          }
        }

        // Check for crash (energy <= 0)
        const crashed = newState.player.energy <= 0;

        set({ gameState: newState, audioEvent: 'travel', crashPromptActive: crashed });
        return { success: true };
      },

      driveTo: (destination) => {
        const { gameState } = get();
        if (!gameState) {
          return { success: false, error: 'No active game' };
        }

        const result = executeDrive(gameState, destination);
        if (!result.success) {
          return { success: false, error: result.error };
        }

        // Apply travel result
        let newState = { ...gameState };

        // Update player position
        if (result.newPosition) {
          newState = {
            ...newState,
            player: {
              ...newState.player,
              position: result.newPosition,
            },
          };
        }

        // Update car fuel, position, and apply degradation
        if (result.carInstanceId && result.fuelUsed !== undefined && result.newPosition) {
          const { carInstanceId, fuelUsed, newPosition } = result;
          const economyConfig = getEconomyConfig();
          const baseDegradation = economyConfig.carDegradation.engineConditionLossPerTrip;
          const drivingSkill = newState.player.stats.driving;
          const wearReduction = drivingSkill * economyConfig.statEffects.driving.carWearReductionPerPoint;
          const degradation = baseDegradation * (1 - wearReduction);

          const updatedCars = newState.inventory.cars.map((car) => {
            if (car.instanceId === carInstanceId) {
              return {
                ...car,
                fuel: car.fuel - fuelUsed,
                position: newPosition,
                engineCondition: Math.max(0, car.engineCondition - degradation),
              };
            }
            return car;
          });
          newState = {
            ...newState,
            inventory: { ...newState.inventory, cars: updatedCars },
          };
        }

        // Apply delta (time)
        if (result.delta?.time?.hours) {
          const timeResult = advanceTime(newState.time, result.delta.time.hours);
          newState = { ...newState, time: timeResult.newTime };
        }

        set({ gameState: newState, audioEvent: 'travel' });
        return { success: true };
      },

      // Sleep & Chill
      sleep: (rate) => {
        const { gameState } = get();
        if (!gameState) return;

        const currentEnergy = gameState.player.energy;
        const toRecover = MAX_ENERGY - currentEnergy;
        const sleepHours = Math.ceil(toRecover / rate);

        // Set energy to 100 first, then advance time with day processing
        let newState: GameState = {
          ...gameState,
          player: { ...gameState.player, energy: MAX_ENERGY },
        };

        const outcome = advanceTimeWithDayProcessing(newState, sleepHours);
        newState = outcome.newState;

        // Log action
        newState = {
          ...newState,
          history: {
            ...newState.history,
            actions: [
              ...newState.history.actions.slice(-99),
              {
                timestamp: Date.now(),
                day: newState.time.currentDay,
                action: 'sleep',
                params: { rate, hours: sleepHours },
                result: 'success' as const,
              },
            ],
          },
        };

        if (outcome.isDead) {
          set({
            gameState: newState,
            currentScreen: 'game_over',
            crashPromptActive: false,
            pendingEvents: [
              ...outcome.events,
              { type: 'death' as const, message: outcome.deathReason ?? 'You died.' },
            ],
          });
          return;
        }

        set({
          gameState: newState,
          crashPromptActive: false,
          pendingEvents: outcome.events,
        });
      },

      chill: (hours) => {
        const { gameState } = get();
        if (!gameState) return;
        if (gameState.player.energy <= 0) return; // Can't chill while crashed

        const outcome = advanceTimeWithDayProcessing(gameState, hours);
        let newState = outcome.newState;

        // Log action
        newState = {
          ...newState,
          history: {
            ...newState.history,
            actions: [
              ...newState.history.actions.slice(-99),
              {
                timestamp: Date.now(),
                day: newState.time.currentDay,
                action: 'chill',
                params: { hours },
                result: 'success' as const,
              },
            ],
          },
        };

        if (outcome.isDead) {
          set({
            gameState: newState,
            currentScreen: 'game_over',
            pendingEvents: [
              ...outcome.events,
              { type: 'death' as const, message: outcome.deathReason ?? 'You died.' },
            ],
          });
          return;
        }

        set({
          gameState: newState,
          pendingEvents: outcome.events,
        });
      },

      // Navigation
      setScreen: (screen) => set({ currentScreen: screen }),
      setTab: (tab) => set({ currentTab: tab }),
      setLocation: (locationId) => set({ selectedLocation: locationId }),
      setSelectedActivity: (activity) => set({ selectedActivity: activity }),
      setSelectedCarInstanceId: (id) => set({ selectedCarInstanceId: id }),
      setExecutingActivity: (isExecuting) => set({ isExecutingActivity: isExecuting }),

      // Toast management
      addToast: (message, type) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        set((state) => ({
          toasts: [...state.toasts, { id, message, type }],
        }));
      },
      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      },

      // Audio
      toggleMute: () => set((state) => ({ muted: !state.muted })),
      triggerAudioEvent: (event) => set({ audioEvent: event }),
      clearAudioEvent: () => set({ audioEvent: null }),

      // Error handling
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'shitbox-game',
      partialize: (state) => ({
        // Only persist game state, not UI state
        gameState: state.gameState,
        muted: state.muted,
      }),
    }
  )
);
