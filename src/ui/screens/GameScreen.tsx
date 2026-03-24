import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '@store/index';
import { LocationList, TravelConfirmModal } from '@ui/components/map';
import { ActivityCard, ActivityModal, CarCard, CarSelector, BrowseResultsModal, SleepModal, ChillModal } from '@ui/components/location';
import { PauseMenu, ToastContainer, NewspaperModal } from '@ui/components/common';
import {
  getLocationActivities,
  getLocationAtPosition,
  canPerformActivity,
  getCarDefinition,
  getConditionRating,
  getSleepContext,
  getChillPresets,
  formatSleepDuration,
  MAX_ENERGY,
  STAT_ORDER,
  getTimeOfDay,
  type ActivityDefinition,
  type LocationDefinition,
  type CarDefinition,
  type CarListing,
} from '@engine/index';
import './GameScreen.css';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Round a number up to 1 decimal place. */
const round1 = (n: number) => (Math.ceil(n * 10) / 10).toFixed(1);

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
  const muted = useGameStore((state) => state.muted);
  const toggleMute = useGameStore((state) => state.toggleMute);
  const selectedCarInstanceId = useGameStore((state) => state.selectedCarInstanceId);
  const setSelectedCarInstanceId = useGameStore((state) => state.setSelectedCarInstanceId);
  const pendingEvents = useGameStore((state) => state.pendingEvents);
  const clearEvents = useGameStore((state) => state.clearEvents);
  const crashPromptActive = useGameStore((state) => state.crashPromptActive);
  const sleep = useGameStore((state) => state.sleep);
  const chill = useGameStore((state) => state.chill);

  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [showSleepConfirm, setShowSleepConfirm] = useState(false);
  const [showChillModal, setShowChillModal] = useState(false);
  const [showNewspaper, setShowNewspaper] = useState(false);
  const [browseListings, setBrowseListings] = useState<CarListing[] | null>(null);
  const [pendingTravel, setPendingTravel] = useState<LocationDefinition | null>(null);
  const [travelLoading, setTravelLoading] = useState<string | null>(null);
  const [restLoading, setRestLoading] = useState<{ label: string; action: () => void } | null>(null);

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

  // Universal activities (buy_newspaper) — loaded from misc.json
  const universalActivities = getLocationActivities('misc');

  const hasCarHere = gameState.inventory.cars.some(
    (car) =>
      car.position.x === gameState.player.position.x &&
      car.position.y === gameState.player.position.y &&
      car.engineCondition > 0
  );

  // All cars at the player's current position (regardless of condition)
  const carsHere = gameState.inventory.cars.filter(
    (car) =>
      car.position.x === gameState.player.position.x &&
      car.position.y === gameState.player.position.y
  );

  // Build a lookup of car definitions for cars at this location
  const carDefsMap = new Map<string, CarDefinition>();
  for (const car of carsHere) {
    const def = getCarDefinition(car.carId);
    if (def) carDefsMap.set(car.carId, def);
  }

  // Auto-select first car when location changes or selection becomes invalid
  useEffect(() => {
    if (carsHere.length === 0) {
      if (selectedCarInstanceId !== null) setSelectedCarInstanceId(null);
      return;
    }
    const stillHere = carsHere.some((c) => c.instanceId === selectedCarInstanceId);
    if (!stillHere) {
      setSelectedCarInstanceId(carsHere[0].instanceId);
    }
  }, [gameState.player.position.x, gameState.player.position.y, carsHere.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Estimate car value based on average condition rating
  const estimateCarValue = (car: typeof carsHere[number]) => {
    const def = carDefsMap.get(car.carId);
    if (!def) return 0;
    const avg = (car.engineCondition + car.bodyCondition) / 2;
    const rating = getConditionRating(Math.round(avg));
    return def.marketValue[rating];
  };

  // Watch for listings_shown events to open browse modal.
  // Delay opening until the activity modal's progress bar finishes (2800ms).
  // Timer is stored in a ref so that the clearEvents() re-render doesn't cancel it.
  const browseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (browseTimerRef.current) {
        clearTimeout(browseTimerRef.current);
        browseTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const listingsEvent = pendingEvents.find((e) => e.type === 'listings_shown');
    if (listingsEvent?.data?.listings) {
      clearEvents();
      const listings = listingsEvent.data.listings as CarListing[];
      if (browseTimerRef.current) {
        clearTimeout(browseTimerRef.current);
      }
      browseTimerRef.current = setTimeout(() => {
        browseTimerRef.current = null;
        setSelectedActivity(null);
        setBrowseListings(listings);
      }, 2800);
    }
  }, [pendingEvents, clearEvents, setSelectedActivity]);

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
      return performActivity(selectedActivity.id, {
        ...params,
        selectedCarInstanceId: selectedCarInstanceId ?? undefined,
      });
    },
    [selectedActivity, performActivity, selectedCarInstanceId]
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

  const handleCloseNewspaper = useCallback(() => {
    setShowNewspaper(false);
  }, []);

  const handleLocationSelect = useCallback((location: LocationDefinition) => {
    setPendingTravel(location);
  }, []);

  const handleTravelConfirm = useCallback((mode: 'walk' | 'drive') => {
    if (!pendingTravel) return;
    const location = pendingTravel;
    setPendingTravel(null);

    const result = mode === 'walk'
      ? walkTo(location.position)
      : driveTo(location.position);

    if (result.success) {
      setTravelLoading(
        mode === 'walk'
          ? `Walking to ${location.name}...`
          : `Driving to ${location.name}...`
      );
    } else if (result.error) {
      addToast(result.error, 'error');
    }
  }, [pendingTravel, walkTo, driveTo, addToast]);

  // Travel loading → transition back to location tab
  useEffect(() => {
    if (travelLoading) {
      const timer = setTimeout(() => {
        setTravelLoading(null);
        setTab('location');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [travelLoading, setTab]);

  // Rest loading (sleep/chill/crash) → execute action after progress bar
  useEffect(() => {
    if (restLoading) {
      const timer = setTimeout(() => {
        restLoading.action();
        setRestLoading(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [restLoading]);

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

  // Sleep context — computed for both voluntary and crash UI
  const sleepContext = getSleepContext(gameState);
  const chillPresets = getChillPresets(gameState.time);
  const canSleep = gameState.player.energy > 0;
  const canChill = gameState.player.energy > 0;

  const handleSleep = useCallback((rate: number) => {
    setShowSleepConfirm(false);
    const energy = gameState.player.energy;
    const exactHours = (MAX_ENERGY - energy) / rate;
    setRestLoading({
      label: `Sleeping for ${formatSleepDuration(exactHours)}...`,
      action: () => sleep(rate),
    });
  }, [sleep, gameState.player.energy]);

  const handleChill = useCallback((hours: number) => {
    setShowChillModal(false);
    setRestLoading({
      label: `Chilling for ${hours} hour${hours !== 1 ? 's' : ''}...`,
      action: () => chill(hours),
    });
  }, [chill]);

  const timeOfDay = getTimeOfDay(gameState.time.currentHour);

  // Format clock
  const hour = gameState.time.currentHour;
  const minute = gameState.time.currentMinute;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  const clockStr = `${displayHour}:${String(minute).padStart(2, '0')} ${ampm}`;

  const energyPct = Math.max(0, (gameState.player.energy / MAX_ENERGY) * 100);

  return (
    <div className={`game-screen game-screen--${timeOfDay}${showPauseMenu || selectedActivity || showNewspaper || browseListings || pendingTravel || travelLoading || restLoading || showSleepConfirm || showChillModal || crashPromptActive ? ' game-screen--modal-open' : ''}`}>
      {/* Background */}
      <div className="bg">
        <div
          className="bg__photo"
          style={{ backgroundImage: `url('/assets/backgrounds/${bgImage}')` }}
        />
        <div className="bg__tint" />
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
              <div className="res">${round1(gameState.player.money)}</div>
              <div className="header__divider" />
              <div className="energy-bar">
                <span className="energy-bar__icon">⚡</span>
                <div className="energy-bar__track">
                  <div className="energy-bar__fill" style={{ width: `${energyPct}%` }} />
                </div>
                <span className={`energy-bar__text${gameState.player.energy <= 0 ? ' energy-bar__text--danger' : ''}`}>
                  {gameState.player.energy <= 0 ? '0' : round1(gameState.player.energy)}
                </span>
              </div>
              {gameState.player.daysWithoutFood > 0 && (
                <div className="food-warn">🍔 !</div>
              )}
              <div className="header__divider" />
              <button className="btn-mute" onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'}>
                {muted ? '🔇' : '🔊'}
              </button>
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
                  <span className="row-3__value">{round1(gameState.player.stats[stat])}</span>
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
                    {/* Car card — shows when player has cars at this location */}
                    {carsHere.length === 1 && (() => {
                      const car = carsHere[0];
                      const def = carDefsMap.get(car.carId);
                      if (!def) return null;
                      return (
                        <div className="car-feature">
                          <div className="section-label">YOUR CAR</div>
                          <CarCard car={car} carDef={def} estimatedValue={estimateCarValue(car)} />
                        </div>
                      );
                    })()}

                    {/* Multi-car display + selector chip */}
                    {carsHere.length > 1 && (
                      <>
                        <div className="car-feature">
                          <div className="section-label">YOUR CARS HERE</div>
                          <div className="cars-list">
                            {carsHere.map((car) => {
                              const def = carDefsMap.get(car.carId);
                              if (!def) return null;
                              return (
                                <CarCard
                                  key={car.instanceId}
                                  car={car}
                                  carDef={def}
                                  estimatedValue={estimateCarValue(car)}
                                  compact
                                  selected={car.instanceId === selectedCarInstanceId}
                                  onClick={() => setSelectedCarInstanceId(car.instanceId)}
                                />
                              );
                            })}
                          </div>
                        </div>
                        <CarSelector
                          cars={carsHere}
                          carDefs={carDefsMap}
                          selectedId={selectedCarInstanceId ?? carsHere[0].instanceId}
                          onSelect={setSelectedCarInstanceId}
                        />
                      </>
                    )}

                    {/* Location-specific activities */}
                    {locationSpecific.length > 0 && (
                      <div className="activities-grid">
                        {locationSpecific.map((activity) => {
                          const check = canPerformActivity(gameState, activity.id, {
                            selectedCarInstanceId: selectedCarInstanceId ?? undefined,
                          });
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
                              isUniversal
                              onClick={() => handleActivityClick(activity)}
                            />
                          );
                        })}

                      {/* Read Newspaper card — shown after purchase, replaces Buy Newspaper */}
                      {newspaperPurchasedToday && (
                        <div className="card card--universal" onClick={() => setShowNewspaper(true)} style={{ cursor: 'pointer' }}>
                          <div className="card__name">Read Newspaper</div>
                          <div className="card__desc">Today's paper is on hand — check the headlines and available gigs.</div>
                        </div>
                      )}

                      {/* Sleep card — available when energy > 0 */}
                      <div
                        className={`card card--universal${!canSleep ? ' card--disabled' : ''}`}
                        onClick={canSleep ? () => setShowSleepConfirm(true) : undefined}
                        style={canSleep ? { cursor: 'pointer' } : undefined}
                      >
                        <div className="card__name">Sleep</div>
                        <div className="card__desc">Rest and recover to full energy. Rate depends on your location.</div>
                        <div className="card__divider" />
                        <div className="card__cost">
                          <span className="card__cost-icon card__cost-icon--energy">⚡</span>
                          <span className="card__cost-text card__cost-text--earn">+{sleepContext.bestRate}/hr</span>
                        </div>
                      </div>

                      {/* Chill card — available when energy > 0 */}
                      <div
                        className={`card card--universal${!canChill ? ' card--disabled' : ''}`}
                        onClick={canChill ? () => setShowChillModal(true) : undefined}
                        style={canChill ? { cursor: 'pointer' } : undefined}
                      >
                        <div className="card__name">Chill</div>
                        <div className="card__desc">Kill time. No energy cost, no money cost.</div>
                        <div className="card__divider" />
                        <div className="card__cost">
                          <span className="card__cost-icon card__cost-icon--time">⏱</span>
                          <span className="card__cost-text card__cost-text--neutral">Skip time</span>
                        </div>
                      </div>

                      {/* Leave card — always present */}
                      <div className="card card--universal" onClick={handleLeave} style={{ cursor: 'pointer' }}>
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
                onSelect={handleLocationSelect}
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
          onClose={handleCloseNewspaper}
        />
      )}

      {/* Browse Results Modal — triggered by browse_junkers activity */}
      {browseListings && (
        <BrowseResultsModal
          listings={browseListings}
          currentDay={gameState.time.currentDay}
          onClose={() => setBrowseListings(null)}
        />
      )}

      {/* Travel confirmation */}
      {pendingTravel && (
        <TravelConfirmModal
          location={pendingTravel}
          playerPosition={gameState.player.position}
          playerFitness={gameState.player.stats.fitness}
          hasCarHere={hasCarHere}
          onWalk={() => handleTravelConfirm('walk')}
          onDrive={() => handleTravelConfirm('drive')}
          onCancel={() => setPendingTravel(null)}
        />
      )}

      {/* Travel loading transition */}
      {travelLoading && (
        <div className="travel-loading-overlay">
          <div className="travel-loading">
            <div className="travel-loading__title">{travelLoading}</div>
            <div className="travel-loading__bar-track">
              <div className="travel-loading__bar-fill" />
            </div>
            <div className="travel-loading__text">Traveling...</div>
          </div>
        </div>
      )}

      {/* Rest loading (sleep/chill/crash progress bar) */}
      {restLoading && (
        <div className="travel-loading-overlay">
          <div className="travel-loading">
            <div className="travel-loading__title">{restLoading.label}</div>
            <div className="travel-loading__bar-track">
              <div className="travel-loading__bar-fill" />
            </div>
            <div className="travel-loading__text">Resting...</div>
          </div>
        </div>
      )}

      {/* Voluntary sleep confirmation */}
      {showSleepConfirm && !crashPromptActive && (
        <SleepModal
          mode="voluntary"
          options={sleepContext.options}
          bestLabel={sleepContext.bestLabel}
          bestRate={sleepContext.bestRate}
          bestHours={sleepContext.bestHours}
          onSleep={handleSleep}
          onCancel={() => setShowSleepConfirm(false)}
        />
      )}

      {/* Chill modal */}
      {showChillModal && !crashPromptActive && (
        <ChillModal
          presets={chillPresets}
          onChill={handleChill}
          onCancel={() => setShowChillModal(false)}
        />
      )}

      {/* Crash prompt — mandatory, blocks all actions. Delayed until other modals close. */}
      {crashPromptActive && !selectedActivity && !travelLoading && !restLoading && (
        <SleepModal
          mode="crash"
          options={sleepContext.options}
          bestLabel={sleepContext.bestLabel}
          bestRate={sleepContext.bestRate}
          bestHours={sleepContext.bestHours}
          onSleep={handleSleep}
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
