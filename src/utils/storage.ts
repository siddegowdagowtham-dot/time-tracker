import type { Activity } from '../types';

const STORAGE_KEY = 'time-tracker-activities';

export function loadActivities(): Activity[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as Activity[];
  } catch {
    return [];
  }
}

export function saveActivities(activities: Activity[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
}
