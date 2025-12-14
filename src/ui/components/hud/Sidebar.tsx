import { AnimatedClock } from './AnimatedClock';
import { AnimatedMoney } from './AnimatedMoney';
import { AnimatedEnergy } from './AnimatedEnergy';
import './Sidebar.css';

interface PlayerStats {
  charisma: number;
  mechanical: number;
  fitness: number;
  knowledge: number;
  driving: number;
}

interface SidebarProps {
  playerName: string;
  day: number;
  hour: number;
  money: number;
  energy: number;
  maxEnergy: number;
  stats: PlayerStats;
  daysWithoutFood: number;
  starvationDays: number;
  onQuit: () => void;
}

export function Sidebar({
  playerName,
  day,
  hour,
  money,
  energy,
  maxEnergy,
  stats,
  daysWithoutFood,
  starvationDays,
  onQuit,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <div className="sidebar-player-name">{playerName}</div>

        <AnimatedClock day={day} hour={hour} />

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
          <div className="sidebar-stat">
            <span className="sidebar-stat-label">CHA</span>
            <span className="sidebar-stat-value">{stats.charisma}</span>
          </div>
          <div className="sidebar-stat">
            <span className="sidebar-stat-label">MEC</span>
            <span className="sidebar-stat-value">{stats.mechanical}</span>
          </div>
          <div className="sidebar-stat">
            <span className="sidebar-stat-label">FIT</span>
            <span className="sidebar-stat-value">{stats.fitness}</span>
          </div>
          <div className="sidebar-stat">
            <span className="sidebar-stat-label">KNO</span>
            <span className="sidebar-stat-value">{stats.knowledge}</span>
          </div>
          <div className="sidebar-stat">
            <span className="sidebar-stat-label">DRV</span>
            <span className="sidebar-stat-value">{stats.driving}</span>
          </div>
        </div>
      </div>

      <button className="sidebar-menu-button" onClick={onQuit}>
        Menu
      </button>
    </aside>
  );
}
