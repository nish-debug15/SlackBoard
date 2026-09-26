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
    padding: '10px',
    margin: '0 0 8px 0',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'grab'
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={() => navigate(`/task/${task.id}`)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>{task.title}</strong>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: 'red' }}
        >
          X
        </button>
      </div>
      <div style={{ fontSize: '0.85em', color: '#666', marginTop: '4px' }}>
        Duration: {task.duration} day(s)
      </div>
    </div>
  );
}
