import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useTasks } from './hooks/useTasks';
import { Board } from './components/Board/Board';
import { TaskDetail } from './components/TaskDetail/TaskDetail';
import { Timeline } from './components/Timeline/Timeline';
import { Dashboard } from './components/Dashboard/Dashboard';

function NavBar() {
  return (
    <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <Link to="/board" style={{ padding: '8px' }}>Board</Link>
      <Link to="/timeline" style={{ padding: '8px' }}>Timeline</Link>
      <Link to="/dashboard" style={{ padding: '8px' }}>Dashboard</Link>
      <Link to="/task/new" style={{ padding: '8px' }}>New Task</Link>
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
