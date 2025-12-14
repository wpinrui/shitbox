import { PlayerStats, StatName } from '@engine/index';
import { AnimatedClock } from './AnimatedClock';
import { AnimatedMoney } from './AnimatedMoney';
import { AnimatedEnergy } from './AnimatedEnergy';
import './Sidebar.css';

const STAT_ORDER: StatName[] = ['charisma', 'mechanical', 'fitness', 'knowledge', 'driving'];

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface SidebarProps {
  playerName: string;
  day: number;
  hour: number;
  minute: number;
  money: number;
  energy: number;
  maxEnergy: number;
  stats: PlayerStats;
  daysWithoutFood: number;
  starvationDays: number;
  isOpen: boolean;
  onClose: () => void;
  onQuit: () => void;
}

export function Sidebar({
  playerName,
  day,
  hour,
  minute,
  money,
  energy,
  maxEnergy,
  stats,
  daysWithoutFood,
  starvationDays,
  isOpen,
  onClose,
  onQuit,
}: SidebarProps) {
  if (!isOpen) return null;

  return (
    <aside className="sidebar">
      <button className="sidebar-close-button" onClick={onClose} aria-label="Close sidebar">
        &times;
      </button>
      <div className="sidebar-content">
        <div className="sidebar-player-name">{playerName}</div>

        <AnimatedClock day={day} hour={hour} minute={minute} />

        <div className="sidebar-divider" />

        <AnimatedMoney value={money} />
        <AnimatedEnergy value={energy} max={maxEnergy} />

        {daysWithoutFood > 0 && (
          <div className="sidebar-food-warning">
            {daysWithoutFood}/{starvationDays} days without food
          </div>
        )}

        <div className="sidebar-divider" />

        <div className="sidebar-stats">
          {STAT_ORDER.map((stat) => (
            <div key={stat} className="sidebar-stat">
              <span className="sidebar-stat-label">{capitalize(stat)}</span>
              <span className="sidebar-stat-value">{stats[stat]}</span>
            </div>
          ))}
        </div>
      </div>

      <button className="sidebar-menu-button" onClick={onQuit}>
        Menu
      </button>
    </aside>
  );
}
