import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeProvider';
import { TasksProvider } from './context/TasksProvider';
import { AuthProvider } from './context/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { BoardPage } from './pages/BoardPage';
import { TaskPage } from './pages/TaskPage';
import { TimelinePage } from './pages/TimelinePage';
import { DashboardPage } from './pages/DashboardPage';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <TasksProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Navigate to="/board" replace />} />
                <Route path="/board" element={<BoardPage />} />
                <Route path="/task/new" element={<TaskPage />} />
                <Route path="/task/:id" element={<TaskPage />} />
                <Route path="/timeline" element={<TimelinePage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
              </Route>
            </Routes>
          </TasksProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
