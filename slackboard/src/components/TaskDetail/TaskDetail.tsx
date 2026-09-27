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
    <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
      <h2>{isNew ? 'New Task' : 'Edit Task'}</h2>
      {error && <div className="error-text">{error}</div>}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', marginTop: '16px' }}>
        <div className="field">
          <label>Title</label>
          <input 
            type="text" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
          />
        </div>

        <div className="field">
          <label>Duration (days)</label>
          <input 
            type="number" 
            value={duration} 
            onChange={e => setDuration(Number(e.target.value))}
            min={1}
            className="duration"
          />
        </div>

        <div className="field">
          <label>Dependencies</label>
          {otherTasks.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No other tasks to depend on.</div>
          ) : (
            <div style={{ border: '1px solid var(--border)', padding: '10px', borderRadius: 'var(--radius)' }}>
              {otherTasks.map(task => (
                <div key={task.id} style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', fontWeight: 'normal', margin: 0, fontSize: '14px', color: 'var(--text)' }}>
                    <input 
                      type="checkbox"
                      checked={dependsOn.includes(task.id)}
                      onChange={e => handleDependencyChange(task.id, e.target.checked)}
                      style={{ marginRight: '8px', width: 'auto' }}
                    />
                    {task.title}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button type="submit" className="btn-primary">
            Save
          </button>
          <button type="button" className="btn" onClick={() => navigate('/board')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
