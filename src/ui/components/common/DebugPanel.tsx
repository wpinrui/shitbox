import { useState } from 'react';
import { useGameStore } from '@store/index';
import './DebugPanel.css';

export function DebugPanel() {
  const debugMode = useGameStore((s) => s.debugMode);
  const debugSetMoney = useGameStore((s) => s.debugSetMoney);
  const money = useGameStore((s) => s.gameState?.player.money ?? 0);
  const [moneyInput, setMoneyInput] = useState('');

  if (!debugMode) return null;

  const handleSetMoney = () => {
    const val = parseInt(moneyInput, 10);
    if (!isNaN(val)) {
      debugSetMoney(val);
      setMoneyInput('');
    }
  };

  return (
    <div className="debug-panel">
      <span className="debug-panel__label">Debug</span>
      <span>Money: ${money}</span>
      <input
        className="debug-panel__input"
        type="number"
        value={moneyInput}
        onChange={(e) => setMoneyInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSetMoney()}
        placeholder="Set $"
      />
      <button className="debug-panel__btn" onClick={handleSetMoney}>Set</button>
    </div>
  );
}
