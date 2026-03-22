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
    <div className="main-menu">
      <div className="main-menu__shell">
        <div className="main-menu__card">
          <div className="main-menu__title">SHITBOX</div>
          <div className="main-menu__tagline">From scrapyard to showroom</div>

          <div className="main-menu__buttons">
            <button
              className="main-menu__btn main-menu__btn--primary"
              onClick={() => setScreen('new_game')}
            >
              New Game
            </button>
            <button
              className="main-menu__btn main-menu__btn--secondary"
              onClick={() => setShowLoadDialog(true)}
            >
              Load Game
            </button>
            <button
              className="main-menu__btn main-menu__btn--danger"
              onClick={() => window.electronAPI.quitApp()}
            >
              Quit
            </button>
          </div>
        </div>
      </div>

      <div className="main-menu__version">v0.1.0</div>

      {showLoadDialog && (
        <LoadGameDialog
          onLoad={handleLoad}
          onBack={() => setShowLoadDialog(false)}
        />
      )}
    </div>
  );
}
