import { useState, useCallback } from 'react';
import { useGameStore } from '@store/index';
import { TileMap, LocationInfoPanel } from '@ui/components/map';
import { ActivityCard, ActivityModal } from '@ui/components/location';
import { ToastContainer, FadeTransition } from '@ui/components/common';
import { AnimatedMoney, AnimatedEnergy, AnimatedClock } from '@ui/components/hud';
import {
  getLocationActivities,
  getLocationAtPosition,
  getEconomyConfig,
  canPerformActivity,
  MAX_ENERGY,
  type ActivityDefinition,
  type LocationDefinition,
} from '@engine/index';
import './GameScreen.css';

export function GameScreen({
  gameState,
}: {
  gameState: NonNullable<ReturnType<typeof useGameStore.getState>['gameState']>;
}) {
  const resetGame = useGameStore((state) => state.resetGame);
  const performActivity = useGameStore((state) => state.performActivity);
  const currentTab = useGameStore((state) => state.currentTab);
  const setTab = useGameStore((state) => state.setTab);
  const selectedActivity = useGameStore((state) => state.selectedActivity);
  const setSelectedActivity = useGameStore((state) => state.setSelectedActivity);
  const toasts = useGameStore((state) => state.toasts);
  const removeToast = useGameStore((state) => state.removeToast);
  const addToast = useGameStore((state) => state.addToast);
  const isExecutingActivity = useGameStore((state) => state.isExecutingActivity);
  const setExecutingActivity = useGameStore((state) => state.setExecutingActivity);
  const walkTo = useGameStore((state) => state.walkTo);
  const driveTo = useGameStore((state) => state.driveTo);

  const [selectedMapLocation, setSelectedMapLocation] = useState<LocationDefinition | null>(null);

  const economyConfig = getEconomyConfig();
  const starvationDays = economyConfig.survival.daysWithoutFoodUntilDeath;

  // Get current location based on player position
  const currentLocation = getLocationAtPosition(gameState.player.position);
  const locationActivities = currentLocation
    ? getLocationActivities(currentLocation.id)
    : [];

  // Check if player has a working car at their location
  const hasCarHere = gameState.inventory.cars.some(
    (car) =>
      car.position.x === gameState.player.position.x &&
      car.position.y === gameState.player.position.y &&
      car.engineCondition > 0
  );

  const handleActivityClick = (activity: ActivityDefinition) => {
    setSelectedActivity(activity);
  };

  const handleActivityExecute = useCallback(
    (params: { hours?: number }) => {
      if (!selectedActivity) return;

      setExecutingActivity(true);

      // Execute after a short delay for fade effect
      setTimeout(() => {
        const result = performActivity(selectedActivity.id, params);

        setExecutingActivity(false);
        setSelectedActivity(null);

        if (result.success && result.narrative) {
          // Determine toast type based on result
          const delta = result.delta;
          let toastType: 'earn' | 'spend' | 'info' = 'info';
          if (delta?.player?.money) {
            toastType = delta.player.money > 0 ? 'earn' : 'spend';
          }
          addToast(result.narrative, toastType);
        } else if (result.error) {
          addToast(result.error, 'error');
        }
      }, 600);
    },
    [selectedActivity, performActivity, setExecutingActivity, setSelectedActivity, addToast]
  );

  const handleModalClose = () => {
    setSelectedActivity(null);
  };

  const handleMapLocationClick = (location: LocationDefinition) => {
    setSelectedMapLocation(location);
  };

  const handleMapLocationClose = () => {
    setSelectedMapLocation(null);
  };

  const handleWalk = () => {
    if (!selectedMapLocation) return;
    const result = walkTo(selectedMapLocation.entryPoint);
    if (result.success) {
      addToast(`Walked to ${selectedMapLocation.name}`, 'info');
      setSelectedMapLocation(null);
    } else if (result.error) {
      addToast(result.error, 'error');
    }
  };

  const handleDrive = () => {
    if (!selectedMapLocation) return;
    const result = driveTo(selectedMapLocation.entryPoint);
    if (result.success) {
      addToast(`Drove to ${selectedMapLocation.name}`, 'info');
      setSelectedMapLocation(null);
    } else if (result.error) {
      addToast(result.error, 'error');
    }
  };

  return (
    <div className="screen game-screen">
      {/* Header with animated HUD */}
      <div className="game-header-bar">
        <AnimatedClock day={gameState.time.currentDay} hour={gameState.time.currentHour} />
        <div className="player-name">{gameState.player.name}</div>
        <AnimatedMoney value={gameState.player.money} />
        <AnimatedEnergy value={gameState.player.energy} max={MAX_ENERGY} />
      </div>

      {/* Food warning */}
      {gameState.player.daysWithoutFood > 0 && (
        <div className="warning food-warning">
          Days without food: {gameState.player.daysWithoutFood}/{starvationDays} - EAT OR DIE!
        </div>
      )}

      {/* Tab navigation */}
      <div className="tab-bar">
        <button
          className={`tab-button ${currentTab === 'location' ? 'active' : ''}`}
          onClick={() => setTab('location')}
        >
          {currentLocation?.name ?? 'Unknown'}
        </button>
        <button
          className={`tab-button ${currentTab === 'map' ? 'active' : ''}`}
          onClick={() => setTab('map')}
        >
          Map
        </button>
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {currentTab === 'location' && (
          <div className="location-tab">
            {currentLocation ? (
              <>
                <div className="location-header">
                  <h2>{currentLocation.name}</h2>
                  <p>{currentLocation.description}</p>
                </div>

                <div className="activities-grid">
                  {locationActivities.map((activity) => {
                    const check = canPerformActivity(gameState, activity.id);
                    return (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        canPerform={check.canPerform}
                        reason={check.reason}
                        onClick={() => handleActivityClick(activity)}
                      />
                    );
                  })}

                  {locationActivities.length === 0 && (
                    <div className="no-activities">
                      <p>Nothing to do here.</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="stranded-notice">
                <h2>Stranded!</h2>
                <p>You're on the road with nowhere to go.</p>
                <p>Call a tow truck or walk to a location.</p>
              </div>
            )}
          </div>
        )}

        {currentTab === 'map' && (
          <div className="map-tab">
            <TileMap
              playerPosition={gameState.player.position}
              carPositions={gameState.inventory.cars.map((car) => ({
                x: car.position.x,
                y: car.position.y,
                instanceId: car.instanceId,
              }))}
              onLocationClick={handleMapLocationClick}
            />

            {selectedMapLocation && (
              <LocationInfoPanel
                location={selectedMapLocation}
                playerPosition={gameState.player.position}
                hasCarHere={hasCarHere}
                onWalk={handleWalk}
                onDrive={handleDrive}
                onClose={handleMapLocationClose}
              />
            )}
          </div>
        )}
      </div>

      {/* Player stats (collapsed) */}
      <div className="player-stats-bar">
        <span className="stat">CHA: {gameState.player.stats.charisma}</span>
        <span className="stat">MEC: {gameState.player.stats.mechanical}</span>
        <span className="stat">FIT: {gameState.player.stats.fitness}</span>
        <span className="stat">KNO: {gameState.player.stats.knowledge}</span>
        <span className="stat">DRV: {gameState.player.stats.driving}</span>
      </div>

      {/* Footer */}
      <button className="quit-button" onClick={resetGame}>
        Quit to Menu
      </button>

      {/* Activity Modal */}
      {selectedActivity && (
        <ActivityModal
          activity={selectedActivity}
          gameState={gameState}
          onExecute={handleActivityExecute}
          onCancel={handleModalClose}
        />
      )}

      {/* Fade transition for activity execution */}
      <FadeTransition isActive={isExecutingActivity}>
        Working...
      </FadeTransition>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
