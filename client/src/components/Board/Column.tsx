import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Task, Schedule, ColumnId } from '@slackboard/shared';
import { TaskCard } from './TaskCard';

interface ColumnProps {
  id: ColumnId;
  label: string;
  tasks: Task[];
  totalDuration: number;
  schedule: Schedule;
  onDeleteTask: (id: string) => Promise<{ cascadedDependents: Array<{ id: string; title: string }> } | null>;
  isDragActive: boolean;
}

const STATUS_COLORS: Record<ColumnId, string> = {
  todo: 'var(--color-status-todo)',
  inprogress: 'var(--color-status-inprogress)',
  done: 'var(--color-status-done)',
};

export function Column({ id, label, tasks, totalDuration, schedule, onDeleteTask, isDragActive }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const navigate = useNavigate();

  return (
    <div
      ref={setNodeRef}
      className="flex-1 min-w-[280px] rounded-lg border transition-colors duration-100"
      style={{
        background: isOver ? 'var(--color-bg-2)' : 'var(--color-bg-1)',
        borderColor: isOver ? 'var(--color-accent)' : 'var(--color-border-1)',
        borderStyle: isDragActive && isOver ? 'dashed' : 'solid',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: 'var(--color-border-0)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="rounded-full"
            style={{
              width: '8px', height: '8px',
              background: STATUS_COLORS[id],
            }}
          />
          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-2)' }}>
            {label}
          </span>
          <span
            className="text-2xs font-mono px-1.5 py-0.5 rounded"
            style={{
              color: 'var(--color-text-3)',
              background: 'var(--color-bg-3)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-2xs font-mono"
            style={{ color: 'var(--color-text-4)', fontFamily: 'var(--font-mono)' }}
          >
            {totalDuration}d
          </span>
          <button
            onClick={() => navigate('/task/new')}
            className="flex items-center justify-center rounded"
            style={{
              width: '24px', height: '24px',
              color: 'var(--color-text-3)',
              background: 'transparent',
              border: '1px solid var(--color-border-1)',
              cursor: 'pointer',
              borderRadius: 'var(--radius-sm)',
            }}
            aria-label="Add task"
          >
            <Plus size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Task list */}
      <div className="p-2 space-y-1.5 min-h-[100px]">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-8 rounded"
              style={{ color: 'var(--color-text-4)' }}
            >
              <p className="text-xs">No tasks</p>
              <button
                onClick={() => navigate('/task/new')}
                className="text-xs mt-2 flex items-center gap-1"
                style={{
                  color: 'var(--color-accent)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Plus size={12} strokeWidth={1.5} /> Add one
              </button>
            </div>
          ) : (
            tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                schedule={schedule}
                onDelete={onDeleteTask}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
