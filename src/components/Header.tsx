import { Timer, BarChart3, History } from 'lucide-react';
import type { ViewMode } from '../types';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export function Header({ viewMode, setViewMode }: HeaderProps) {
  const tabs: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'tracker', label: 'Tracker', icon: <Timer size={18} /> },
    { mode: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={18} /> },
    { mode: 'history', label: 'History', icon: <History size={18} /> },
  ];

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <Timer size={28} strokeWidth={2.5} />
          <h1>TimeFlow</h1>
        </div>
        <nav className="nav-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.mode}
              className={`nav-tab ${viewMode === tab.mode ? 'active' : ''}`}
              onClick={() => setViewMode(tab.mode)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
