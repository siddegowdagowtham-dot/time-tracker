import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Activity, Category } from '../types';
import { loadActivities, saveActivities } from '../utils/storage';
import { getDateKey } from '../utils/time';

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>(() => loadActivities());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    saveActivities(activities);
  }, [activities]);

  const startActivity = useCallback((name: string, category: Category) => {
    setActivities((prev) => {
      const timestamp = Date.now();
      const updated = prev.map((a) =>
        a.isRunning ? { ...a, isRunning: false, endTime: timestamp } : a
      );
      const newActivity: Activity = {
        id: uuidv4(),
        name,
        category,
        startTime: timestamp,
        endTime: null,
        isRunning: true,
      };
      return [...updated, newActivity];
    });
  }, []);

  const stopActivity = useCallback((id: string) => {
    setActivities((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, isRunning: false, endTime: Date.now() } : a
      )
    );
  }, []);

  const deleteActivity = useCallback((id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const runningActivity = activities.find((a) => a.isRunning) || null;

  const todayKey = getDateKey(now);
  const todayActivities = activities.filter(
    (a) => getDateKey(a.startTime) === todayKey
  );

  const getActivitiesByDate = useCallback(
    (dateKey: string) => {
      return activities.filter((a) => getDateKey(a.startTime) === dateKey);
    },
    [activities]
  );

  const getUniqueDates = useCallback(() => {
    const dates = new Set(activities.map((a) => getDateKey(a.startTime)));
    return Array.from(dates).sort().reverse();
  }, [activities]);

  const getCategoryBreakdown = useCallback(
    (dateKey?: string) => {
      const filtered = dateKey
        ? activities.filter((a) => getDateKey(a.startTime) === dateKey)
        : activities.filter((a) => getDateKey(a.startTime) === todayKey);
      const breakdown: Record<string, number> = {};
      filtered.forEach((a) => {
        const end = a.endTime ?? a.startTime;
        const minutes = (end - a.startTime) / 60000;
        breakdown[a.category] = (breakdown[a.category] || 0) + minutes;
      });
      return breakdown;
    },
    [activities, todayKey]
  );

  const getWeeklyData = useCallback(() => {
    const days: { date: string; total: number; categories: Record<string, number> }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = getDateKey(d.getTime());
      const dayActivities = activities.filter(
        (a) => getDateKey(a.startTime) === dateKey
      );
      const categories: Record<string, number> = {};
      let total = 0;
      dayActivities.forEach((a) => {
        const end = a.endTime ?? a.startTime;
        const minutes = (end - a.startTime) / 60000;
        categories[a.category] = (categories[a.category] || 0) + minutes;
        total += minutes;
      });
      days.push({
        date: d.toLocaleDateString([], { weekday: 'short' }),
        total: Math.round(total),
        categories,
      });
    }
    return days;
  }, [activities, now]);

  return {
    activities,
    todayActivities,
    runningActivity,
    startActivity,
    stopActivity,
    deleteActivity,
    getActivitiesByDate,
    getUniqueDates,
    getCategoryBreakdown,
    getWeeklyData,
  };
}
