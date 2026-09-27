import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { useTasks } from './hooks/useTasks';
import { Board } from './components/Board/Board';
import { TaskDetail } from './components/TaskDetail/TaskDetail';
import { Timeline } from './components/Timeline/Timeline';
import { Dashboard } from './components/Dashboard/Dashboard';

function NavBar() {
  return (
    <nav className="nav">
      <NavLink to="/board" className={({ isActive }) => (isActive ? 'active' : '')}>Board</NavLink>
      <NavLink to="/timeline" className={({ isActive }) => (isActive ? 'active' : '')}>Timeline</NavLink>
      <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>Dashboard</NavLink>
      <NavLink to="/task/new" className={({ isActive }) => (isActive ? 'active' : '')}>New Task</NavLink>
    </nav>
  );
}

function App() {
  const { tasks, schedule, addTask, updateTask, deleteTask, moveTask } = useTasks();

  return (
    <BrowserRouter>
      <div>
        <NavBar />
        <div style={{ padding: '1rem' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/board" replace />} />
            <Route path="/board" element={<Board tasks={tasks} moveTask={moveTask} deleteTask={deleteTask} />} />
            <Route path="/task/:id" element={<TaskDetail tasks={tasks} addTask={addTask} updateTask={updateTask} />} />
            <Route path="/timeline" element={<Timeline tasks={tasks} schedule={schedule} />} />
            <Route path="/dashboard" element={<Dashboard tasks={tasks} schedule={schedule} />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
