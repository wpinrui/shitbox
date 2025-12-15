import { useState, useCallback } from 'react';
import { useGameStore } from '@store/index';
import { ConfirmDialog } from '@ui/components/common';
import { StatAllocation, StatName, STARTING_STAT_POINTS, MAX_PLAYER_NAME_LENGTH, STAT_ORDER } from '@engine/index';

const MIN_STAT = 0;
const MAX_STAT = 20;

const STAT_INFO: Record<StatName, { label: string; description: string }> = {
  charisma: {
    label: 'Charisma',
    description: 'Negotiation effectiveness, better deals',
  },
  mechanical: {
    label: 'Mechanical',
    description: 'Repairs, car assessment, mechanic work',
  },
  fitness: {
    label: 'Fitness',
    description: 'Energy efficiency, labor, road trip endurance',
  },
  knowledge: {
    label: 'Knowledge',
    description: 'Learning speed, skill gains, investments',
  },
  driving: {
    label: 'Driving',
    description: 'Road trips, deliveries, fuel efficiency',
  },
};

export function NewGame() {
  const setScreen = useGameStore((state) => state.setScreen);
  const newGame = useGameStore((state) => state.newGame);

  const [playerName, setPlayerName] = useState('');
  const [stats, setStats] = useState<StatAllocation>({
    charisma: 0,
    mechanical: 0,
    fitness: 0,
    knowledge: 0,
    driving: 0,
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const pointsUsed = Object.values(stats).reduce((sum, val) => sum + val, 0);
  const pointsRemaining = STARTING_STAT_POINTS - pointsUsed;

  const adjustStat = (stat: StatName, delta: number) => {
    const newValue = stats[stat] + delta;
    if (newValue < MIN_STAT || newValue > MAX_STAT) return;
    if (delta > 0 && pointsRemaining <= 0) return;

    setStats((prev) => ({
      ...prev,
      [stat]: newValue,
    }));
  };

  const startGame = useCallback(() => {
    newGame(playerName.trim(), stats);
  }, [newGame, playerName, stats]);

  const handleStartGame = () => {
    if (!playerName.trim()) return;
    if (pointsRemaining > 0) {
      setShowConfirmDialog(true);
      return;
    }
    startGame();
  };

  const handleConfirmStart = () => {
    setShowConfirmDialog(false);
    startGame();
  };

  const handleCancelStart = () => {
    setShowConfirmDialog(false);
  };

  const canStart = playerName.trim().length > 0 && pointsRemaining >= 0;

  return (
    <div className="screen new-game">
      <header className="screen-header">
        <button className="back-button" onClick={() => setScreen('main_menu')}>
          &larr; Back
        </button>
        <h1>New Game</h1>
      </header>

      <div className="new-game-content">
        <section className="name-section">
          <label htmlFor="player-name">Your Name</label>
          <input
            id="player-name"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name..."
            maxLength={MAX_PLAYER_NAME_LENGTH}
            autoFocus
          />
        </section>

        <section className="stats-section">
          <div className="stats-header">
            <h2>Allocate Stats</h2>
            <div className={`points-remaining ${pointsRemaining === 0 ? 'complete' : ''}`}>
              Points: {pointsRemaining}
            </div>
          </div>

          <div className="stats-grid">
            {STAT_ORDER.map((stat) => (
              <div key={stat} className="stat-row">
                <div className="stat-info">
                  <span className="stat-label">{STAT_INFO[stat].label}</span>
                  <span className="stat-description">{STAT_INFO[stat].description}</span>
                </div>
                <div className="stat-controls">
                  <button
                    className="stat-button"
                    onClick={() => adjustStat(stat, -1)}
                    disabled={stats[stat] <= MIN_STAT}
                  >
                    -
                  </button>
                  <span className="stat-value">{stats[stat]}</span>
                  <button
                    className="stat-button"
                    onClick={() => adjustStat(stat, 1)}
                    disabled={stats[stat] >= MAX_STAT || pointsRemaining <= 0}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <button
          className="start-button"
          onClick={handleStartGame}
          disabled={!canStart}
        >
          {!playerName.trim()
            ? 'Enter your name'
            : pointsRemaining < 0
            ? 'Too many points allocated'
            : 'Start Game'}
        </button>
      </div>

      {showConfirmDialog && (
        <ConfirmDialog
          title="Unallocated Points"
          message={`You have ${pointsRemaining} unallocated stat point${pointsRemaining !== 1 ? 's' : ''}. Are you sure you want to start?`}
          confirmText="Start Anyway"
          cancelText="Go Back"
          onConfirm={handleConfirmStart}
          onCancel={handleCancelStart}
        />
      )}
    </div>
  );
}
