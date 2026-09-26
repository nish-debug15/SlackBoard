import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { Task } from '../../types';
import { Column } from './Column';

interface BoardProps {
  tasks: Task[];
  moveTask: (id: string, newColumn: 'todo' | 'inprogress' | 'done') => void;
  deleteTask: (id: string) => void;
}

export function Board({ tasks, moveTask, deleteTask }: BoardProps) {
  const columns = {
    todo: { title: 'To Do', tasks: tasks.filter(t => t.column === 'todo') },
    inprogress: { title: 'In Progress', tasks: tasks.filter(t => t.column === 'inprogress') },
    done: { title: 'Done', tasks: tasks.filter(t => t.column === 'done') }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if dropping directly on a column
    if (Object.keys(columns).includes(overId)) {
      moveTask(taskId, overId as 'todo' | 'inprogress' | 'done');
      return;
    }

    // Check if dropping on another task
    const overTask = tasks.find(t => t.id === overId);
    if (overTask) {
      moveTask(taskId, overTask.column);
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}
      >
        <Column id="todo" title={columns.todo.title} tasks={columns.todo.tasks} onDeleteTask={deleteTask} />
        <Column id="inprogress" title={columns.inprogress.title} tasks={columns.inprogress.tasks} onDeleteTask={deleteTask} />
        <Column id="done" title={columns.done.title} tasks={columns.done.tasks} onDeleteTask={deleteTask} />
      </div>
    </DndContext>
  );
}
