import { useEffect, useState } from 'react';
import { useGameStore } from '@store/index';
import { MainMenu, NewGame } from '@ui/screens';
import {
  MAX_ENERGY,
  loadEconomyData,
  loadCoreActivities,
  getTimeOfDay,
  getEconomyConfig,
} from '@engine/index';

type DataStatus = 'loading' | 'loaded' | 'error';

function App() {
  const [dataStatus, setDataStatus] = useState<DataStatus>('loading');
  const currentScreen = useGameStore((state) => state.currentScreen);
  const gameState = useGameStore((state) => state.gameState);
  const pendingEvents = useGameStore((state) => state.pendingEvents);

  useEffect(() => {
    async function loadData() {
      try {
        // Load economy data into the engine cache
        await loadEconomyData();
        // Load core activities (misc.json)
        await loadCoreActivities();
        setDataStatus('loaded');
      } catch (error) {
        console.error('Failed to load data:', error);
        setDataStatus('error');
      }
    }
    loadData();
  }, []);

  if (dataStatus === 'loading') {
    return (
      <div className="app loading">
        <h1>Loading...</h1>
      </div>
    );
  }

  if (dataStatus === 'error') {
    return (
      <div className="app error">
        <h1>Failed to load game data</h1>
        <p>Please check the console for details.</p>
      </div>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'main_menu':
        return <MainMenu />;
      case 'new_game':
        return <NewGame />;
      case 'game':
        return <GameScreen gameState={gameState!} />;
      case 'game_over':
        return <GameOverScreen events={pendingEvents} />;
      case 'victory':
        return <PlaceholderScreen title="Victory!" />;
      default:
        return <MainMenu />;
    }
  };

  return <div className="app">{renderScreen()}</div>;
}

function GameScreen({ gameState }: { gameState: NonNullable<ReturnType<typeof useGameStore.getState>['gameState']> }) {
  const resetGame = useGameStore((state) => state.resetGame);
  const performActivity = useGameStore((state) => state.performActivity);
  const pendingEvents = useGameStore((state) => state.pendingEvents);
  const clearEvents = useGameStore((state) => state.clearEvents);

  const [sleepHours, setSleepHours] = useState(8);
  const [message, setMessage] = useState<string | null>(null);

  const economyConfig = getEconomyConfig();
  const foodCost = economyConfig.survival.dailyFoodCost;
  const starvationDays = economyConfig.survival.daysWithoutFoodUntilDeath;

  const handleActivity = (activityId: string, params: { hours?: number } = {}) => {
    const result = performActivity(activityId, params);
    if (result.narrative) {
      setMessage(result.narrative);
    } else if (result.error) {
      setMessage(`Failed: ${result.error}`);
    }
  };

  const canAffordFood = gameState.player.money >= foodCost;
  const timeOfDay = getTimeOfDay(gameState.time.currentHour);

  return (
    <div className="screen game-screen">
      <header className="game-header">
        <h1>Day {gameState.time.currentDay}</h1>
        <span className="time">
          {String(gameState.time.currentHour).padStart(2, '0')}:
          {String(gameState.time.currentMinute).padStart(2, '0')}
          <span className="time-period"> ({timeOfDay})</span>
        </span>
      </header>

      <div className="game-hud">
        <div className="resource money">
          <span className="label">Money</span>
          <span className="value">${gameState.player.money}</span>
        </div>
        <div className="resource energy">
          <span className="label">Energy</span>
          <div className="energy-bar">
            <div
              className="energy-fill"
              style={{ width: `${gameState.player.energy}%` }}
            />
          </div>
          <span className="value">{gameState.player.energy}/{MAX_ENERGY}</span>
        </div>
      </div>

      {/* Food warning */}
      {gameState.player.daysWithoutFood > 0 && (
        <div className="warning food-warning">
          Days without food: {gameState.player.daysWithoutFood}/{starvationDays} - EAT OR DIE!
        </div>
      )}

      <div className="player-info">
        <h2>{gameState.player.name}</h2>
        <div className="stats-display">
          <div className="stat">CHA: {gameState.player.stats.charisma}</div>
          <div className="stat">MEC: {gameState.player.stats.mechanical}</div>
          <div className="stat">FIT: {gameState.player.stats.fitness}</div>
          <div className="stat">KNO: {gameState.player.stats.knowledge}</div>
          <div className="stat">DRV: {gameState.player.stats.driving}</div>
        </div>
      </div>

      {/* Activity buttons */}
      <div className="activity-section">
        <h3>Actions</h3>
        <div className="activity-buttons">
          <button
            onClick={() => handleActivity('eat')}
            disabled={!canAffordFood}
            className="activity-btn eat"
          >
            Eat (${foodCost})
          </button>

          <div className="sleep-control">
            <label>
              Sleep: {sleepHours}h
              <input
                type="range"
                min={1}
                max={12}
                value={sleepHours}
                onChange={(e) => setSleepHours(Number(e.target.value))}
              />
            </label>
            <button
              onClick={() => handleActivity('sleep', { hours: sleepHours })}
              className="activity-btn sleep"
            >
              Sleep ({sleepHours}h)
            </button>
          </div>

          <button
            onClick={() => handleActivity('wait', { hours: 1 })}
            className="activity-btn wait"
          >
            Wait (1h)
          </button>
        </div>
      </div>

      {/* Message display */}
      {message && (
        <div className="message-display">
          <p>{message}</p>
          <button onClick={() => setMessage(null)}>OK</button>
        </div>
      )}

      {/* Event log */}
      {pendingEvents.length > 0 && (
        <div className="event-log">
          <h4>Events</h4>
          {pendingEvents.map((event, i) => (
            <div key={i} className={`event event-${event.type}`}>
              {event.message}
            </div>
          ))}
          <button onClick={clearEvents}>Dismiss</button>
        </div>
      )}

      <button className="quit-button" onClick={resetGame}>
        Quit to Menu
      </button>
    </div>
  );
}

function GameOverScreen({ events }: { events: { type: string; message: string }[] }) {
  const resetGame = useGameStore((state) => state.resetGame);
  const clearEvents = useGameStore((state) => state.clearEvents);

  const handleReturn = () => {
    clearEvents();
    resetGame();
  };

  // Find death reason from events
  const deathEvent = events.find((e) => e.type === 'death');
  const deathReason = deathEvent?.message ?? 'You died.';

  return (
    <div className="screen game-over-screen">
      <h1>Game Over</h1>
      <p className="death-reason">{deathReason}</p>
      <button onClick={handleReturn}>Return to Menu</button>
    </div>
  );
}

function PlaceholderScreen({ title }: { title: string }) {
  const resetGame = useGameStore((state) => state.resetGame);

  return (
    <div className="screen placeholder-screen">
      <h1>{title}</h1>
      <button onClick={resetGame}>Return to Menu</button>
    </div>
  );
}

export default App;
