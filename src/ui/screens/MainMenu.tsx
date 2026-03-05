import { useState } from 'react';
import { useGameStore } from '@store/index';
import { LoadGameDialog } from '@ui/components/common';

export function MainMenu() {
  const setScreen = useGameStore((state) => state.setScreen);
  const loadGame = useGameStore((state) => state.loadGame);

  const [showLoadDialog, setShowLoadDialog] = useState(false);

  const handleLoad = (saveId: string) => {
    loadGame(saveId);
    setShowLoadDialog(false);
  };

  return (
    <div className="screen main-menu">
      <div className="title-section">
        <h1 className="game-title">SHITBOX</h1>
        <p className="tagline">From scrapyard to showroom</p>
      </div>

      <nav className="menu-buttons">
        <button
          className="menu-button primary"
          onClick={() => setScreen('new_game')}
        >
          New Game
        </button>
        <button
          className="menu-button"
          onClick={() => setShowLoadDialog(true)}
        >
          Load Game
        </button>
        <button
          className="menu-button"
          onClick={() => window.electronAPI.quitApp()}
        >
          Quit
        </button>
      </nav>

      <footer className="version-info">
        <p>v0.1.0 - Phase 2</p>
      </footer>

      {showLoadDialog && (
        <LoadGameDialog
          onLoad={handleLoad}
          onBack={() => setShowLoadDialog(false)}
        />
      )}
    </div>
  );
}
