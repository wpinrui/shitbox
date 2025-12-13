import { useEffect, useState } from 'react';
import { useGameStore } from '@store/index';

type DataStatus = 'loading' | 'loaded' | 'error';

function App() {
  const [dataStatus, setDataStatus] = useState<DataStatus>('loading');
  const [economyData, setEconomyData] = useState<unknown>(null);
  const gameState = useGameStore(state => state.gameState);

  useEffect(() => {
    async function loadData() {
      try {
        const economy = await window.electronAPI.loadData('economy.json');
        setEconomyData(economy);
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

  return (
    <div className="app">
      <header className="header">
        <h1>Shitbox</h1>
        <p className="tagline">From scrapyard to showroom</p>
      </header>

      <main className="main">
        <div className="status-panel">
          <h2>Data Status</h2>
          <p>Economy data loaded: {economyData ? '✓' : '✗'}</p>
          <p>Game state: {gameState ? 'Active' : 'None'}</p>
        </div>

        <div className="info-panel">
          <h2>Hello Shitbox!</h2>
          <p>Phase 0 Foundation Complete</p>
          <ul>
            <li>Electron + React + TypeScript ✓</li>
            <li>Data loading system ✓</li>
            <li>Zustand store ✓</li>
            <li>Seeded RNG ✓</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default App;
