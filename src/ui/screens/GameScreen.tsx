import { useCallback, useEffect, useState } from 'react';
import { useGameStore } from '@store/index';
import { LocationList } from '@ui/components/map';
import { ActivityCard, ActivityModal } from '@ui/components/location';
import { PauseMenu, ToastContainer, NewspaperModal } from '@ui/components/common';
import {
  getLocationActivities,
  getLocationAtPosition,
  canPerformActivity,
  MAX_ENERGY,
  STAT_ORDER,
  type ActivityDefinition,
  type LocationDefinition,
} from '@engine/index';
import './GameScreen.css';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

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
  const walkTo = useGameStore((state) => state.walkTo);
  const driveTo = useGameStore((state) => state.driveTo);
  const saveGame = useGameStore((state) => state.saveGame);
  const loadGame = useGameStore((state) => state.loadGame);
  const takeGig = useGameStore((state) => state.takeGig);

  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [showNewspaper, setShowNewspaper] = useState(false);

  const newspaperPurchasedToday =
    gameState.newspaper.purchased &&
    gameState.newspaper.currentDay === gameState.time.currentDay;

  // Close newspaper modal if day advances or state clears while open
  useEffect(() => {
    if (showNewspaper && !newspaperPurchasedToday) {
      setShowNewspaper(false);
    }
  }, [showNewspaper, newspaperPurchasedToday]);

  const currentLocation = getLocationAtPosition(gameState.player.position);

  // Location-specific activities (from the location's own activity file)
  const locationSpecific = currentLocation
    ? getLocationActivities(currentLocation.id)
    : [];

  // Universal activities (nap, sleep) — loaded from misc.json
  const universalActivities = getLocationActivities('misc');

  const hasCarHere = gameState.inventory.cars.some(
    (car) =>
      car.position.x === gameState.player.position.x &&
      car.position.y === gameState.player.position.y &&
      car.engineCondition > 0
  );

  // Background image for current location or map
  const bgImage = currentTab === 'map'
    ? 'map.jpg'
    : currentLocation?.backgroundImage ?? 'scrapyard.jpg';

  const handleActivityClick = (activity: ActivityDefinition) => {
    setSelectedActivity(activity);
  };

  // Called by ActivityModal — executes immediately, returns result for display
  const handleActivityExecute = useCallback(
    (params: { hours?: number }) => {
      if (!selectedActivity) return;
      return performActivity(selectedActivity.id, params);
    },
    [selectedActivity, performActivity]
  );

  const handleModalClose = () => {
    setSelectedActivity(null);
  };

  const handleOpenNewspaper = useCallback(() => {
    setShowNewspaper(true);
  }, []);

  const handleTakeGig = useCallback((gigId: string) => {
    const result = takeGig(gigId);
    if (!result.success && result.error) {
      addToast(result.error, 'error');
    }
    return result;
  }, [takeGig, addToast]);

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

  const handleMenuClick = () => {
    setShowPauseMenu(true);
  };

  const handleSave = async () => {
    await saveGame();
  };

  const handleLoad = (saveId: string) => {
    loadGame(saveId);
    setShowPauseMenu(false);
  };

  const handleQuit = () => {
    setShowPauseMenu(false);
    resetGame();
  };

  const handleLeave = () => {
    setTab('map');
  };

  // Format clock
  const hour = gameState.time.currentHour;
  const minute = gameState.time.currentMinute;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  const clockStr = `${displayHour}:${String(minute).padStart(2, '0')} ${ampm}`;

  const energyPct = (gameState.player.energy / MAX_ENERGY) * 100;

  return (
    <div className={`game-screen ${showPauseMenu || selectedActivity || showNewspaper ? 'game-screen--modal-open' : ''}`}>
      {/* Background */}
      <div className="bg">
        <div
          className="bg__photo"
          style={{ backgroundImage: `url('/assets/backgrounds/${bgImage}')` }}
        />
        <div className="bg__vignette" />
      </div>

      {/* Shell + Panel */}
      <div className="shell">
        <div className="panel">

          {/* ═══ HEADER ═══ */}
          <div className="header">
            <div className="header__left">
              {currentTab === 'map' ? (
                <>
                  <button className="btn-nav" onClick={() => setTab('location')}>Back</button>
                  <div className="header__title">Greymont</div>
                  <div className="header__subtitle">Choose a destination</div>
                </>
              ) : (
                <>
                  <div className="header__title">{currentLocation?.name ?? 'Stranded'}</div>
                  {currentLocation && (
                    <div className="header__subtitle">{currentLocation.description}</div>
                  )}
                </>
              )}
            </div>
            <div className="header__resources">
              <div className="res">
                <span className="res__label">Day</span>
                <span>{gameState.time.currentDay}</span>
              </div>
              <div className="header__divider" />
              <div className="res">{clockStr}</div>
              <div className="header__divider" />
              <div className="res">${gameState.player.money.toLocaleString()}</div>
              <div className="header__divider" />
              <div className="energy-bar">
                <span className="energy-bar__icon">⚡</span>
                <div className="energy-bar__track">
                  <div className="energy-bar__fill" style={{ width: `${energyPct}%` }} />
                </div>
                <span className="energy-bar__text">{gameState.player.energy}</span>
              </div>
              {gameState.player.daysWithoutFood > 0 && (
                <div className="food-warn">🍔 !</div>
              )}
            </div>
          </div>

          {/* ═══ BODY ═══ */}
          <div className="body">

            {/* Player Sub-Card */}
            <div className="player-card">
              <div className="player-card__name">{gameState.player.name}</div>
              <div className="player-card__divider" />

              <div className="player-card__label">Stats</div>
              {STAT_ORDER.map((stat) => (
                <div key={stat} className="row-3">
                  <span className="row-3__label">{capitalize(stat)}</span>
                  <span className="row-3__value">{gameState.player.stats[stat]}</span>
                </div>
              ))}

              <div className="player-card__divider" />

              <div className="player-card__label">Inventory</div>
              <div className="row-3">
                <span className="row-3__label">
                  <span className="row-3__icon">🔧</span>Parts
                </span>
                <span className="row-3__value">
                  {(gameState.inventory.engineParts ?? 0) + (gameState.inventory.bodyParts ?? 0)}
                </span>
              </div>
              <div className="row-3">
                <span className="row-3__label">
                  <span className="row-3__icon">🚗</span>Cars
                </span>
                <span className="row-3__value">{gameState.inventory.cars.length}</span>
              </div>

              <button className="btn-primary player-card__menu-btn" onClick={handleMenuClick}>
                Menu
              </button>
            </div>

            {/* Content Area */}
            {currentTab === 'location' && (
              <div className="content-area">
                {currentLocation ? (
                  <>
                    {/* Location-specific activities */}
                    {locationSpecific.length > 0 && (
                      <div className="activities-grid">
                        {locationSpecific.map((activity) => {
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
                      </div>
                    )}

                    {/* Divider — only if there are location activities above */}
                    {locationSpecific.length > 0 && <div className="section-divider" />}

                    {/* Universal actions + Leave */}
                    <div className="activities-grid">
                      {universalActivities
                        // When newspaper is purchased today, hide buy_newspaper — replaced by Read Newspaper card
                        .filter((a) => !(a.id === 'buy_newspaper' && newspaperPurchasedToday))
                        .map((activity) => {
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

                      {/* Read Newspaper card — shown after purchase, replaces Buy Newspaper */}
                      {newspaperPurchasedToday && (
                        <div className="card" onClick={() => setShowNewspaper(true)} style={{ cursor: 'pointer' }}>
                          <div className="card__name">Read Newspaper</div>
                          <div className="card__desc">Today's paper is on hand — check the headlines and available gigs.</div>
                        </div>
                      )}

                      {/* Leave card — always present */}
                      <div className="card" onClick={handleLeave} style={{ cursor: 'pointer' }}>
                        <div className="card__name">Leave</div>
                        <div className="card__desc">Open the map and travel to another location.</div>
                      </div>
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
              <LocationList
                playerPosition={gameState.player.position}
                playerFitness={gameState.player.stats.fitness}
                hasCarHere={hasCarHere}
                onWalk={handleWalk}
                onDrive={handleDrive}
              />
            )}
          </div>
        </div>
      </div>

      {/* Activity Modal — three-phase: hours picker → progress → outcome */}
      {selectedActivity && (
        <ActivityModal
          activity={selectedActivity}
          gameState={gameState}
          onExecute={handleActivityExecute}
          onClose={handleModalClose}
          onOpenNewspaper={selectedActivity.id === 'buy_newspaper' ? handleOpenNewspaper : undefined}
        />
      )}

      {/* Newspaper Modal */}
      {showNewspaper && newspaperPurchasedToday && (
        <NewspaperModal
          newspaper={gameState.newspaper}
          currentDay={gameState.time.currentDay}
          onTakeGig={handleTakeGig}
          onClose={() => setShowNewspaper(false)}
        />
      )}

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Pause menu */}
      {showPauseMenu && (
        <PauseMenu
          onSave={handleSave}
          onLoad={handleLoad}
          onQuit={handleQuit}
          onClose={() => setShowPauseMenu(false)}
        />
      )}
    </div>
  );
}
