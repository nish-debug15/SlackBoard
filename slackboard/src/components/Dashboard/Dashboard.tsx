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
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <h2>Dashboard</h2>
        
        {showUpdateBanner && (
          <div className="schedule-updated-banner">
            Schedule updated: Project duration changed!
          </div>
        )}

        <div className="dashboard-grid">
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="stat-value">{schedule.projectDuration}</div>
            <div className="stat-label">Total Project Duration (days)</div>
          </div>
          
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="stat-value">{tasks.length}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h3>Critical Path Tasks ({criticalTasks.length})</h3>
          {criticalTasks.length > 0 ? (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {criticalTasks.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge-critical">Critical</span>
                  <strong>{t.title}</strong>
                  <span className="duration" style={{ color: 'var(--text-muted)' }}>({t.duration} days)</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No critical tasks identified.</p>
          )}
        </div>

        <div>
          <h3>"What-If" Analysis</h3>
          {longestSlackTask ? (
            <div className="card" style={{ background: 'var(--slack-bg)' }}>
              Task <strong>{(longestSlackTask as Task).title}</strong> has the most slack. 
              It could slip by up to <strong className="duration">{maxSlack} days</strong> risk-free without delaying the total project end date.
            </div>
          ) : (
            <div className="card">
              All tasks are critical. Any delay to any task will delay the project.
            </div>
          )}
        </div>
      </div>
    );
  }
}
