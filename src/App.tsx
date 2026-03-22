import { useEffect, useState } from 'react';
import { useGameStore } from '@store/index';
import { MainMenu, NewGame, GameScreen, GameOverScreen, PlaceholderScreen } from '@ui/screens';
import { BackgroundSlideshow } from '@ui/components/common';
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
        await loadEconomyData();
        await loadCoreActivities();
        await loadMapData();
        setDataStatus('loaded');
      } catch (error) {
        console.error('Failed to load data:', error);
        setDataStatus('error');
      }
    }
    loadData();
  }, []);

  // Start background music on first user interaction
  useEffect(() => {
    const audio = document.getElementById('bgm') as HTMLAudioElement | null;
    if (!audio) return;
    audio.play().catch(() => {
      const start = () => {
        audio.play().catch(() => {});
        document.removeEventListener('click', start);
        document.removeEventListener('keydown', start);
      };
      document.addEventListener('click', start);
      document.addEventListener('keydown', start);
    });
  }, []);

  // Show slideshow behind menu screens (persists across main_menu ↔ new_game)
  const showSlideshow = currentScreen === 'main_menu' || currentScreen === 'new_game';

  if (dataStatus === 'loading') {
    return (
      <div className="app loading">
        <audio id="bgm" loop preload="auto">
          <source src="/assets/audio/late-night-radio.mp3" type="audio/mpeg" />
        </audio>
        <h1>Loading...</h1>
      </div>
    );
  }

  if (dataStatus === 'error') {
    return (
      <div className="app error">
        <audio id="bgm" loop preload="auto">
          <source src="/assets/audio/late-night-radio.mp3" type="audio/mpeg" />
        </audio>
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

  return (
    <div className="app">
      <audio id="bgm" loop preload="auto">
        <source src="/assets/audio/late-night-radio.mp3" type="audio/mpeg" />
      </audio>
      {showSlideshow && <BackgroundSlideshow />}
      {renderScreen()}
    </div>
  );
}

export default App;
