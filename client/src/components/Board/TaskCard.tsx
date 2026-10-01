import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Link as LinkIcon, Trash2 } from 'lucide-react';
import type { Task, Schedule } from '@slackboard/shared';

interface TaskCardProps {
  task: Task;
  schedule: Schedule;
  onDelete: (id: string) => Promise<{ cascadedDependents: Array<{ id: string; title: string }> } | null>;
}

export function TaskCard({ task, schedule, onDelete }: TaskCardProps) {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const entry = schedule.entries[task.id];
  const isCritical = entry?.isCritical ?? false;
  const slack = entry?.slack ?? 0;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if we just finished dragging
    if (isDragging) return;
    // Don't navigate if clicking delete button area
    if ((e.target as HTMLElement).closest('[data-action]')) return;
    navigate(`/task/${task.id}`);
  };

  const handleDelete = async () => {
    // Check if other tasks depend on this one
    setShowConfirm(false);
    await onDelete(task.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className="group rounded border cursor-grab active:cursor-grabbing transition-colors duration-100"
      tabIndex={0}
      role="button"
      aria-label={`Task: ${task.title}`}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/task/${task.id}`); }}
      data-critical={isCritical}
    >
      <div
        className="px-3 py-2"
        style={{
          background: 'var(--color-bg-1)',
          borderColor: isCritical ? 'var(--color-critical-border)' : 'var(--color-border-1)',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <span
            className="text-xs font-medium leading-tight"
            style={{ color: 'var(--color-text-0)' }}
          >
            {task.title}
          </span>
          <button
            data-action="delete"
            onClick={(e) => {
              e.stopPropagation();
              setShowConfirm(true);
            }}
            className="opacity-0 group-hover:opacity-100 flex items-center justify-center rounded transition-opacity duration-100"
            style={{
              width: '20px', height: '20px',
              color: 'var(--color-text-4)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            aria-label={`Delete ${task.title}`}
          >
            <Trash2 size={12} strokeWidth={1.5} />
          </button>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className="font-mono text-2xs px-1 py-0.5 rounded"
            style={{
              background: 'var(--color-bg-3)',
              color: 'var(--color-text-2)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {task.duration}d
          </span>

          {task.dependsOn.length > 0 && (
            <span
              className="flex items-center gap-0.5 text-2xs"
              style={{ color: 'var(--color-text-4)' }}
            >
              <LinkIcon size={10} strokeWidth={1.5} />
              {task.dependsOn.length}
            </span>
          )}

          {isCritical && (
            <span
              className="flex items-center gap-0.5 text-2xs font-medium px-1 py-0.5 rounded"
              style={{
                color: 'var(--color-critical-text)',
                background: 'var(--color-critical-bg)',
              }}
            >
              <AlertTriangle size={10} strokeWidth={1.5} />
              Critical
            </span>
          )}

          {!isCritical && slack > 0 && (
            <span
              className="font-mono text-2xs"
              style={{ color: 'var(--color-text-4)', fontFamily: 'var(--font-mono)' }}
            >
              +{slack}d
            </span>
          )}
        </div>
      </div>

      {/* Delete confirmation overlay */}
      {showConfirm && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded gap-2 z-10"
          style={{
            background: 'var(--color-bg-2)',
            border: '1px solid var(--color-error)',
            borderRadius: 'var(--radius-sm)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-2xs" style={{ color: 'var(--color-text-1)' }}>Delete?</span>
          <button
            onClick={handleDelete}
            className="text-2xs px-2 py-0.5 rounded font-medium"
            style={{
              color: '#fff',
              background: 'var(--color-error)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Yes
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="text-2xs px-2 py-0.5 rounded"
            style={{
              color: 'var(--color-text-2)',
              background: 'var(--color-bg-3)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            No
          </button>
        </div>
      )}
    </div>
  );
}
