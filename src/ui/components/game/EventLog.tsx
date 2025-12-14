import { GameEvent } from '@engine/types';

interface EventLogProps {
  events: GameEvent[];
  onDismiss: () => void;
}

export function EventLog({ events, onDismiss }: EventLogProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <div className="event-log">
      <h4>Events</h4>
      {events.map((event, i) => (
        <div key={i} className={`event event-${event.type}`}>
          {event.message}
        </div>
      ))}
      <button onClick={onDismiss}>Dismiss</button>
    </div>
  );
}
