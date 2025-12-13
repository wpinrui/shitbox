import { useEffect, useState } from 'react';
import { useGameStore } from '@store/index';
import { MainMenu, NewGame } from '@ui/screens';
import { MAX_ENERGY } from '@engine/index';

type DataStatus = 'loading' | 'loaded' | 'error';

function App() {
  const [dataStatus, setDataStatus] = useState<DataStatus>('loading');
  const currentScreen = useGameStore((state) => state.currentScreen);
  const gameState = useGameStore((state) => state.gameState);

  useEffect(() => {
    async function loadData() {
      try {
        await window.electronAPI.loadData('economy.json');
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
        return <PlaceholderScreen title="Game Over" />;
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

  return (
    <div className="screen game-screen">
      <header className="game-header">
        <h1>Day {gameState.time.currentDay}</h1>
        <span className="time">
          {String(gameState.time.currentHour).padStart(2, '0')}:
          {String(gameState.time.currentMinute).padStart(2, '0')}
        </span>
      </header>

      <div className="game-hud">
        <div className="resource money">
          <span className="label">Money</span>
          <span className="value">${gameState.player.money}</span>
        </div>
        <div className="resource energy">
          <span className="label">Energy</span>
          <span className="value">{gameState.player.energy}/{MAX_ENERGY}</span>
        </div>
      </div>

      <div className="player-info">
        <h2>{gameState.player.name}</h2>
        <div className="stats-display">
          <div className="stat">CHA: {gameState.player.stats.charisma}</div>
          <div className="stat">MEC: {gameState.player.stats.mechanical}</div>
          <div className="stat">FIT: {gameState.player.stats.fitness}</div>
          <div className="stat">KNO: {gameState.player.stats.knowledge}</div>
          <div className="stat">RAC: {gameState.player.stats.racing}</div>
        </div>
      </div>

      <div className="placeholder-content">
        <p>Game screen placeholder - Phase 1 in progress</p>
        <p>Activities, time advancement, and HUD coming soon.</p>
      </div>

      <button className="quit-button" onClick={resetGame}>
        Quit to Menu
      </button>
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
