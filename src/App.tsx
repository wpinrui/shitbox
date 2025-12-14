import { useEffect, useState } from 'react';
import { useGameStore } from '@store/index';
import { MainMenu, NewGame, GameScreen, GameOverScreen, PlaceholderScreen } from '@ui/screens';
import { loadEconomyData, loadCoreActivities, loadMapData } from '@engine/index';

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
        // Load map data
        await loadMapData();
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

export default App;
