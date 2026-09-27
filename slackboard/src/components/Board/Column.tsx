import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task } from '../../types';
import { TaskCard } from './TaskCard';

interface ColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  onDeleteTask: (id: string) => void;
}

export function Column({ id, title, tasks, onDeleteTask }: ColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className="column">
      <div className="column-header">
        <div className={`column-dot ${id === 'inprogress' ? 'progress' : id}`} />
        <span>{title} ({tasks.length})</span>
      </div>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onDelete={onDeleteTask} />
        ))}
      </SortableContext>
    </div>
  );
}
