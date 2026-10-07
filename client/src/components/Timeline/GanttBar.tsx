import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Task, ScheduleEntry } from '@slackboard/shared';

interface GanttBarProps {
  task: Task;
  entry: ScheduleEntry;
  dayWidth: number;
  rowHeight: number;
  rowIndex: number;
  isHighlighted: boolean;
  onHover: () => void;
  onLeave: () => void;
  startDate: string;
}

export function GanttBar({
  task,
  entry,
  dayWidth,
  rowHeight,
  rowIndex,
  isHighlighted,
  onHover,
  onLeave,
  startDate,
}: GanttBarProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, bottom: 0, flipY: false, winW: 1000, winH: 1000 });
  const barRef = useRef<HTMLDivElement>(null);

  const barLeft = entry.es * dayWidth;
  const barWidth = Math.max(task.duration * dayWidth - 2, 4);
  const slackWidth = entry.slack * dayWidth;
  const top = rowIndex * rowHeight;
  const barHeight = 20;
  const barTop = top + (rowHeight - barHeight) / 2;

  // Calendar dates for tooltip
  const toDate = (days: number) => {
    const d = new Date(startDate + 'T12:00:00');
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleMouseEnter = () => {
    setShowTooltip(true);
    onHover();
    if (barRef.current) {
      const rect = barRef.current.getBoundingClientRect();
      setPos({
        top: rect.top,
        left: rect.left,
        bottom: rect.bottom,
        flipY: rect.top < 160,
        winW: window.innerWidth,
        winH: window.innerHeight
      });
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
    onLeave();
  };

  return (
    <div
      ref={barRef}
      className="absolute z-10"
      style={{ left: `${barLeft}px`, top: `${barTop}px` }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main bar */}
      <div
        className="rounded-sm transition-opacity duration-100"
        style={{
          width: `${barWidth}px`,
          height: `${barHeight}px`,
          background: entry.isCritical ? 'var(--color-critical)' : 'var(--color-border-2)',
          opacity: isHighlighted ? 1 : 0.85,
          position: 'relative',
        }}
      />

      {/* Slack bar (hatched) */}
      {!entry.isCritical && entry.slack > 0 && (
        <div
          className="absolute top-0 rounded-sm pattern-hatch"
          style={{
            left: `${barWidth}px`,
            width: `${slackWidth}px`,
            height: `${barHeight}px`,
          }}
        />
      )}

      {/* Tooltip */}
      {showTooltip && document.body && createPortal(
        <div
          className="fixed z-[9999] rounded border px-2.5 py-2 pointer-events-none shadow-lg"
          style={{
            ...(pos.flipY ? { top: `${pos.bottom + 6}px` } : { bottom: `${pos.winH - pos.top + 6}px` }),
            left: `${Math.max(10, Math.min(pos.left, pos.winW - 220))}px`,
            background: 'var(--color-bg-2)',
            borderColor: 'var(--color-border-2)',
            whiteSpace: 'nowrap',
            fontSize: '11px',
          }}
        >
          <div className="font-medium mb-1" style={{ color: 'var(--color-text-0)' }}>
            {task.title}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5" style={{ fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: 'var(--color-text-3)' }}>ES</span>
            <span style={{ color: 'var(--color-text-1)' }}>{entry.es} ({toDate(entry.es)})</span>
            <span style={{ color: 'var(--color-text-3)' }}>EF</span>
            <span style={{ color: 'var(--color-text-1)' }}>{entry.ef} ({toDate(entry.ef)})</span>
            <span style={{ color: 'var(--color-text-3)' }}>LS</span>
            <span style={{ color: 'var(--color-text-1)' }}>{entry.ls} ({toDate(entry.ls)})</span>
            <span style={{ color: 'var(--color-text-3)' }}>LF</span>
            <span style={{ color: 'var(--color-text-1)' }}>{entry.lf} ({toDate(entry.lf)})</span>
            <span style={{ color: 'var(--color-text-3)' }}>Slack</span>
            <span style={{ color: entry.isCritical ? 'var(--color-critical)' : 'var(--color-text-1)' }}>
              {entry.slack}d {entry.isCritical && '(critical)'}
            </span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
