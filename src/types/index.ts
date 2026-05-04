export type Category =
  | 'Work'
  | 'Health'
  | 'Learning'
  | 'Personal'
  | 'Entertainment'
  | 'Chores'
  | 'Social'
  | 'Sleep'
  | 'Other';

export const CATEGORIES: Category[] = [
  'Work',
  'Health',
  'Learning',
  'Personal',
  'Entertainment',
  'Chores',
  'Social',
  'Sleep',
  'Other',
];

export const CATEGORY_COLORS: Record<Category, string> = {
  Work: '#3b82f6',
  Health: '#22c55e',
  Learning: '#a855f7',
  Personal: '#f59e0b',
  Entertainment: '#ec4899',
  Chores: '#6366f1',
  Social: '#14b8a6',
  Sleep: '#64748b',
  Other: '#78716c',
};

export const CATEGORY_ICONS: Record<Category, string> = {
  Work: 'Briefcase',
  Health: 'Heart',
  Learning: 'BookOpen',
  Personal: 'User',
  Entertainment: 'Gamepad2',
  Chores: 'Home',
  Social: 'Users',
  Sleep: 'Moon',
  Other: 'MoreHorizontal',
};

export interface Activity {
  id: string;
  name: string;
  category: Category;
  startTime: number;
  endTime: number | null;
  isRunning: boolean;
}

export interface DaySummary {
  date: string;
  totalMinutes: number;
  activities: Activity[];
  categoryBreakdown: Record<string, number>;
}

export type ViewMode = 'tracker' | 'dashboard' | 'history';
