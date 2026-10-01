import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeProvider';
import { TasksProvider } from './context/TasksProvider';
import { AppShell } from './components/AppShell';
import { BoardPage } from './pages/BoardPage';
import { TaskPage } from './pages/TaskPage';
import { TimelinePage } from './pages/TimelinePage';
import { DashboardPage } from './pages/DashboardPage';

export default function App() {
  return (
    <ThemeProvider>
      <TasksProvider>
        <BrowserRouter>
          <AppShell>
            <Routes>
              <Route path="/" element={<Navigate to="/board" replace />} />
              <Route path="/board" element={<BoardPage />} />
              <Route path="/task/new" element={<TaskPage />} />
              <Route path="/task/:id" element={<TaskPage />} />
              <Route path="/timeline" element={<TimelinePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </TasksProvider>
    </ThemeProvider>
  );
}
