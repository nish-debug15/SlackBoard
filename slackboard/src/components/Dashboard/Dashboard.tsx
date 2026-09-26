import React from 'react';
import { Task, Schedule } from '../../types';

interface DashboardProps {
  tasks: Task[];
  schedule: Schedule;
}

interface DashboardState {
  showUpdateBanner: boolean;
}

export class Dashboard extends React.Component<DashboardProps, DashboardState> {
  private bannerTimeout: number | null = null;

  constructor(props: DashboardProps) {
    super(props);
    this.state = {
      showUpdateBanner: false
    };
  }

  componentDidUpdate(prevProps: DashboardProps) {
    if (prevProps.schedule.projectDuration !== this.props.schedule.projectDuration) {
      this.setState({ showUpdateBanner: true });
      if (this.bannerTimeout) {
        clearTimeout(this.bannerTimeout);
      }
      this.bannerTimeout = window.setTimeout(() => {
        this.setState({ showUpdateBanner: false });
      }, 3000);
    }
  }

  componentWillUnmount() {
    if (this.bannerTimeout) {
      clearTimeout(this.bannerTimeout);
    }
  }

  render() {
    const { tasks, schedule } = this.props;
    const { showUpdateBanner } = this.state;

    const criticalTasks = tasks.filter(t => schedule.entries[t.id]?.isCritical);
    
    // Find non-critical task with longest slack
    let longestSlackTask: Task | null = null;
    let maxSlack = -1;

    tasks.forEach(task => {
      const entry = schedule.entries[task.id];
      if (entry && !entry.isCritical && entry.slack > maxSlack) {
        maxSlack = entry.slack;
        longestSlackTask = task;
      }
    });

    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
        <h2>Dashboard</h2>
        
        {showUpdateBanner && (
          <div style={{ background: '#e6f7ff', border: '1px solid #91d5ff', padding: '10px', marginBottom: '20px', borderRadius: '4px', color: '#096dd9' }}>
            Schedule updated: Project duration changed!
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{schedule.projectDuration}</div>
            <div>Total Project Duration (days)</div>
          </div>
          
          <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{tasks.length}</div>
            <div>Total Tasks</div>
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h3>Critical Path Tasks ({criticalTasks.length})</h3>
          {criticalTasks.length > 0 ? (
            <ul style={{ background: '#fff1f0', padding: '20px 40px', borderRadius: '8px', border: '1px solid #ffa39e' }}>
              {criticalTasks.map(t => (
                <li key={t.id} style={{ color: '#cf1322', fontWeight: 'bold' }}>
                  {t.title} ({t.duration} days)
                </li>
              ))}
            </ul>
          ) : (
            <p>No critical tasks identified.</p>
          )}
        </div>

        <div>
          <h3>"What-If" Analysis</h3>
          {longestSlackTask ? (
            <div style={{ background: '#f6ffed', padding: '20px', borderRadius: '8px', border: '1px solid #b7eb8f' }}>
              Task <strong>{(longestSlackTask as Task).title}</strong> has the most slack. 
              It could slip by up to <strong>{maxSlack} days</strong> risk-free without delaying the total project end date.
            </div>
          ) : (
            <div style={{ background: '#fafafa', padding: '20px', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
              All tasks are critical. Any delay to any task will delay the project.
            </div>
          )}
        </div>
      </div>
    );
  }
}
