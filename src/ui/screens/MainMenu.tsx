import { useGameStore } from '@store/index';

export function MainMenu() {
  const setScreen = useGameStore((state) => state.setScreen);

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
          disabled
          title="Coming soon"
        >
          Load Game
        </button>
        <button
          className="menu-button"
          onClick={() => window.close()}
        >
          Quit
        </button>
      </nav>

      <footer className="version-info">
        <p>v0.1.0 - Phase 1</p>
      </footer>
    </div>
  );
}
