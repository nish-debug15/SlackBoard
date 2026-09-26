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

  const barColor = entry.isCritical ? '#ff4d4f' : '#1890ff';
  const slackColor = 'rgba(24, 144, 255, 0.2)';

  return (
    <div style={{ position: 'relative', height: '40px', marginBottom: '10px' }}>
      <div style={{ position: 'absolute', left: 0, top: '10px', width: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {task.title}
      </div>
      
      <div style={{ position: 'absolute', left: `160px`, right: 0, height: '40px' }}>
        {/* Actual Task Bar */}
        <div 
          style={{
            position: 'absolute',
            left: `${left}px`,
            width: `${width}px`,
            height: '24px',
            top: '8px',
            backgroundColor: barColor,
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        />
        
        {/* Slack Bar */}
        {!entry.isCritical && entry.slack > 0 && (
          <div 
            style={{
              position: 'absolute',
              left: `${left + width}px`,
              width: `${slackWidth}px`,
              height: '8px',
              top: '16px',
              backgroundColor: slackColor,
              borderRadius: '2px'
            }}
          />
        )}
      </div>
    </div>
  );
}
