import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Task } from '../../types';
import { wouldCreateCycle } from '../../engine/cpm';

interface TaskDetailProps {
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
}

export function TaskDetail({ tasks, addTask, updateTask }: TaskDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState<number>(1);
  const [dependsOn, setDependsOn] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isNew && id) {
      const task = tasks.find(t => t.id === id);
      if (task) {
        setTitle(task.title);
        setDuration(task.duration);
        setDependsOn(task.dependsOn);
      } else {
        navigate('/board'); // Not found
      }
    }
  }, [id, isNew, tasks, navigate]);

  const handleDependencyChange = (depId: string, checked: boolean) => {
    if (checked) {
      // Trying to add a dependency: the current task depends on depId
      // Current task ID is `id` (or temporary if new)
      const currentTaskId = isNew ? 'temp_new_task' : id!;
      
      // We check if this creates a cycle
      if (wouldCreateCycle(tasks, { from: depId, to: currentTaskId })) {
        setError(`Cannot depend on this task, it would create a cyclic dependency.`);
        return;
      }
      
      setError(null);
      setDependsOn(prev => [...prev, depId]);
    } else {
      setError(null);
      setDependsOn(prev => prev.filter(t => t !== depId));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (duration <= 0) {
      setError('Duration must be positive');
      return;
    }

    if (isNew) {
      addTask({
        id: crypto.randomUUID(),
        title: title.trim(),
        duration,
        dependsOn,
        column: 'todo'
      });
    } else {
      const existing = tasks.find(t => t.id === id);
      if (existing) {
        updateTask({
          ...existing,
          title: title.trim(),
          duration,
          dependsOn
        });
      }
    }
    navigate('/board');
  };

  const otherTasks = tasks.filter(t => t.id !== id);

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
      <h2>{isNew ? 'New Task' : 'Edit Task'}</h2>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Title</label>
          <input 
            type="text" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Duration (days)</label>
          <input 
            type="number" 
            value={duration} 
            onChange={e => setDuration(Number(e.target.value))}
            min={1}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Dependencies</label>
          {otherTasks.length === 0 ? (
            <div style={{ color: '#666', fontSize: '0.9em' }}>No other tasks to depend on.</div>
          ) : (
            <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '4px', background: 'white' }}>
              {otherTasks.map(task => (
                <div key={task.id} style={{ marginBottom: '5px' }}>
                  <label>
                    <input 
                      type="checkbox"
                      checked={dependsOn.includes(task.id)}
                      onChange={e => handleDependencyChange(task.id, e.target.checked)}
                      style={{ marginRight: '8px' }}
                    />
                    {task.title}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button type="submit" style={{ padding: '8px 16px', background: '#0052cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Save
          </button>
          <button type="button" onClick={() => navigate('/board')} style={{ padding: '8px 16px', background: '#ccc', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
