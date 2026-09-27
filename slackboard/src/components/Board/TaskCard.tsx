import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../../types';
import { useNavigate } from 'react-router-dom';

interface TaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
}

export function TaskCard({ task, onDelete }: TaskCardProps) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="card task-card" {...attributes} {...listeners} onClick={() => navigate(`/task/${task.id}`)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="task-card-title">{task.title}</div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: 0 }}
        >
          ✕
        </button>
      </div>
      <div className="task-card-meta">
        <span className="task-id">#{task.id.slice(0, 4)}</span>
        <span className="duration">{task.duration}d</span>
      </div>
    </div>
  );
}
