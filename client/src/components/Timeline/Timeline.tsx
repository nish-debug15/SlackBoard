import { useState, useMemo, useRef } from 'react';
import { Filter, AlertTriangle, GanttChart } from 'lucide-react';
import { useTasks } from '../../context/TasksProvider';
import { topoSort } from '@slackboard/shared';
import { GanttBar } from './GanttBar';

const DAY_WIDTH = 44;
const ROW_HEIGHT = 36;
const LABEL_WIDTH = 180;
const HEADER_HEIGHT = 40;

export function Timeline() {
  const { tasks, schedule, settings } = useTasks();
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sort tasks in topo order for display
  const sortedTasks = useMemo(() => {
    const result = topoSort(tasks);
    if (!Array.isArray(result)) return tasks;
    const orderMap = new Map(result.map((id, i) => [id, i]));
    return [...tasks].sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
  }, [tasks]);

  const displayTasks = criticalOnly
    ? sortedTasks.filter(t => schedule.entries[t.id]?.isCritical)
    : sortedTasks;

  const totalDays = schedule.projectDuration;
  const chartWidth = totalDays * DAY_WIDTH;
  const chartHeight = displayTasks.length * ROW_HEIGHT;

  // Get upstream/downstream chain for highlighting
  const getChain = (taskId: string): Set<string> => {
    const chain = new Set<string>();
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    
    // Upstream
    const upQueue = [taskId];
    while (upQueue.length) {
      const id = upQueue.shift()!;
      const task = taskMap.get(id);
      if (task) {
        for (const dep of task.dependsOn) {
          if (!chain.has(dep)) {
            chain.add(dep);
            upQueue.push(dep);
          }
        }
      }
    }

    // Downstream
    const downQueue = [taskId];
    while (downQueue.length) {
      const id = downQueue.shift()!;
      for (const t of tasks) {
        if (t.dependsOn.includes(id) && !chain.has(t.id)) {
          chain.add(t.id);
          downQueue.push(t.id);
        }
      }
    }

    chain.add(taskId);
    return chain;
  };

  const highlightedChain = hoveredTaskId ? getChain(hoveredTaskId) : null;

  // Generate calendar dates for header
  const headerDates = useMemo(() => {
    const dates: string[] = [];
    const start = new Date(settings.startDate + 'T12:00:00');
    for (let i = 0; i <= totalDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return dates;
  }, [settings.startDate, totalDays]);

  // Build row index map for connectors
  const rowIndex = new Map(displayTasks.map((t, i) => [t.id, i]));

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16" style={{ color: 'var(--color-text-4)' }}>
        <GanttChart size={40} strokeWidth={1} className="mb-3" />
        <p className="text-sm">No tasks to display.</p>
        <p className="text-xs mt-1">Create tasks to see the timeline.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-0)' }}>
          Timeline
        </h2>
        <button
          onClick={() => setCriticalOnly(!criticalOnly)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium"
          style={{
            color: criticalOnly ? 'var(--color-critical-text)' : 'var(--color-text-3)',
            background: criticalOnly ? 'var(--color-critical-bg)' : 'transparent',
            border: `1px solid ${criticalOnly ? 'var(--color-critical-border)' : 'var(--color-border-1)'}`,
            cursor: 'pointer',
          }}
        >
          <AlertTriangle size={13} strokeWidth={1.5} />
          Critical only
        </button>
      </div>

      {/* Chart */}
      <div
        ref={scrollRef}
        className="rounded-lg border overflow-x-auto overflow-y-auto"
        style={{
          background: 'var(--color-bg-1)',
          borderColor: 'var(--color-border-1)',
          maxHeight: '80vh',
        }}
      >
        <div style={{ display: 'flex', minWidth: `${LABEL_WIDTH + chartWidth + 40}px` }}>
          {/* Sticky label column */}
          <div
            className="shrink-0 sticky left-0 z-20"
            style={{
              width: `${LABEL_WIDTH}px`,
              background: 'var(--color-bg-1)',
              borderRight: '1px solid var(--color-border-1)',
            }}
          >
            {/* Header spacer */}
            <div
              className="border-b flex items-end px-3 pb-1"
              style={{ height: `${HEADER_HEIGHT}px`, borderColor: 'var(--color-border-0)' }}
            >
              <span className="text-2xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-3)' }}>
                Task
              </span>
            </div>
            {/* Task labels */}
            {displayTasks.map(task => {
              const entry = schedule.entries[task.id];
              const isHighlighted = highlightedChain?.has(task.id);
              return (
                <div
                  key={task.id}
                  className="flex items-center px-3 border-b transition-colors duration-100"
                  style={{
                    height: `${ROW_HEIGHT}px`,
                    borderColor: 'var(--color-border-0)',
                    background: isHighlighted ? 'var(--color-accent-muted)' : 'transparent',
                  }}
                  onMouseEnter={() => setHoveredTaskId(task.id)}
                  onMouseLeave={() => setHoveredTaskId(null)}
                >
                  <span
                    className="text-xs truncate flex-1 pr-2"
                    style={{ color: 'var(--color-text-1)' }}
                  >
                    {task.title}
                  </span>
                  {entry?.isCritical && (
                    <span title="Critical task" className="shrink-0 ml-1 inline-flex items-center">
                      <AlertTriangle
                        size={11}
                        strokeWidth={1.5}
                        style={{ color: 'var(--color-critical)' }}
                      />
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Chart area */}
          <div className="flex-1 relative" style={{ minWidth: `${chartWidth + 40}px` }}>
            {/* Day headers */}
            <div
              className="flex border-b sticky top-0 z-10"
              style={{
                height: `${HEADER_HEIGHT}px`,
                borderColor: 'var(--color-border-0)',
                background: 'var(--color-bg-1)',
              }}
            >
              {headerDates.map((date, i) => (
                <div
                  key={i}
                  className="shrink-0 flex items-end justify-center pb-1"
                  style={{
                    width: `${DAY_WIDTH}px`,
                    fontSize: '10px',
                    color: 'var(--color-text-4)',
                    fontFamily: 'var(--font-mono)',
                    borderRight: '1px solid var(--color-border-0)',
                  }}
                >
                  {i % 2 === 0 ? date : ''}
                </div>
              ))}
            </div>

            {/* Grid lines + bars */}
            <div className="relative" style={{ height: `${chartHeight}px` }}>
              {/* Vertical grid lines */}
              {Array.from({ length: totalDays + 1 }, (_, i) => (
                <div
                  key={`grid-${i}`}
                  className="absolute top-0 bottom-0"
                  style={{
                    left: `${i * DAY_WIDTH}px`,
                    width: '1px',
                    background: 'var(--color-border-0)',
                  }}
                />
              ))}

              {/* Project end marker */}
              <div
                className="absolute top-0 bottom-0 z-10"
                style={{
                  left: `${totalDays * DAY_WIDTH}px`,
                  width: '2px',
                  background: 'var(--color-critical)',
                  opacity: 0.6,
                }}
              />

              {/* SVG connectors */}
              <svg
                className="absolute inset-0 z-5 pointer-events-none"
                width="100%"
                height={chartHeight}
                style={{ overflow: 'visible' }}
              >
                {displayTasks.map(task => {
                  const fromEntry = schedule.entries[task.id];
                  if (!fromEntry) return null;

                  return task.dependsOn.map(depId => {
                    const toRow = rowIndex.get(depId);
                    const fromRow = rowIndex.get(task.id);
                    const depEntry = schedule.entries[depId];
                    if (toRow === undefined || fromRow === undefined || !depEntry) return null;

                    const startX = depEntry.ef * DAY_WIDTH;
                    const startY = toRow * ROW_HEIGHT + ROW_HEIGHT / 2;
                    const endX = fromEntry.es * DAY_WIDTH;
                    const endY = fromRow * ROW_HEIGHT + ROW_HEIGHT / 2;
                    const midX = (startX + endX) / 2;

                    const isBothCritical = depEntry.isCritical && fromEntry.isCritical;
                    const isPartInChain = highlightedChain ? (highlightedChain.has(task.id) && highlightedChain.has(depId)) : false;
                    
                    // Show connectors only for critical path, or when hovering their chain
                    if (!isBothCritical && !isPartInChain) return null;

                    return (
                      <path
                        key={`${depId}-${task.id}`}
                        d={`M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`}
                        fill="none"
                        stroke={isPartInChain || isBothCritical ? 'var(--color-critical)' : 'var(--color-border-2)'}
                        strokeWidth={isPartInChain || isBothCritical ? 1.5 : 1}
                        strokeDasharray={isBothCritical && !isPartInChain ? 'none' : 'none'} // Solid if shown
                        opacity={isPartInChain ? 1 : 0.6}
                      />
                    );
                  });
                })}
              </svg>

              {/* Task bars */}
              {displayTasks.map((task, i) => {
                const entry = schedule.entries[task.id];
                if (!entry) return null;
                const isHighlighted = highlightedChain?.has(task.id);
                return (
                  <GanttBar
                    key={task.id}
                    task={task}
                    entry={entry}
                    dayWidth={DAY_WIDTH}
                    rowHeight={ROW_HEIGHT}
                    rowIndex={i}
                    isHighlighted={isHighlighted ?? false}
                    onHover={() => setHoveredTaskId(task.id)}
                    onLeave={() => setHoveredTaskId(null)}
                    startDate={settings.startDate}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
