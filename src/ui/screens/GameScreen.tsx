import { useCallback, useState } from 'react';
import { useGameStore } from '@store/index';
import { LocationList } from '@ui/components/map';
import { ActivityCard, ActivityModal } from '@ui/components/location';
import { ConfirmDialog, ToastContainer, FadeTransition } from '@ui/components/common';
import { Sidebar } from '@ui/components/hud';
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

  const [showQuitDialog, setShowQuitDialog] = useState(false);

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

  const handleWalk = useCallback((location: LocationDefinition) => {
    const result = walkTo(location.position);
    if (result.success) {
      addToast(`Walked to ${location.name}`, 'info');
    } else if (result.error) {
      addToast(result.error, 'error');
    }
  }, [walkTo, addToast]);

  const handleDrive = useCallback((location: LocationDefinition) => {
    const result = driveTo(location.position);
    if (result.success) {
      addToast(`Drove to ${location.name}`, 'info');
    } else if (result.error) {
      addToast(result.error, 'error');
    }
  }, [driveTo, addToast]);

  const handleQuitClick = () => {
    setShowQuitDialog(true);
  };

  const handleQuitConfirm = () => {
    setShowQuitDialog(false);
    resetGame();
  };

  const handleQuitCancel = () => {
    setShowQuitDialog(false);
  };

  return (
    <div className="game-screen">
      <Sidebar
        playerName={gameState.player.name}
        day={gameState.time.currentDay}
        hour={gameState.time.currentHour}
        minute={gameState.time.currentMinute}
        money={gameState.player.money}
        energy={gameState.player.energy}
        maxEnergy={MAX_ENERGY}
        stats={gameState.player.stats}
        daysWithoutFood={gameState.player.daysWithoutFood}
        starvationDays={starvationDays}
        onQuit={handleQuitClick}
      />

      <main className="game-main">
        {/* Tab navigation */}
        <div className="tab-bar">
          <button
            className={`tab-button ${currentTab === 'location' ? 'active' : ''}`}
            onClick={() => setTab('location')}
          >
            {currentLocation?.name ?? 'Stranded'}
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
                  <p className="location-description">{currentLocation.description}</p>
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
                  <p>You're on the road with nowhere to go.</p>
                  <p>Open the Map to walk or drive to a location.</p>
                </div>
              )}
            </div>
          )}

          {currentTab === 'map' && (
            <div className="map-tab">
              <LocationList
                playerPosition={gameState.player.position}
                playerFitness={gameState.player.stats.fitness}
                hasCarHere={hasCarHere}
                onWalk={handleWalk}
                onDrive={handleDrive}
              />
            </div>
          )}
        </div>
      </main>

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

      {/* Quit confirmation dialog */}
      {showQuitDialog && (
        <ConfirmDialog
          title="Quit to Menu?"
          message="Your progress will be lost. Are you sure you want to quit?"
          confirmText="Quit"
          cancelText="Keep Playing"
          onConfirm={handleQuitConfirm}
          onCancel={handleQuitCancel}
        />
      )}
    </div>
  );
}
