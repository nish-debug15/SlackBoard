import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertTriangle, TrendingUp, CheckCircle2, Timer, Activity } from 'lucide-react';
import { useTasks } from '../../context/TasksProvider';
import { slipImpact } from '@slackboard/shared';
import type { Task, Schedule, ProjectSettings, ScheduleEntry } from '@slackboard/shared';

// Wrapper to provide context to class component
export function Dashboard() {
  const { tasks, schedule, settings } = useTasks();
  const navigate = useNavigate();
  return <DashboardInner tasks={tasks} schedule={schedule} settings={settings} navigate={navigate} />;
}

interface DashboardProps {
  tasks: Task[];
  schedule: Schedule;
  settings: ProjectSettings;
  navigate: (path: string) => void;
}

interface DashboardState {
  slipTaskId: string;
  slipDays: number;
  sortField: 'es' | 'ef' | 'slack' | 'title';
  sortAsc: boolean;
}

class DashboardInner extends React.Component<DashboardProps, DashboardState> {
  constructor(props: DashboardProps) {
    super(props);
    this.state = {
      slipTaskId: '',
      slipDays: 0,
      sortField: 'es',
      sortAsc: true,
    };
  }

  componentDidUpdate(prevProps: DashboardProps) {
    // If selected slip task was deleted, reset
    if (this.state.slipTaskId && !this.props.tasks.find(t => t.id === this.state.slipTaskId)) {
      this.setState({ slipTaskId: '', slipDays: 0 });
    }
    // Auto-select first task if none selected
    if (!this.state.slipTaskId && this.props.tasks.length > 0) {
      this.setState({ slipTaskId: this.props.tasks[0].id });
    }
  }

  componentDidMount() {
    if (this.props.tasks.length > 0 && !this.state.slipTaskId) {
      this.setState({ slipTaskId: this.props.tasks[0].id });
    }
  }

