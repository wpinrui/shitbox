import { useState } from 'react';
import { useGameStore } from '@store/index';
import { StatAllocation, StatName, STARTING_STAT_POINTS, MAX_PLAYER_NAME_LENGTH } from '@engine/index';

const MIN_STAT = 0;
const MAX_STAT = 20;

const STAT_INFO: Record<StatName, { label: string; description: string }> = {
  charisma: {
    label: 'Charisma',
    description: 'Negotiation, trait visibility, ad response',
  },
  mechanical: {
    label: 'Mechanical',
    description: 'Repair quality, part finding, value spotting',
  },
  fitness: {
    label: 'Fitness',
    description: 'Energy efficiency, labor output',
  },
  knowledge: {
    label: 'Knowledge',
    description: 'Research accuracy, hidden listings',
  },
  racing: {
    label: 'Racing',
    description: 'Power bonus in races',
  },
};

const STAT_ORDER: StatName[] = ['charisma', 'mechanical', 'fitness', 'knowledge', 'racing'];

export function NewGame() {
  const setScreen = useGameStore((state) => state.setScreen);
  const newGame = useGameStore((state) => state.newGame);

  const [playerName, setPlayerName] = useState('');
  const [stats, setStats] = useState<StatAllocation>({
    charisma: 5,
    mechanical: 5,
    fitness: 5,
    knowledge: 5,
    racing: 5,
  });

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

  const handleStartGame = () => {
    if (!playerName.trim()) return;
    if (pointsRemaining !== 0) return;
    newGame(playerName.trim(), stats);
  };

  const canStart = playerName.trim().length > 0 && pointsRemaining === 0;

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
            : pointsRemaining > 0
            ? `Allocate ${pointsRemaining} more point${pointsRemaining !== 1 ? 's' : ''}`
            : pointsRemaining < 0
            ? 'Too many points allocated'
            : 'Start Game'}
        </button>
      </div>
    </div>
  );
}
