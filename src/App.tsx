import { useState } from 'react';
import type { ViewMode } from './types';
import { useActivities } from './hooks/useActivities';
import { Header } from './components/Header';
import { RunningTimer } from './components/RunningTimer';
import { ActivityForm } from './components/ActivityForm';
import { ActivityList } from './components/ActivityList';
import { Dashboard } from './components/Dashboard';
import { HistoryView } from './components/HistoryView';
import './App.css';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('tracker');
  const {
    todayActivities,
    runningActivity,
    startActivity,
    stopActivity,
    deleteActivity,
    getActivitiesByDate,
    getUniqueDates,
    getCategoryBreakdown,
    getWeeklyData,
  } = useActivities();

  return (
    <div className="app">
      <Header viewMode={viewMode} setViewMode={setViewMode} />
      <main className="main">
        {viewMode === 'tracker' && (
          <div className="tracker-view">
            {runningActivity && (
              <RunningTimer activity={runningActivity} onStop={stopActivity} />
            )}
            <ActivityForm
              onStart={startActivity}
              disabled={false}
            />
            <ActivityList
              activities={todayActivities}
              onDelete={deleteActivity}
              title="Today's Activities"
            />
          </div>
        )}
        {viewMode === 'dashboard' && (
          <Dashboard
            todayActivities={todayActivities}
            getCategoryBreakdown={getCategoryBreakdown}
            getWeeklyData={getWeeklyData}
          />
        )}
        {viewMode === 'history' && (
          <HistoryView
            getUniqueDates={getUniqueDates}
            getActivitiesByDate={getActivitiesByDate}
            getCategoryBreakdown={getCategoryBreakdown}
            onDelete={deleteActivity}
          />
        )}
      </main>
    </div>
  );
}

export default App;
