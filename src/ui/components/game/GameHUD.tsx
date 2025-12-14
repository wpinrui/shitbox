import { MAX_ENERGY } from '@engine/index';

interface GameHUDProps {
  money: number;
  energy: number;
}

export function GameHUD({ money, energy }: GameHUDProps) {
  const energyPercent = (energy / MAX_ENERGY) * 100;

  return (
    <div className="game-hud">
      <div className="resource money">
        <span className="label">Money</span>
        <span className="value">${money}</span>
      </div>
      <div className="resource energy">
        <span className="label">Energy</span>
        <div className="energy-bar">
          <div className="energy-fill" style={{ width: `${energyPercent}%` }} />
        </div>
        <span className="value">
          {energy}/{MAX_ENERGY}
        </span>
      </div>
    </div>
  );
}
