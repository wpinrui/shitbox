import { useState } from 'react';
import { useGameStore } from '@store/index';
import { GameHeader, GameHUD, ActivityPanel, EventLog } from '@ui/components/game';
import { getEconomyConfig } from '@engine/index';

export function GameScreen({
  gameState,
}: {
  gameState: NonNullable<ReturnType<typeof useGameStore.getState>['gameState']>;
}) {
  const resetGame = useGameStore((state) => state.resetGame);
  const performActivity = useGameStore((state) => state.performActivity);
  const pendingEvents = useGameStore((state) => state.pendingEvents);
  const clearEvents = useGameStore((state) => state.clearEvents);

  const [message, setMessage] = useState<string | null>(null);

  const economyConfig = getEconomyConfig();
  const foodCost = economyConfig.survival.dailyFoodCost;
  const starvationDays = economyConfig.survival.daysWithoutFoodUntilDeath;

  const handleActivity = (activityId: string, params: { hours?: number } = {}) => {
    const result = performActivity(activityId, params);
    if (result.narrative) {
      setMessage(result.narrative);
    } else if (result.error) {
      setMessage(`Failed: ${result.error}`);
    }
  };

  const canAffordFood = gameState.player.money >= foodCost;

  return (
    <div className="screen game-screen">
      <GameHeader time={gameState.time} />

      <GameHUD money={gameState.player.money} energy={gameState.player.energy} />

      {/* Food warning */}
      {gameState.player.daysWithoutFood > 0 && (
        <div className="warning food-warning">
          Days without food: {gameState.player.daysWithoutFood}/{starvationDays} - EAT OR DIE!
        </div>
      )}

      <div className="player-info">
        <h2>{gameState.player.name}</h2>
        <div className="stats-display">
          <div className="stat">CHA: {gameState.player.stats.charisma}</div>
          <div className="stat">MEC: {gameState.player.stats.mechanical}</div>
          <div className="stat">FIT: {gameState.player.stats.fitness}</div>
          <div className="stat">KNO: {gameState.player.stats.knowledge}</div>
          <div className="stat">DRV: {gameState.player.stats.driving}</div>
        </div>
      </div>

      <ActivityPanel
        foodCost={foodCost}
        canAffordFood={canAffordFood}
        onActivity={handleActivity}
      />

      {/* Message display */}
      {message && (
        <div className="message-display">
          <p>{message}</p>
          <button onClick={() => setMessage(null)}>OK</button>
        </div>
      )}

      <EventLog events={pendingEvents} onDismiss={clearEvents} />

      <button className="quit-button" onClick={resetGame}>
        Quit to Menu
      </button>
    </div>
  );
}
