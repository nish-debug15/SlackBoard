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
    <div 
      ref={setNodeRef} 
      style={{
        flex: 1,
        backgroundColor: '#f4f5f7',
        padding: '10px',
        borderRadius: '8px',
        minHeight: '200px'
      }}
    >
      <h3>{title} ({tasks.length})</h3>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onDelete={onDeleteTask} />
        ))}
      </SortableContext>
    </div>
  );
}
