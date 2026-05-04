import { useState, useEffect } from 'react';
import { Square } from 'lucide-react';
import type { Activity } from '../types';
import { CATEGORY_COLORS } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { formatDuration } from '../utils/time';

interface RunningTimerProps {
  activity: Activity;
  onStop: (id: string) => void;
}

export function RunningTimer({ activity, onStop }: RunningTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startTime = activity.startTime;
    const tick = () => setElapsed(Date.now() - startTime);
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activity.startTime]);

  const color = CATEGORY_COLORS[activity.category];

  return (
    <div className="running-timer" style={{ borderColor: color }}>
      <div className="running-timer-pulse" style={{ backgroundColor: color }} />
      <div className="running-timer-content">
        <div className="running-timer-info">
          <CategoryIcon category={activity.category} size={22} />
          <div>
            <div className="running-timer-name">{activity.name}</div>
            <div className="running-timer-category" style={{ color }}>
              {activity.category}
            </div>
          </div>
        </div>
        <div className="running-timer-right">
          <div className="running-timer-elapsed">{formatDuration(elapsed)}</div>
          <button
            className="stop-btn"
            onClick={() => onStop(activity.id)}
            title="Stop timer"
          >
            <Square size={20} fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}
