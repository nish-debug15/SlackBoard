import { Task, Schedule } from '../../types';
import { GanttBar } from './GanttBar';

interface TimelineProps {
  tasks: Task[];
  schedule: Schedule;
}

const DAY_WIDTH = 50;

export function Timeline({ tasks, schedule }: TimelineProps) {
  if (tasks.length === 0) {
    return <div>No tasks to display in timeline.</div>;
  }

  // Calculate total width needed based on project duration
  const totalDays = schedule.projectDuration;
  const containerWidth = totalDays * DAY_WIDTH + 200; // 200px for labels/padding

  // Create grid lines
  const gridLines = [];
  for (let i = 0; i <= totalDays; i++) {
    gridLines.push(
      <div 
        key={i}
        style={{
          position: 'absolute',
          left: `${160 + i * DAY_WIDTH}px`,
          top: 0,
          bottom: 0,
          width: '1px',
          backgroundColor: '#eee',
          zIndex: 0
        }}
      >
        <span style={{ position: 'absolute', top: '-25px', left: '-5px', fontSize: '12px', color: '#888' }}>
          {i}
        </span>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', padding: '20px 0', border: '1px solid #ddd', borderRadius: '8px', background: 'white' }}>
      <div style={{ position: 'relative', width: `${containerWidth}px`, minHeight: `${tasks.length * 50 + 40}px`, marginTop: '30px' }}>
        {gridLines}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {tasks.map(task => {
            const entry = schedule.entries[task.id];
            if (!entry) return null;
            return <GanttBar key={task.id} task={task} entry={entry} dayWidth={DAY_WIDTH} />;
          })}
        </div>
      </div>
    </div>
  );
}
