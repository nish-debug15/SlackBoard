import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Check, Trash2, Link as LinkIcon, Search, Clock, Activity } from 'lucide-react';
import { useTasks } from '../../context/TasksProvider';
import { computeSchedule, wouldCreateCycle } from '@slackboard/shared';
import type { Task, ColumnId } from '@slackboard/shared';

const COLUMNS: { id: ColumnId; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'inprogress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
];

export function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tasks, schedule, addTask, updateTask, deleteTask } = useTasks();
  const isNew = !id || id === 'new';

  const existingTask = !isNew ? tasks.find(t => t.id === id) : null;

  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(1);
  const [column, setColumn] = useState<ColumnId>('todo');
  const [dependsOn, setDependsOn] = useState<string[]>([]);
  const [depSearch, setDepSearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load existing task data
  useEffect(() => {
    if (existingTask) {
      setTitle(existingTask.title);
      setDuration(existingTask.duration);
      setColumn(existingTask.column);
      setDependsOn([...existingTask.dependsOn]);
    } else if (!isNew && id) {
      navigate('/board');
    }
  }, [existingTask, isNew, id, navigate]);

  // Available dependency candidates
  const candidates = useMemo(() => {
    const currentId = isNew ? '__new__' : id!;
    return tasks
      .filter(t => t.id !== currentId)
      .map(t => {
        const cyclePath = !isNew
          ? wouldCreateCycle(tasks, t.id, currentId)
          : null; // New tasks can't create cycles since nothing depends on them yet
        return {
          task: t,
          selected: dependsOn.includes(t.id),
          wouldCycle: cyclePath,
          reason: cyclePath ? `Would create cycle: ${cyclePath.join(' \u2192 ')}` : null,
        };
      });
  }, [tasks, dependsOn, id, isNew]);

  const filteredCandidates = useMemo(() => {
    if (!depSearch.trim()) return candidates;
    const q = depSearch.toLowerCase();
    return candidates.filter(c => c.task.title.toLowerCase().includes(q));
  }, [candidates, depSearch]);

  // Live preview: compute schedule with current edits
  const preview = useMemo(() => {
    if (isNew) {
      const tempTask: Task = {
        id: '__preview__',
        title: title || 'New Task',
        duration,
        dependsOn,
        column,
      };
      const previewSchedule = computeSchedule([...tasks, tempTask]);
      return previewSchedule.entries['__preview__'] ?? null;
    } else if (id) {
      const modified = tasks.map(t =>
        t.id === id ? { ...t, title, duration, dependsOn, column } : t
      );
      const previewSchedule = computeSchedule(modified);
      return previewSchedule.entries[id] ?? null;
    }
    return null;
  }, [tasks, id, isNew, title, duration, dependsOn, column]);

  const toggleDep = (depId: string) => {
    if (dependsOn.includes(depId)) {
      setDependsOn(prev => prev.filter(d => d !== depId));
    } else {
      setDependsOn(prev => [...prev, depId]);
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (title.length > 200) errs.title = 'Title must be under 200 characters';
    if (duration < 1) errs.duration = 'Duration must be at least 1 day';
    if (duration > 365) errs.duration = 'Duration must be under 365 days';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setErrors(prev => ({ ...prev, submit: '' }));

    if (isNew) {
      const result = await addTask({ title: title.trim(), duration, dependsOn, column });
      if (result.success) {
        navigate('/board');
      } else {
        let msg = result.error;
        if (result.cycle) msg += ` (Creates a cycle: ${result.cycle.join(' -> ')})`;
        setErrors(prev => ({ ...prev, submit: msg }));
      }
    } else {
      const result = await updateTask({ id: id!, title: title.trim(), duration, dependsOn, column });
      if (result.success) {
        navigate('/board');
      } else {
        let msg = result.error;
        if (result.cycle) msg += ` (Creates a cycle: ${result.cycle.join(' -> ')})`;
        setErrors(prev => ({ ...prev, submit: msg }));
      }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteTask(id);
    navigate('/board');
  };

  // Dependents (tasks that depend on this task)
  const dependents = !isNew ? tasks.filter(t => t.dependsOn.includes(id!)) : [];

  return (
    <div className="max-w-[560px] mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 mb-4 text-xs font-medium"
        style={{
          color: 'var(--color-text-3)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <ArrowLeft size={14} strokeWidth={1.5} />
        Back
      </button>

      <div
        className="rounded-lg border"
        style={{ background: 'var(--color-bg-1)', borderColor: 'var(--color-border-1)' }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-border-0)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-0)' }}>
            {isNew ? 'New Task' : 'Edit Task'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {errors.submit && (
            <div className="p-3 rounded text-sm font-medium" style={{ color: 'var(--color-error)', background: 'var(--color-error-bg)', border: '1px solid var(--color-error)' }}>
              {errors.submit}
            </div>
          )}
          {/* Title */}
          <div>
            <label className="block text-2xs font-medium mb-1" style={{ color: 'var(--color-text-3)' }}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => { setTitle(e.target.value); setErrors(prev => ({ ...prev, title: '' })); }}
              placeholder="Task title"
              className="w-full rounded px-3 py-2 text-sm"
              style={{
                background: 'var(--color-bg-2)',
                color: 'var(--color-text-0)',
                border: `1px solid ${errors.title ? 'var(--color-error)' : 'var(--color-border-1)'}`,
              }}
              autoFocus
            />
            {errors.title && (
              <p className="text-2xs mt-1" style={{ color: 'var(--color-error)' }}>{errors.title}</p>
            )}
          </div>

          {/* Duration + Column row */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-2xs font-medium mb-1" style={{ color: 'var(--color-text-3)' }}>
                Duration (days)
              </label>
              <input
                type="number"
                value={duration}
                onChange={e => { setDuration(Math.max(1, parseInt(e.target.value) || 1)); setErrors(prev => ({ ...prev, duration: '' })); }}
                min={1}
                max={365}
                className="w-full rounded px-3 py-2 text-sm font-mono"
                style={{
                  background: 'var(--color-bg-2)',
                  color: 'var(--color-text-0)',
                  border: `1px solid ${errors.duration ? 'var(--color-error)' : 'var(--color-border-1)'}`,
                  fontFamily: 'var(--font-mono)',
                }}
              />
              {errors.duration && (
                <p className="text-2xs mt-1" style={{ color: 'var(--color-error)' }}>{errors.duration}</p>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-2xs font-medium mb-1" style={{ color: 'var(--color-text-3)' }}>
                Status
              </label>
              <select
                value={column}
                onChange={e => setColumn(e.target.value as ColumnId)}
                className="w-full rounded px-3 py-2 text-sm"
                style={{
                  background: 'var(--color-bg-2)',
                  color: 'var(--color-text-0)',
                  border: '1px solid var(--color-border-1)',
                }}
              >
                {COLUMNS.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dependencies */}
          <div>
            <label className="block text-2xs font-medium mb-1" style={{ color: 'var(--color-text-3)' }}>
              Dependencies ({dependsOn.length})
            </label>

            {/* Search */}
            <div className="relative mb-2">
              <Search
                size={14}
                strokeWidth={1.5}
                className="absolute left-2.5 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-text-4)' }}
              />
              <input
                type="text"
                value={depSearch}
                onChange={e => setDepSearch(e.target.value)}
                placeholder="Search tasks..."
                className="w-full rounded pl-8 pr-3 py-1.5 text-xs"
                style={{
                  background: 'var(--color-bg-2)',
                  color: 'var(--color-text-0)',
                  border: '1px solid var(--color-border-1)',
                }}
              />
            </div>

            <div
              className="rounded border max-h-[200px] overflow-y-auto"
              style={{
                borderColor: 'var(--color-border-1)',
                background: 'var(--color-bg-2)',
              }}
            >
              {filteredCandidates.length === 0 ? (
                <p className="text-xs p-3" style={{ color: 'var(--color-text-4)' }}>
                  {tasks.length <= 1 ? 'No other tasks to depend on.' : 'No matching tasks.'}
                </p>
              ) : (
                filteredCandidates.map(({ task: t, selected, wouldCycle, reason }) => (
                  <label
                    key={t.id}
                    className={`flex items-center gap-2 px-3 py-2 border-b last:border-b-0 transition-colors duration-100 ${
                      wouldCycle && !selected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    style={{
                      borderColor: 'var(--color-border-0)',
                      background: selected ? 'var(--color-accent-muted)' : 'transparent',
                    }}
                    title={reason || undefined}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => !wouldCycle && toggleDep(t.id)}
                      disabled={!!wouldCycle && !selected}
                      className="accent-blue-500"
                      style={{ width: '14px', height: '14px' }}
                    />
                    <span className="flex-1 text-xs" style={{ color: 'var(--color-text-1)' }}>
                      {t.title}
                    </span>
                    <span
                      className="font-mono text-2xs"
                      style={{ color: 'var(--color-text-4)', fontFamily: 'var(--font-mono)' }}
                    >
                      {t.duration}d
                    </span>
                    {wouldCycle && !selected && (
                      <AlertTriangle size={12} strokeWidth={1.5} style={{ color: 'var(--color-critical)', flexShrink: 0 }} />
                    )}
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Live Preview Panel */}
          {preview && (
            <div
              className="rounded border p-3"
              style={{
                borderColor: preview.isCritical ? 'var(--color-critical-border)' : 'var(--color-border-1)',
                background: preview.isCritical ? 'var(--color-critical-bg)' : 'var(--color-bg-2)',
              }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Activity size={12} strokeWidth={1.5} style={{ color: 'var(--color-text-3)' }} />
                <span className="text-2xs font-semibold" style={{ color: 'var(--color-text-2)' }}>
                  SCHEDULE PREVIEW
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {(['es', 'ef', 'ls', 'lf', 'slack'] as const).map(field => (
                  <div key={field} className="text-center">
                    <div
                      className="font-mono text-sm font-medium"
                      style={{ color: 'var(--color-text-0)', fontFamily: 'var(--font-mono)' }}
                    >
                      {preview[field]}
                    </div>
                    <div className="text-2xs uppercase" style={{ color: 'var(--color-text-4)', fontSize: '10px' }}>
                      {field}
                    </div>
                  </div>
                ))}
              </div>
              {preview.isCritical && (
                <div className="flex items-center gap-1 mt-2 text-2xs font-medium" style={{ color: 'var(--color-critical-text)' }}>
                  <AlertTriangle size={12} strokeWidth={1.5} />
                  Critical path task
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded text-xs font-medium"
              style={{
                background: 'var(--color-accent)',
                color: '#fff',
                border: 'none',
                cursor: saving ? 'wait' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              <Check size={14} strokeWidth={2} />
              {isNew ? 'Create Task' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded text-xs font-medium"
              style={{
                color: 'var(--color-text-2)',
                background: 'transparent',
                border: '1px solid var(--color-border-1)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Danger zone - delete */}
        {!isNew && (
          <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--color-border-0)' }}>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 text-xs font-medium"
                style={{
                  color: 'var(--color-error)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <Trash2 size={14} strokeWidth={1.5} />
                Delete task
              </button>
            ) : (
              <div
                className="rounded border p-3"
                style={{
                  borderColor: 'var(--color-error)',
                  background: 'var(--color-error-bg)',
                }}
              >
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-error)' }}>
                  Delete "{existingTask?.title}"?
                </p>
                {dependents.length > 0 && (
                  <p className="text-2xs mb-2" style={{ color: 'var(--color-text-2)' }}>
                    Dependencies will be removed from: {dependents.map(d => d.title).join(', ')}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1.5 rounded text-2xs font-medium"
                    style={{ color: '#fff', background: 'var(--color-error)', border: 'none', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 rounded text-2xs"
                    style={{ color: 'var(--color-text-2)', background: 'var(--color-bg-3)', border: 'none', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
