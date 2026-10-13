import { useNavigate } from 'react-router-dom';
import dashboardService from '../services/dashboardService.js';
import useFetch from '../hooks/useFetch.js';
import { daysLabel, daysUntil, formatDate, formatMinutes, formatTime } from '../utils/format.js';
import StatCard from '../components/StatCard.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import Loader from '../components/Loader.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { urgency } from './Exams.jsx';

const load = () => dashboardService.summary();

export default function Dashboard() {
  const { data: d, loading, error, reload } = useFetch(load);
  const navigate = useNavigate();
  const go = (path) => navigate(path, { state: { openForm: true } });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <PageHeader title={`${greeting}, student`} subtitle="Here is what your study week looks like." />
      <div className="row gap wrap quick">
        <button className="btn btn-primary" onClick={() => go('/tasks')}>+ Add task</button>
        <button className="btn" onClick={() => go('/subjects')}>+ Add subject</button>
        <button className="btn" onClick={() => go('/timetable')}>+ Add study session</button>
      </div>
      <ErrorMessage message={error} onRetry={reload} />
      {loading && !d ? <Loader /> : d && (
        <>
          <div className="grid cards-4">
            <StatCard label="Subjects" value={d.totalSubjects} tone="blue" />
            <StatCard label="Pending tasks" value={d.pendingTasks} tone="purple" />
            <StatCard label="Completed tasks" value={d.completedTasks} tone="green" />
            <StatCard label="Hours studied" value={d.completedStudyHours} hint={`of ${d.plannedStudyHours} planned`} tone="blue" />
          </div>

          <div className="card">
            <ProgressBar label={`Task completion: ${d.completedTasks} of ${d.totalTasks}`} value={d.completionPercentage} />
          </div>

          <div className="grid cards-2">
            <section className="card">
              <h3>Today's study schedule</h3>
              {d.todaySessions.length === 0 ? (
                <p className="muted">Nothing scheduled today. <button className="link" onClick={() => go('/timetable')}>Plan a session</button></p>
              ) : d.todaySessions.map((s) => (
                <div key={s.id} className="mini-row">
                  <strong>{formatTime(s.startTime)}</strong>
                  <span className="grow">{s.topic} <span className="muted small">({s.subjectName})</span></span>
                  <span className="muted small">{formatMinutes(s.plannedDurationMinutes)}</span>
                </div>
              ))}
            </section>

            <section className="card">
              <h3>Upcoming exams and deadlines</h3>
              {d.upcomingExams.length === 0 ? (
                <p className="muted">No upcoming dates. <button className="link" onClick={() => go('/exams')}>Add one</button></p>
              ) : d.upcomingExams.map((x) => {
                const days = daysUntil(x.examDate);
                return (
                  <div key={x.id} className={`mini-row deadline ${urgency(days)}`}>
                    <strong className="countdown">{daysLabel(days)}</strong>
                    <span className="grow">{x.title} <span className="muted small">({x.subjectName})</span></span>
                    <span className="muted small">{formatDate(x.examDate)}</span>
                  </div>
                );
              })}
            </section>
          </div>
        </>
      )}
    </>
  );
}
