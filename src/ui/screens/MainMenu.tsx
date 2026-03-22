import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@store/index';
import { LoadGameDialog } from '@ui/components/common';

const PHOTOS = [
  'hero.jpg',
  'scrapyard.jpg', 'school.jpg', 'bank.jpg',
  'gas_station.jpg', 'auction.jpg', 'showroom.jpg', 'garage.jpg',
  'workshop.jpg', 'car_wash.jpg', 'apartments.jpg', 'budget_house.jpg',
  'penthouse.jpg', 'parking_lot.jpg', 'gym.jpg', 'film_school.jpg', 'map.jpg',
];

const INTERVAL = 8000;

function shuffle(arr: string[]): string[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function MainMenu() {
  const setScreen = useGameStore((state) => state.setScreen);
  const loadGame = useGameStore((state) => state.loadGame);

  const [showLoadDialog, setShowLoadDialog] = useState(false);

  // Slideshow state
  const orderRef = useRef<string[]>([PHOTOS[0], ...shuffle(PHOTOS.slice(1))]);
  const indexRef = useRef(0);
  const useARef = useRef(true);
  const slideARef = useRef<HTMLDivElement>(null);
  const slideBRef = useRef<HTMLDivElement>(null);

  const drifts = ['main-menu__slide--drift-a', 'main-menu__slide--drift-b'];

  const nextSlide = useCallback(() => {
    const incoming = useARef.current ? slideARef.current : slideBRef.current;
    const outgoing = useARef.current ? slideBRef.current : slideARef.current;
    if (!incoming || !outgoing) return;

    const drift = drifts[Math.floor(Math.random() * drifts.length)];
    const photo = orderRef.current[indexRef.current];

    // Set background and reset animation
    incoming.style.backgroundImage = `url('/assets/backgrounds/${photo}')`;
    incoming.classList.remove('main-menu__slide--drift-a', 'main-menu__slide--drift-b');
    void incoming.offsetWidth; // force reflow
    incoming.classList.add(drift);

    incoming.classList.add('main-menu__slide--active');
    outgoing.classList.remove('main-menu__slide--active');

    useARef.current = !useARef.current;
    indexRef.current = (indexRef.current + 1) % orderRef.current.length;
  }, []);

  useEffect(() => {
    nextSlide();
    const timer = setInterval(nextSlide, INTERVAL);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const handleLoad = (saveId: string) => {
    loadGame(saveId);
    setShowLoadDialog(false);
  };

  return (
    <div className="main-menu">
      {/* Background slideshow */}
      <div className="main-menu__bg">
        <div className="main-menu__slide" ref={slideARef} />
        <div className="main-menu__slide" ref={slideBRef} />
        <div className="main-menu__vignette" />
      </div>

      {/* Menu card */}
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
