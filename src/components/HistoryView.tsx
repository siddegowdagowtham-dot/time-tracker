import { Calendar } from 'lucide-react';
import type { Activity, Category } from '../types';
import { CATEGORY_COLORS } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { formatDuration, formatTime, getDayLabel } from '../utils/time';

interface HistoryViewProps {
  getUniqueDates: () => string[];
  getActivitiesByDate: (dateKey: string) => Activity[];
  getCategoryBreakdown: (dateKey?: string) => Record<string, number>;
  onDelete: (id: string) => void;
}

export function HistoryView({
  getUniqueDates,
  getActivitiesByDate,
  getCategoryBreakdown,
  onDelete,
}: HistoryViewProps) {
  const dates = getUniqueDates();

  if (dates.length === 0) {
    return (
      <div className="history-empty">
        <Calendar size={48} strokeWidth={1.5} />
        <p>No history yet</p>
        <p className="subtle">Activities will appear here once you start tracking</p>
      </div>
    );
  }

  return (
    <div className="history">
      {dates.map((dateKey) => {
        const dayActivities = getActivitiesByDate(dateKey);
        const breakdown = getCategoryBreakdown(dateKey);
        const totalMinutes = Object.values(breakdown).reduce(
          (s, v) => s + v,
          0
        );

        return (
          <div key={dateKey} className="history-day">
            <div className="history-day-header">
              <div className="history-day-label">
                <Calendar size={16} />
                <span>{getDayLabel(dateKey)}</span>
              </div>
              <div className="history-day-total">
                {Math.round(totalMinutes)}m total
              </div>
            </div>

            <div className="history-day-breakdown">
              {Object.entries(breakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, minutes]) => (
                  <div key={cat} className="breakdown-item">
                    <div
                      className="breakdown-bar"
                      style={{
                        width: `${(minutes / totalMinutes) * 100}%`,
                        backgroundColor: CATEGORY_COLORS[cat as Category],
                      }}
                    />
                    <span className="breakdown-label">{cat}</span>
                    <span className="breakdown-value">{Math.round(minutes)}m</span>
                  </div>
                ))}
            </div>

            <div className="history-activities">
              {dayActivities
                .filter((a) => !a.isRunning)
                .reverse()
                .map((activity) => {
                  const duration =
                    (activity.endTime || Date.now()) - activity.startTime;
                  return (
                    <div key={activity.id} className="history-activity-item">
                      <CategoryIcon category={activity.category} size={14} />
                      <span className="history-activity-name">
                        {activity.name}
                      </span>
                      <span className="history-activity-time">
                        {formatTime(activity.startTime)} -{' '}
                        {activity.endTime
                          ? formatTime(activity.endTime)
                          : 'now'}
                      </span>
                      <span className="history-activity-duration">
                        {formatDuration(duration)}
                      </span>
                      <button
                        className="delete-btn-sm"
                        onClick={() => onDelete(activity.id)}
                      >
                        &times;
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
