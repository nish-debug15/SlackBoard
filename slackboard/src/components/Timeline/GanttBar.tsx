import { Task, ScheduleEntry } from '../../types';

interface GanttBarProps {
  task: Task;
  entry: ScheduleEntry;
  dayWidth: number;
}

export function GanttBar({ task, entry, dayWidth }: GanttBarProps) {
  const left = entry.es * dayWidth;
  const width = task.duration * dayWidth;
  const slackWidth = entry.slack * dayWidth;

  return (
    <div className="timeline-row">
      <div className="timeline-label">
        {task.title}
      </div>
      
      <div className="timeline-track">
        {/* Actual Task Bar */}
        <div 
          className={`gantt-bar ${entry.isCritical ? 'critical' : ''}`}
          style={{
            left: `${left}px`,
            width: `${width}px`,
            top: 0
          }}
        />
        
        {/* Slack Bar */}
        {!entry.isCritical && entry.slack > 0 && (
          <div 
            className="gantt-bar-slack"
            style={{
              left: `${left + width}px`,
              width: `${slackWidth}px`,
              top: 0
            }}
          />
        )}
      </div>
    </div>
  );
}
