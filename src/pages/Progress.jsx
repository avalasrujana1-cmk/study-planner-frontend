import dashboardService from '../services/dashboardService.js';
import useFetch from '../hooks/useFetch.js';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import Loader from '../components/Loader.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import EmptyState from '../components/EmptyState.jsx';

const load = () => Promise.all([dashboardService.progress(), dashboardService.subjectProgress()]);

export default function Progress() {
  const { data, loading, error, reload } = useFetch(load);
  const [overall, subjects] = data || [null, []];

  return (
    <>
      <PageHeader title="Progress" subtitle="How much of your plan you have finished." />
      <ErrorMessage message={error} onRetry={reload} />
      {loading && !data ? <Loader /> : overall && (
        <>
          <div className="grid cards-4">
            <StatCard label="Completed tasks" value={overall.completedTasks} tone="green" />
            <StatCard label="Pending tasks" value={overall.pendingTasks} tone="purple" />
            <StatCard label="Planned study hours" value={overall.plannedStudyHours} tone="blue" />
            <StatCard label="Hours studied" value={overall.completedStudyHours} tone="green" />
          </div>
          <div className="card">
            <h3>Overall completion</h3>
            <ProgressBar label={`Tasks: ${overall.completedTasks} of ${overall.totalTasks} done`} value={overall.completionPercentage} />
            <ProgressBar label="Study hours: studied versus planned" value={overall.hoursCompletionPercentage} />
          </div>

          <h2 className="section-title">By subject</h2>
          {subjects.length === 0 ? (
            <EmptyState icon="📈" title="No subjects yet" text="Add subjects, tasks and study sessions to see progress here." />
          ) : (
            <div className="grid cards-2">
              {subjects.map((s) => (
                <div key={s.subjectId} className="card">
                  <h3>{s.subjectName}</h3>
                  <ProgressBar label={`Tasks: ${s.completedTasks} of ${s.totalTasks} done`} value={s.completionPercentage} />
                  <ProgressBar label={`Target: ${s.completedStudyHours} of ${s.targetStudyHours} hours studied`} value={s.targetCompletionPercentage} />
                  <p className="muted small">{s.plannedStudyHours} hours planned in your timetable</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
