import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import sessionService from '../services/sessionService.js';
import subjectService from '../services/subjectService.js';
import { getErrorMessage } from '../services/api.js';
import useFetch from '../hooks/useFetch.js';
import { daysUntil, formatDate, formatMinutes, formatTime, todayISO } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import Modal from '../components/Modal.jsx';
import Field from '../components/Field.jsx';
import Loader from '../components/Loader.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import EmptyState from '../components/EmptyState.jsx';
import SubjectSelect from '../components/SubjectSelect.jsx';

const load = () => Promise.all([sessionService.list(), subjectService.list()]);
const EMPTY = { topic: '', subjectId: '', studyDate: todayISO(), startTime: '18:00', endTime: '19:00', completedDurationMinutes: 0 };

function validate(f) {
  const e = {};
  if (!f.topic.trim()) e.topic = 'Topic is required';
  if (!f.subjectId) e.subjectId = 'Choose a subject';
  if (!f.studyDate) e.studyDate = 'Date is required';
  if (!f.startTime) e.startTime = 'Start time is required';
  if (!f.endTime) e.endTime = 'End time is required';
  else if (f.startTime && f.endTime <= f.startTime) e.endTime = 'End time must be after start time';
  const c = Number(f.completedDurationMinutes);
  if (c < 0 || c > 1440) e.completedDurationMinutes = 'Enter 0 to 1440 minutes';
  return e;
}

export default function Timetable() {
  const { data, loading, error, reload } = useFetch(load);
  const [sessions, subjects] = data || [[], []];
  const location = useLocation();
  const [range, setRange] = useState('week');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const openNew = () => { setForm({ ...EMPTY, studyDate: todayISO() }); setErrors({}); setFormError(''); setEditing({}); };
  const openEdit = (s) => {
    setForm({ topic: s.topic, subjectId: String(s.subjectId), studyDate: s.studyDate, startTime: s.startTime.slice(0, 5),
      endTime: s.endTime.slice(0, 5), completedDurationMinutes: s.completedDurationMinutes });
    setErrors({}); setFormError(''); setEditing(s);
  };
  useEffect(() => { if (location.state?.openForm && data) openNew(); }, [location.state, !!data]); // eslint-disable-line

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const grouped = useMemo(() => {
    const filtered = sessions.filter((s) => {
      const d = daysUntil(s.studyDate);
      if (range === 'today') return d === 0;
      if (range === 'week') return d >= 0 && d < 7;
      return true;
    });
    const map = new Map();
    filtered.forEach((s) => map.set(s.studyDate, [...(map.get(s.studyDate) || []), s]));
    return [...map.entries()];
  }, [sessions, range]);

  async function save(e) {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) return;
    setSaving(true); setFormError('');
    const payload = { ...form, topic: form.topic.trim(), subjectId: Number(form.subjectId), completedDurationMinutes: Number(form.completedDurationMinutes) || 0 };
    try {
      if (editing.id) await sessionService.update(editing.id, payload);
      else await sessionService.create(payload);
      setEditing(null);
      reload();
    } catch (err) { setFormError(getErrorMessage(err)); }
    finally { setSaving(false); }
  }

  async function remove(s) {
    if (!window.confirm(`Delete the session "${s.topic}"?`)) return;
    setActionError('');
    try { await sessionService.remove(s.id); reload(); }
    catch (err) { setActionError(getErrorMessage(err)); }
  }

  const noSubjects = !loading && !error && subjects.length === 0;

  return (
    <>
      <PageHeader title="Timetable" subtitle="Plan when you will study each subject." actionLabel="Add session" onAction={openNew} disabled={noSubjects} />
      <ErrorMessage message={error || actionError} onRetry={error ? reload : undefined} />

      {noSubjects ? (
        <EmptyState icon="📘" title="Add a subject first" text="Study sessions belong to a subject, so create one before scheduling." />
      ) : loading && !data ? <Loader /> : (
        <>
          <div className="tabs" role="tablist">
            {[['today', 'Today'], ['week', 'Next 7 days'], ['all', 'All sessions']].map(([k, l]) => (
              <button key={k} role="tab" aria-selected={range === k} className={`tab ${range === k ? 'active' : ''}`} onClick={() => setRange(k)}>{l}</button>
            ))}
          </div>
          {grouped.length === 0 ? (
            <EmptyState icon="🗓️" title="No sessions scheduled" text="Schedule a study session to see it here." actionLabel="Add session" onAction={openNew} />
          ) : grouped.map(([date, items]) => (
            <section key={date} className="day-group">
              <h3>{formatDate(date)}</h3>
              <div className="card list">
                {items.map((s) => (
                  <div key={s.id} className="list-item">
                    <div className="time-box">{formatTime(s.startTime)}<br /><span className="muted small">to {formatTime(s.endTime)}</span></div>
                    <div className="grow">
                      <div className="item-title">{s.topic}</div>
                      <div className="muted small">{s.subjectName} · planned {formatMinutes(s.plannedDurationMinutes)} · studied {formatMinutes(s.completedDurationMinutes)}</div>
                    </div>
                    <div className="row gap">
                      <button className="btn btn-small" onClick={() => openEdit(s)}>Edit</button>
                      <button className="btn btn-small btn-danger" onClick={() => remove(s)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </>
      )}

      {editing && (
        <Modal title={editing.id ? 'Edit study session' : 'Add study session'} onClose={() => setEditing(null)}>
          <form onSubmit={save} noValidate>
            <ErrorMessage message={formError} />
            <Field label="Topic" error={errors.topic}><input name="topic" value={form.topic} onChange={change} maxLength={150} autoFocus /></Field>
            <Field label="Subject" error={errors.subjectId}><SubjectSelect subjects={subjects} value={form.subjectId} onChange={change} /></Field>
            <Field label="Study date" error={errors.studyDate}><input type="date" name="studyDate" value={form.studyDate} onChange={change} /></Field>
            <div className="form-row">
              <Field label="Start time" error={errors.startTime}><input type="time" name="startTime" value={form.startTime} onChange={change} /></Field>
              <Field label="End time" error={errors.endTime}><input type="time" name="endTime" value={form.endTime} onChange={change} /></Field>
            </div>
            <Field label="Minutes actually studied" error={errors.completedDurationMinutes}>
              <input type="number" name="completedDurationMinutes" min="0" max="1440" value={form.completedDurationMinutes} onChange={change} />
            </Field>
            <div className="form-actions">
              <button type="button" className="btn" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save session'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
