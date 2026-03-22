import { useEffect, useRef, useCallback } from 'react';

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

export function BackgroundSlideshow() {
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

    incoming.style.backgroundImage = `url('/assets/backgrounds/${photo}')`;
    incoming.classList.remove('main-menu__slide--drift-a', 'main-menu__slide--drift-b');
    void incoming.offsetWidth;
    incoming.classList.add(drift);

    incoming.classList.add('main-menu__slide--active');
    outgoing.classList.remove('main-menu__slide--active');

    useARef.current = !useARef.current;
    indexRef.current = (indexRef.current + 1) % orderRef.current.length;
  }, []);

  useEffect(() => {
    indexRef.current = 0;
    nextSlide();
    const timer = setInterval(nextSlide, INTERVAL);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <div className="main-menu__bg">
      <div className="main-menu__slide" ref={slideARef} />
      <div className="main-menu__slide" ref={slideBRef} />
      <div className="main-menu__vignette" />
    </div>
  );
}
