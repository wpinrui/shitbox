import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  GameState,
  GameMeta,
  Player,
  StatAllocation,
  ENGINE_VERSION,
  MAX_ENERGY,
  RNG,
} from '@engine/index';

interface GameStore {
  // State
  gameState: GameState | null;
  isLoading: boolean;
  error: string | null;

  // UI State (not persisted)
  currentScreen: Screen;
  selectedLocation: string | null;

  // Actions
  newGame: (playerName: string, statAllocation: StatAllocation) => void;
  loadGame: (saveId: string) => Promise<void>;
  saveGame: () => Promise<void>;
  resetGame: () => void;

  // Navigation
  setScreen: (screen: Screen) => void;
  setLocation: (locationId: string | null) => void;

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

  const player: Player = {
    name: playerName,
    money: 0,
    energy: MAX_ENERGY,
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

  return {
    meta,
    time: {
      currentDay: 1,
      currentHour: 6, // Start at 6 AM
      currentMinute: 0,
    },
    player,
    inventory: {
      cars: [],
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

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Initial state
      gameState: null,
      isLoading: false,
      error: null,
      currentScreen: 'main_menu',
      selectedLocation: null,

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
          selectedLocation: null,
          error: null,
        });
      },

      // Navigation
      setScreen: (screen) => set({ currentScreen: screen }),
      setLocation: (locationId) => set({ selectedLocation: locationId }),

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
