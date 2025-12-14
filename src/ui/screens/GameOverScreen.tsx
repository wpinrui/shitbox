import { useGameStore } from '@store/index';
import type { GameEvent } from '@engine/index';

export function GameOverScreen({ events }: { events: GameEvent[] }) {
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
