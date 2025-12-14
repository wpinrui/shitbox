import { useGameStore } from '@store/index';

export function PlaceholderScreen({ title }: { title: string }) {
  const resetGame = useGameStore((state) => state.resetGame);

  return (
    <div className="screen placeholder-screen">
      <h1>{title}</h1>
      <button onClick={resetGame}>Return to Menu</button>
    </div>
  );
}