  getEndDate(): string | null {
    const { settings, schedule } = this.props;
    if (!settings.startDate || schedule.projectDuration === 0) return null;
    const start = new Date(settings.startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + schedule.projectDuration);
    return end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  getSlipEndDate(slipDaysImpact: number): string | null {
    const { settings, schedule } = this.props;
    if (!settings.startDate) return null;
    const start = new Date(settings.startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + schedule.projectDuration + slipDaysImpact);
    return end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  handleSort = (field: DashboardState['sortField']) => {
    this.setState(prev => ({
      sortField: field,
      sortAsc: prev.sortField === field ? !prev.sortAsc : true,
    }));
  };

  render() {
    const { tasks, schedule, navigate } = this.props;
    const { slipTaskId, slipDays, sortField, sortAsc } = this.state;

    const criticalTasks = tasks.filter(t => schedule.entries[t.id]?.isCritical);
    const doneTasks = tasks.filter(t => t.column === 'done');
    const totalFloat = Object.values(schedule.entries).reduce((sum, e) => sum + e.slack, 0);
    const endDate = this.getEndDate();

    // Slip calculation
    const slipResult = slipTaskId ? slipImpact(schedule, slipTaskId, slipDays) : 0;
    const slipEntry = slipTaskId ? schedule.entries[slipTaskId] : null;
    const slipTask = slipTaskId ? tasks.find(t => t.id === slipTaskId) : null;
    const slipEndDate = this.getSlipEndDate(slipResult);

    // Sorted tasks for table
    const sortedCriticalTasks = [...criticalTasks].sort((a, b) => {
      const ea = schedule.entries[a.id];
      const eb = schedule.entries[b.id];
      if (!ea || !eb) return 0;
      let cmp = 0;
      switch (sortField) {
        case 'title': cmp = a.title.localeCompare(b.title); break;
        case 'es': cmp = ea.es - eb.es; break;
        case 'ef': cmp = ea.ef - eb.ef; break;
        case 'slack': cmp = ea.slack - eb.slack; break;
      }
      return sortAsc ? cmp : -cmp;
    });

    // Slack distribution data
    const maxSlack = Math.max(...Object.values(schedule.entries).map(e => e.slack), 1);
    const slackTasks = tasks
      .map(t => ({ task: t, entry: schedule.entries[t.id] }))
      .filter(({ entry }) => entry)
      .sort((a, b) => (a.entry!.slack - b.entry!.slack));

    return (
      <div className="space-y-4 max-w-[960px] mx-auto">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Project Duration */}
          <div className="rounded-lg border p-4" style={{ borderColor: 'var(--color-border-1)', background: 'var(--color-bg-1)' }}>
            <div className="text-2xs uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-3)' }}>
              Project Duration
            </div>
            <div className="font-mono text-xl font-semibold" style={{ color: 'var(--color-text-0)', fontFamily: 'var(--font-mono)' }}>
              {schedule.projectDuration}<span className="text-base" style={{ color: 'var(--color-text-3)' }}>d</span>
            </div>
            {endDate && (
              <div className="text-2xs mt-1" style={{ color: 'var(--color-text-3)' }}>
                Ends {endDate}
              </div>
            )}
          </div>

          {/* Critical Tasks */}
          <div className="rounded-lg border p-4" style={{ borderColor: 'var(--color-border-1)', background: 'var(--color-bg-1)' }}>
            <div className="text-2xs uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-3)' }}>
              Critical Tasks
            </div>
            <div className="font-mono text-xl font-semibold" style={{ color: 'var(--color-critical)', fontFamily: 'var(--font-mono)' }}>
              {criticalTasks.length}<span className="text-base" style={{ color: 'var(--color-text-3)' }}>/{tasks.length}</span>
            </div>
          </div>

          {/* Total Float */}
          <div className="rounded-lg border p-4" style={{ borderColor: 'var(--color-border-1)', background: 'var(--color-bg-1)' }}>
            <div className="text-2xs uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-3)' }}>
              Total Float
            </div>
            <div className="font-mono text-xl font-semibold" style={{ color: 'var(--color-text-0)', fontFamily: 'var(--font-mono)' }}>
              {totalFloat}<span className="text-base" style={{ color: 'var(--color-text-3)' }}>d</span>
            </div>
          </div>

          {/* Done Progress */}
          <div className="rounded-lg border p-4" style={{ borderColor: 'var(--color-border-1)', background: 'var(--color-bg-1)' }}>
            <div className="text-2xs uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-3)' }}>
              Done Progress
            </div>
            <div className="font-mono text-xl font-semibold" style={{ color: 'var(--color-status-done)', fontFamily: 'var(--font-mono)' }}>
              {tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0}<span className="text-base" style={{ color: 'var(--color-text-3)' }}>%</span>
            </div>
            <div className="text-2xs mt-1" style={{ color: 'var(--color-text-3)' }}>
              {doneTasks.length}/{tasks.length} tasks
            </div>
          </div>
        </div>

        {/* Critical Path Strip */}
        <div className="rounded-lg border p-4" style={{ borderColor: 'var(--color-border-1)', background: 'var(--color-bg-1)' }}>
          <div className="text-2xs uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-3)' }}>
            Critical Path
          </div>
          {schedule.criticalPath.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--color-text-4)' }}>No critical path computed.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-1">
              {schedule.criticalPath.map((taskId, i) => {
                const task = tasks.find(t => t.id === taskId);
                if (!task) return null;
                return (
                  <React.Fragment key={taskId}>
                    <button
                      onClick={() => navigate(`/task/${taskId}`)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border transition-colors duration-100"
                      style={{
                        borderColor: 'var(--color-critical-border)',
                        background: 'var(--color-critical-bg)',
                        color: 'var(--color-critical-text)',
                        cursor: 'pointer',
                        fontSize: 'var(--text-2xs)',
                        fontWeight: 500,
                      }}
                    >
                      {task.title}
                      <span className="font-mono" style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}>
                        {task.duration}d
                      </span>
                    </button>
                    {i < schedule.criticalPath.length - 1 && (
                      <ArrowRight size={14} strokeWidth={1.5} style={{ color: 'var(--color-critical)', opacity: 0.4 }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* Two-column layout for table + slip simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Critical Task Table */}
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-border-1)', background: 'var(--color-bg-1)' }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-border-0)' }}>
              <span className="text-2xs uppercase tracking-wider font-semibold" style={{ color: 'var(--color-text-3)' }}>
                Critical Tasks
              </span>
            </div>
            {sortedCriticalTasks.length === 0 ? (
              <p className="text-xs p-4" style={{ color: 'var(--color-text-4)' }}>No critical tasks.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bg-2)' }}>
                      {[
                        { key: 'title' as const, label: 'Task' },
                        { key: 'es' as const, label: 'ES' },
                        { key: 'ef' as const, label: 'EF' },
                        { key: 'slack' as const, label: 'Slack' },
                      ].map(col => (
                        <th
                          key={col.key}
                          onClick={() => this.handleSort(col.key)}
                          className="px-3 py-2 text-left cursor-pointer select-none"
                          style={{
                            color: 'var(--color-text-3)',
                            fontWeight: 500,
                            fontSize: '11px',
                            borderBottom: '1px solid var(--color-border-0)',
                          }}
                        >
                          {col.label} {sortField === col.key && (sortAsc ? '↑' : '↓')}
                        </th>
                      ))}
                      <th className="px-3 py-2" style={{ borderBottom: '1px solid var(--color-border-0)' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCriticalTasks.map(task => {
                      const entry = schedule.entries[task.id];
                      if (!entry) return null;
                      return (
                        <tr
                          key={task.id}
                          onClick={() => navigate(`/task/${task.id}`)}
                          className="cursor-pointer transition-colors duration-100"
                          style={{ borderBottom: '1px solid var(--color-border-0)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-2)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td className="px-3 py-2 font-medium" style={{ color: 'var(--color-text-0)' }}>
                            {task.title}
                          </td>
                          <td className="px-3 py-2 font-mono" style={{ color: 'var(--color-text-2)', fontFamily: 'var(--font-mono)' }}>
                            {entry.es}
                          </td>
                          <td className="px-3 py-2 font-mono" style={{ color: 'var(--color-text-2)', fontFamily: 'var(--font-mono)' }}>
                            {entry.ef}
                          </td>
                          <td className="px-3 py-2 font-mono" style={{ color: 'var(--color-text-2)', fontFamily: 'var(--font-mono)' }}>
                            {entry.slack}d
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className="inline-flex px-1.5 py-0.5 rounded text-2xs"
                              style={{
                                background:
                                  task.column === 'done' ? 'var(--color-status-done-bg)' :
                                  task.column === 'inprogress' ? 'var(--color-status-inprogress-bg)' :
                                  'var(--color-status-todo-bg)',
                                color:
                                  task.column === 'done' ? 'var(--color-status-done)' :
                                  task.column === 'inprogress' ? 'var(--color-status-inprogress)' :
                                  'var(--color-status-todo)',
                                fontSize: '10px',
                                fontWeight: 500,
                              }}
                            >
                              {task.column === 'inprogress' ? 'In Progress' : task.column === 'done' ? 'Done' : 'To Do'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Slip Simulator */}
          <div className="rounded-lg border p-4" style={{ borderColor: 'var(--color-border-1)', background: 'var(--color-bg-1)' }}>
            <div className="text-2xs uppercase tracking-wider mb-3 font-semibold" style={{ color: 'var(--color-text-3)' }}>
              Slip Simulator
            </div>

            {tasks.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--color-text-4)' }}>Add tasks to simulate slips.</p>
            ) : (
              <>
                {/* Task selector */}
                <select
                  value={slipTaskId}
                  onChange={e => this.setState({ slipTaskId: e.target.value, slipDays: 0 })}
                  className="w-full rounded px-3 py-2 text-xs mb-3"
                  style={{
                    background: 'var(--color-bg-2)',
                    color: 'var(--color-text-0)',
                    border: '1px solid var(--color-border-1)',
                  }}
                >
                  {tasks.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>

                {/* Slider */}
                <div className="mb-3">
                  <div className="flex justify-between text-2xs mb-1" style={{ color: 'var(--color-text-3)' }}>
                    <span>Slip: <span className="font-mono" style={{ fontFamily: 'var(--font-mono)' }}>{slipDays}d</span></span>
                    <span className="font-mono" style={{ fontFamily: 'var(--font-mono)' }}>0—14d</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={14}
                    value={slipDays}
                    onChange={e => this.setState({ slipDays: parseInt(e.target.value) })}
                    className="w-full"
                    style={{ accentColor: 'var(--color-accent)' }}
                    aria-label="Slip days"
                  />
                </div>

                {/* Result */}
                <div
                  className="rounded border p-3"
                  style={{
                    borderColor: slipResult > 0 ? 'var(--color-critical-border)' : 'var(--color-border-1)',
                    background: slipResult > 0 ? 'var(--color-critical-bg)' : 'var(--color-bg-2)',
                  }}
                >
                  {slipDays === 0 ? (
                    <p className="text-xs" style={{ color: 'var(--color-text-3)' }}>Drag the slider to simulate a slip.</p>
                  ) : slipResult > 0 ? (
                    <>
                      <div className="flex items-center gap-1.5 mb-1">
                        <AlertTriangle size={13} strokeWidth={1.5} style={{ color: 'var(--color-critical)' }} />
                        <span className="text-xs font-medium" style={{ color: 'var(--color-critical-text)' }}>
                          Project end moves +{slipResult}d
                        </span>
                      </div>
                      <div className="text-2xs" style={{ color: 'var(--color-text-3)' }}>
                        {endDate} → {slipEndDate}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 mb-1">
                        <CheckCircle2 size={13} strokeWidth={1.5} style={{ color: 'var(--color-status-done)' }} />
                        <span className="text-xs font-medium" style={{ color: 'var(--color-status-done)' }}>
                          Absorbed by slack
                        </span>
                      </div>
                      <div className="text-2xs" style={{ color: 'var(--color-text-3)' }}>
                        {slipEntry ? `${slipEntry.slack - slipDays}d float remaining` : ''}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Slack Distribution Chart */}
        <div className="rounded-lg border p-4" style={{ borderColor: 'var(--color-border-1)', background: 'var(--color-bg-1)' }}>
          <div className="text-2xs uppercase tracking-wider mb-3 font-semibold" style={{ color: 'var(--color-text-3)' }}>
            Slack Distribution
          </div>

          {slackTasks.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--color-text-4)' }}>No tasks to display.</p>
          ) : (
            <svg
              width="100%"
              viewBox={`0 0 500 ${slackTasks.length * 24 + 8}`}
              style={{ overflow: 'visible' }}
            >
              {slackTasks.map(({ task, entry }, i) => {
                if (!entry) return null;
                const barWidth = maxSlack > 0 ? (entry.slack / maxSlack) * 340 : 0;
                const y = i * 24 + 4;

                return (
                  <g key={task.id}>
                    {/* Task name */}
                    <text
                      x={0}
                      y={y + 14}
                      fill="var(--color-text-2)"
                      fontSize="11"
                      fontFamily="var(--font-ui)"
                    >
                      {task.title.length > 18 ? task.title.slice(0, 18) + '…' : task.title}
                    </text>
                    {/* Bar */}
                    <rect
                      x={150}
                      y={y + 2}
                      width={Math.max(barWidth, entry.isCritical ? 0 : 2)}
                      height={16}
                      rx={2}
                      fill={entry.isCritical ? 'var(--color-critical)' : 'var(--color-border-2)'}
                      opacity={0.7}
                    />
                    {/* Value */}
                    <text
                      x={150 + barWidth + 6}
                      y={y + 14}
                      fill="var(--color-text-3)"
                      fontSize="11"
                      fontFamily="var(--font-mono)"
                    >
                      {entry.slack}d
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </div>
    );
  }
}
