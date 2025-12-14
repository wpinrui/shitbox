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
  type ActivityParams,
  type ActivityDefinition,
} from '@engine/index';

// Toast message type
export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'earn' | 'spend';
}

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
  pendingEvents: GameEvent[];
  toasts: ToastMessage[];
  isExecutingActivity: boolean;

  // Actions
  newGame: (playerName: string, statAllocation: StatAllocation) => void;
  loadGame: (saveId: string) => Promise<void>;
  saveGame: () => Promise<void>;
  resetGame: () => void;

  // Activity execution
  performActivity: (activityId: string, params?: ActivityParams) => ActivityResult;
  clearEvents: () => void;

  // Travel
  walkTo: (destination: GridPosition) => { success: boolean; error?: string };
  driveTo: (destination: GridPosition) => { success: boolean; error?: string };

  // Navigation
  setScreen: (screen: Screen) => void;
  setTab: (tab: GameTab) => void;
  setLocation: (locationId: string | null) => void;
  setSelectedActivity: (activity: ActivityDefinition | null) => void;
  setExecutingActivity: (isExecuting: boolean) => void;

  // Toast management
  addToast: (message: string, type: ToastMessage['type']) => void;
  removeToast: (id: string) => void;

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

  // Starting position inside scrapyard (bounds: x:2-9, y:2-7)
  const startingPosition = { x: 5, y: 5 };

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
  const startingShitbox = {
    instanceId: rng.uuid(),
    carId: 'shitbox_starter', // Reference to cars.json
    engineCondition: 0, // Broken
    bodyCondition: 30, // Rough but intact
    fuel: 0,
    fuelCapacity: 40, // 40 liter tank
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
      energy: Math.max(
        0,
        Math.min(MAX_ENERGY, state.player.energy + (delta.player.energy ?? 0))
      ),
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

  if (delta.inventory) {
    newState.inventory = {
      ...state.inventory,
      engineParts: state.inventory.engineParts + (delta.inventory.engineParts ?? 0),
      bodyParts: state.inventory.bodyParts + (delta.inventory.bodyParts ?? 0),
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
      pendingEvents: [],
      toasts: [],
      isExecutingActivity: false,

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
          error: null,
          pendingEvents: [],
          toasts: [],
          isExecutingActivity: false,
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
              daysWithoutFood: dayResult.daysWithoutFood,
            },
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

        set({
          gameState: newState,
          pendingEvents: allEvents,
        });

        return result;
      },

      clearEvents: () => {
        set({ pendingEvents: [] });
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
                energy: Math.max(0, newState.player.energy + result.delta.player.energy),
              },
            };
          }

          if (result.delta.time?.hours) {
            const timeResult = advanceTime(newState.time, result.delta.time.hours);
            newState = { ...newState, time: timeResult.newTime };
          }
        }

        set({ gameState: newState });
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

        // Update car fuel and position
        if (result.carInstanceId && result.fuelUsed !== undefined && result.newPosition) {
          const updatedCars = newState.inventory.cars.map((car) => {
            if (car.instanceId === result.carInstanceId) {
              return {
                ...car,
                fuel: car.fuel - result.fuelUsed!,
                position: result.newPosition!,
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

        set({ gameState: newState });
        return { success: true };
      },

      // Navigation
      setScreen: (screen) => set({ currentScreen: screen }),
      setTab: (tab) => set({ currentTab: tab }),
      setLocation: (locationId) => set({ selectedLocation: locationId }),
      setSelectedActivity: (activity) => set({ selectedActivity: activity }),
      setExecutingActivity: (isExecuting) => set({ isExecutingActivity: isExecuting }),

      // Toast management
      addToast: (message, type) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        set((state) => ({
          toasts: [...state.toasts, { id, message, type }],
        }));
      },
      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      },

      // Error handling
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'shitbox-game',
      partialize: (state) => ({
        // Only persist game state, not UI state
        gameState: state.gameState,
      }),
    }
  )
);
