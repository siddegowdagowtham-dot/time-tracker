import { Trash2, Clock } from 'lucide-react';
import type { Activity } from '../types';
import { CATEGORY_COLORS } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { formatDuration, formatTime } from '../utils/time';

interface ActivityListProps {
  activities: Activity[];
  onDelete: (id: string) => void;
  title?: string;
}

export function ActivityList({ activities, onDelete, title }: ActivityListProps) {
  const completed = activities.filter((a) => !a.isRunning);

  if (completed.length === 0) {
    return (
      <div className="activity-list-empty">
        <Clock size={40} strokeWidth={1.5} />
        <p>No activities recorded yet</p>
        <p className="subtle">Start tracking to see your activities here</p>
      </div>
    );
  }

  return (
    <div className="activity-list">
      {title && <h3 className="activity-list-title">{title}</h3>}
      {completed
        .slice()
        .reverse()
        .map((activity) => {
          const duration = (activity.endTime ?? activity.startTime) - activity.startTime;
          const color = CATEGORY_COLORS[activity.category];
          return (
            <div key={activity.id} className="activity-item">
              <div
                className="activity-item-bar"
                style={{ backgroundColor: color }}
              />
              <div className="activity-item-content">
                <div className="activity-item-top">
                  <div className="activity-item-info">
                    <CategoryIcon category={activity.category} size={16} />
                    <span className="activity-item-name">{activity.name}</span>
                    <span
                      className="activity-item-badge"
                      style={{ backgroundColor: color + '20', color }}
                    >
                      {activity.category}
                    </span>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={() => onDelete(activity.id)}
                    title="Delete activity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="activity-item-bottom">
                  <span className="activity-item-time">
                    {formatTime(activity.startTime)} -{' '}
                    {activity.endTime ? formatTime(activity.endTime) : 'now'}
                  </span>
                  <span className="activity-item-duration">
                    {formatDuration(duration)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}
