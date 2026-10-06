import { useCallback } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, closestCenter, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { useState } from 'react';
import { useTasks } from '../../context/TasksProvider';
import { Column } from './Column';
import type { ColumnId, Task } from '@slackboard/shared';

const COLUMNS: { id: ColumnId; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'inprogress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
];

export function Board() {
  const { tasks, schedule, moveTask, deleteTask } = useTasks();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Dropping on a column directly
    if (COLUMNS.some(c => c.id === overId)) {
      moveTask(taskId, overId as ColumnId);
      return;
    }

    // Dropping on another task - move to that task's column
    const overTask = tasks.find(t => t.id === overId);
    if (overTask) {
      moveTask(taskId, overTask.column);
    }
  }, [tasks, moveTask]);

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  return (
    <div>
      {tasks.length === 0 && (
        <div className="mb-6 p-6 rounded-lg border border-dashed flex flex-col items-center justify-center text-center" style={{ borderColor: 'var(--color-border-2)', background: 'var(--color-bg-1)' }}>
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-0)' }}>Welcome to your new project!</h2>
          <p className="text-sm mb-4 max-w-md" style={{ color: 'var(--color-text-2)' }}>
            Start by adding some tasks manually, or use the <strong>Copilot</strong> (top right) to automatically generate a schedule with dependencies.
          </p>
          <div className="flex gap-4 text-xs font-medium" style={{ color: 'var(--color-text-3)' }}>
            <span>1. Add tasks</span>
            <span>&rarr;</span>
            <span>2. Map dependencies</span>
            <span>&rarr;</span>
            <span>3. Check Timeline & Dashboard</span>
          </div>
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
          {COLUMNS.map(col => {
            const columnTasks = tasks.filter(t => t.column === col.id);
            const totalDuration = columnTasks.reduce((sum, t) => sum + t.duration, 0);
            return (
              <Column
                key={col.id}
                id={col.id}
                label={col.label}
                tasks={columnTasks}
                totalDuration={totalDuration}
                schedule={schedule}
                onDeleteTask={deleteTask}
                isDragActive={activeId !== null}
              />
            );
          })}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask && (
            <div
              className="rounded px-3 py-2 border"
              style={{
                background: 'var(--color-bg-2)',
                borderColor: 'var(--color-accent)',
                color: 'var(--color-text-0)',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                opacity: 0.9,
                width: '260px',
              }}
            >
              {activeTask.title}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
