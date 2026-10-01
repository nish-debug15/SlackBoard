import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  KanbanSquare,
  GanttChart,
  Bot,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
} from 'lucide-react';
import { useTasks } from '../context/TasksProvider';
import { useTheme } from '../context/ThemeProvider';
import { CopilotPanel } from './CopilotPanel';

interface AppShellProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { to: '/board', icon: KanbanSquare, label: 'Board' },
  { to: '/timeline', icon: GanttChart, label: 'Timeline' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
];

export function AppShell({ children }: AppShellProps) {
  const { schedule, settings, updateSettings } = useTasks();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const location = useLocation();

  // Ctrl/Cmd + J to toggle copilot
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setCopilotOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Calculate projected end date
  const getEndDate = useCallback(() => {
    if (!settings.startDate || schedule.projectDuration === 0) return null;
    const start = new Date(settings.startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + schedule.projectDuration);
    return end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [settings.startDate, schedule.projectDuration]);

  const endDate = getEndDate();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-bg-0)' }}>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col border-r transition-all duration-150"
        style={{
          width: sidebarCollapsed ? '52px' : 'var(--sidebar-width)',
          borderColor: 'var(--color-border-1)',
          background: 'var(--color-bg-1)',
        }}
      >
        {/* Sidebar header */}
        <div
          className="flex items-center justify-between px-3 border-b"
          style={{ height: 'var(--topbar-height)', borderColor: 'var(--color-border-1)' }}
        >
          {!sidebarCollapsed && (
            <span className="font-semibold text-sm" style={{ color: 'var(--color-text-0)' }}>
              SlackBoard
            </span>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center justify-center rounded"
            style={{
              width: '28px', height: '28px',
              color: 'var(--color-text-3)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={16} strokeWidth={1.5} /> : <ChevronLeft size={16} strokeWidth={1.5} />}
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 flex flex-col gap-0.5 p-2" role="navigation" aria-label="Main navigation">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded px-2 py-1.5 text-xs font-medium transition-colors duration-100 no-underline ${
                  isActive ? '' : ''
                }`
              }
              style={({ isActive }) => ({
                color: isActive ? 'var(--color-text-0)' : 'var(--color-text-3)',
                background: isActive ? 'var(--color-bg-3)' : 'transparent',
              })}
              title={label}
            >
              <Icon size={16} strokeWidth={1.5} />
              {!sidebarCollapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-4 border-b shrink-0"
          style={{
            height: 'var(--topbar-height)',
            borderColor: 'var(--color-border-1)',
            background: 'var(--color-bg-1)',
          }}
          role="banner"
        >
          <div className="flex items-center gap-3">
            {/* Project name - mobile only shows this */}
            <span className="md:hidden font-semibold text-sm" style={{ color: 'var(--color-text-0)' }}>
              SlackBoard
            </span>

            {/* Project start date */}
            <div className="hidden sm:flex items-center gap-1.5 relative">
              <span className="text-2xs uppercase tracking-wider font-semibold" style={{ color: 'var(--color-text-3)' }}>
                Start:
              </span>
              <div className="relative group flex items-center">
                {/* Visual date display */}
                <div
                  className="font-mono text-xs border rounded px-2 py-1 flex items-center gap-1.5 cursor-pointer group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors"
                  style={{
                    background: 'var(--color-bg-2)',
                    borderColor: 'var(--color-border-1)',
                    color: 'var(--color-text-1)',
                  }}
                >
                  <Calendar size={13} strokeWidth={1.5} style={{ color: 'var(--color-text-3)' }} />
                  {new Date(settings.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                {/* Native picker overlay */}
                <input
                  type="date"
                  value={settings.startDate}
                  onChange={(e) => updateSettings({ ...settings, startDate: e.target.value })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Select project start date"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Duration chip */}
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded border"
              style={{
                borderColor: 'var(--color-border-2)',
                background: 'var(--color-bg-2)',
              }}
            >
              <Clock size={13} strokeWidth={1.5} style={{ color: 'var(--color-text-3)' }} />
              <span
                className="font-mono text-2xs font-medium"
                style={{ color: 'var(--color-text-1)', fontFamily: 'var(--font-mono)' }}
              >
                {schedule.projectDuration}d
              </span>
              {endDate && (
                <span className="text-2xs" style={{ color: 'var(--color-text-3)' }}>
                  → {endDate}
                </span>
              )}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center rounded transition-colors duration-100"
              style={{
                width: '32px', height: '32px',
                color: 'var(--color-text-3)',
                background: 'transparent',
                border: '1px solid var(--color-border-1)',
                cursor: 'pointer',
              }}
              aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {resolvedTheme === 'dark' ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
            </button>

            {/* Copilot button */}
            <button
              onClick={() => setCopilotOpen(!copilotOpen)}
              className="flex items-center gap-1.5 rounded px-2 py-1 transition-colors duration-100"
              style={{
                color: copilotOpen ? 'var(--color-accent)' : 'var(--color-text-3)',
                background: copilotOpen ? 'var(--color-accent-muted)' : 'transparent',
                border: `1px solid ${copilotOpen ? 'var(--color-accent)' : 'var(--color-border-1)'}`,
                cursor: 'pointer',
                fontSize: 'var(--text-xs)',
              }}
              aria-label="Toggle AI Copilot"
              title="Ctrl+J"
            >
              <Bot size={16} strokeWidth={1.5} />
              <span className="hidden sm:inline text-xs font-medium">Copilot</span>
            </button>
          </div>
        </header>

        {/* Page content + Copilot drawer */}
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-auto p-4 md:p-5" role="main">
            {children}
          </main>

          {/* Copilot Drawer */}
          {copilotOpen && (
            <CopilotPanel onClose={() => setCopilotOpen(false)} />
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 flex border-t z-50"
        style={{
          background: 'var(--color-bg-1)',
          borderColor: 'var(--color-border-1)',
        }}
        role="navigation"
        aria-label="Mobile navigation"
      >
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className="flex-1 flex flex-col items-center py-2 gap-0.5 no-underline"
            style={({ isActive }) => ({
              color: isActive ? 'var(--color-accent)' : 'var(--color-text-3)',
              fontSize: '10px',
            })}
          >
            <Icon size={18} strokeWidth={1.5} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
