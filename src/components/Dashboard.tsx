
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, Clock, Target, Zap } from 'lucide-react';
import type { Category, Activity } from '../types';
import { CATEGORY_COLORS } from '../types';
import { formatMinutes } from '../utils/time';

interface DashboardProps {
  todayActivities: Activity[];
  getCategoryBreakdown: (dateKey?: string) => Record<string, number>;
  getWeeklyData: () => {
    date: string;
    total: number;
    categories: Record<string, number>;
  }[];
}

export function Dashboard({
  todayActivities,
  getCategoryBreakdown,
  getWeeklyData,
}: DashboardProps) {
  const breakdown = getCategoryBreakdown();
  const weeklyData = getWeeklyData();

  const pieData = Object.entries(breakdown)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({
      name,
      value: Math.round(value),
      color: CATEGORY_COLORS[name as Category] || '#78716c',
    }));

  const totalMinutesToday = Object.values(breakdown).reduce((s, v) => s + v, 0);
  const totalWeekMinutes = weeklyData.reduce((sum, d) => sum + d.total, 0);
  const avgDaily = totalWeekMinutes / 7;
  const completedToday = todayActivities.filter((a) => !a.isRunning).length;

  const topCategory =
    pieData.length > 0
      ? pieData.reduce((a, b) => (a.value > b.value ? a : b))
      : null;

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#3b82f620' }}>
            <Clock size={22} color="#3b82f6" />
          </div>
          <div className="stat-info">
            <div className="stat-value">{formatMinutes(totalMinutesToday)}</div>
            <div className="stat-label">Tracked Today</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#22c55e20' }}>
            <Target size={22} color="#22c55e" />
          </div>
          <div className="stat-info">
            <div className="stat-value">{completedToday}</div>
            <div className="stat-label">Activities Today</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#a855f720' }}>
            <TrendingUp size={22} color="#a855f7" />
          </div>
          <div className="stat-info">
            <div className="stat-value">{formatMinutes(avgDaily)}</div>
            <div className="stat-label">Daily Average</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f59e0b20' }}>
            <Zap size={22} color="#f59e0b" />
          </div>
          <div className="stat-info">
            <div className="stat-value">{topCategory?.name || '—'}</div>
            <div className="stat-label">Top Category</div>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Today's Time Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${formatMinutes(value)}`}
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatMinutes(Number(value))}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">
              <p>No data for today yet</p>
            </div>
          )}
        </div>

        <div className="chart-card">
          <h3>Weekly Overview</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => formatMinutes(v)}
              />
              <Tooltip formatter={(value) => formatMinutes(Number(value))} />
              <Legend />
              {Object.keys(CATEGORY_COLORS).map((cat) => (
                <Bar
                  key={cat}
                  dataKey={`categories.${cat}`}
                  name={cat}
                  stackId="a"
                  fill={CATEGORY_COLORS[cat as Category]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
