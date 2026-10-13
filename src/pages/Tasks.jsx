import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import taskService from '../services/taskService.js';
import subjectService from '../services/subjectService.js';
import { getErrorMessage } from '../services/api.js';
import useFetch from '../hooks/useFetch.js';
import { daysUntil, formatDate, formatMinutes, todayISO } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import Modal from '../components/Modal.jsx';
import Field from '../components/Field.jsx';
import Badge from '../components/Badge.jsx';
import Loader from '../components/Loader.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import EmptyState from '../components/EmptyState.jsx';
import SubjectSelect from '../components/SubjectSelect.jsx';

const load = () => Promise.all([taskService.list(), subjectService.list()]);
const EMPTY = { title: '', subjectId: '', description: '', dueDate: todayISO(), priority: 'MEDIUM', estimatedDurationMinutes: 60, completed: false };
const NO_FILTERS = { subjectId: '', date: '', priority: '', status: '' };

function validate(f) {
  const e = {};
  if (!f.title.trim()) e.title = 'Title is required';
  if (!f.subjectId) e.subjectId = 'Choose a subject';
  if (!f.dueDate) e.dueDate = 'Due date is required';
  const d = Number(f.estimatedDurationMinutes);
  if (!d || d < 1 || d > 1440) e.estimatedDurationMinutes = 'Enter 1 to 1440 minutes';
  return e;
}

export default function Tasks() {
  const { data, loading, error, reload } = useFetch(load);
  const [tasks, subjects] = data || [[], []];
  const location = useLocation();
  const [filters, setFilters] = useState(NO_FILTERS);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const openNew = () => { setForm({ ...EMPTY, dueDate: todayISO() }); setErrors({}); setFormError(''); setEditing({}); };
  const openEdit = (t) => {
    setForm({ title: t.title, subjectId: String(t.subjectId), description: t.description || '', dueDate: t.dueDate,
      priority: t.priority, estimatedDurationMinutes: t.estimatedDurationMinutes, completed: t.completed });
    setErrors({}); setFormError(''); setEditing(t);
  };
  useEffect(() => { if (location.state?.openForm && data) openNew(); }, [location.state, !!data]); // eslint-disable-line

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const setFilter = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const visible = useMemo(() => tasks.filter((t) =>
    (!filters.subjectId || String(t.subjectId) === filters.subjectId) &&
    (!filters.date || t.dueDate === filters.date) &&
    (!filters.priority || t.priority === filters.priority) &&
    (!filters.status || (filters.status === 'completed') === t.completed)), [tasks, filters]);

  async function save(e) {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) return;
    setSaving(true); setFormError('');
    const payload = { ...form, title: form.title.trim(), subjectId: Number(form.subjectId), estimatedDurationMinutes: Number(form.estimatedDurationMinutes) };
    try {
      if (editing.id) await taskService.update(editing.id, payload);
      else await taskService.create(payload);
      setEditing(null);
      reload();
    } catch (err) { setFormError(getErrorMessage(err)); }
    finally { setSaving(false); }
  }

  async function toggle(t) {
    setActionError('');
    try {
      await (t.completed ? taskService.pending(t.id) : taskService.complete(t.id));
      reload();
    } catch (err) { setActionError(getErrorMessage(err)); }
  }

  async function remove(t) {
    if (!window.confirm(`Delete task "${t.title}"?`)) return;
    setActionError('');
    try { await taskService.remove(t.id); reload(); }
    catch (err) { setActionError(getErrorMessage(err)); }
  }

  const noSubjects = !loading && !error && subjects.length === 0;

  return (
    <>
      <PageHeader title="Tasks" subtitle="Everything you need to study, in one list." actionLabel="Add task" onAction={openNew} disabled={noSubjects} />
      <ErrorMessage message={error || actionError} onRetry={error ? reload : undefined} />

      {noSubjects ? (
        <EmptyState icon="📘" title="Add a subject first" text="Tasks belong to a subject, so create one before adding tasks." />
      ) : loading && !data ? <Loader /> : (
        <>
          <div className="card filters">
            <SubjectSelect name="subjectId" subjects={subjects} value={filters.subjectId} onChange={setFilter} allowAll />
            <input type="date" name="date" value={filters.date} onChange={setFilter} aria-label="Due date" />
            <select name="priority" value={filters.priority} onChange={setFilter}>
              <option value="">All priorities</option>
              <option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option>
            </select>
            <select name="status" value={filters.status} onChange={setFilter}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option><option value="completed">Completed</option>
            </select>
            <button className="btn btn-small" onClick={() => setFilters(NO_FILTERS)}>Clear filters</button>
          </div>

          {tasks.length === 0 ? (
            <EmptyState icon="✅" title="No tasks yet" text="Add a task to start tracking what you need to study." actionLabel="Add task" onAction={openNew} />
          ) : visible.length === 0 ? (
            <EmptyState icon="🔍" title="No tasks match these filters" text="Try clearing a filter." />
          ) : (
            <div className="card list">
              {visible.map((t) => {
                const overdue = !t.completed && daysUntil(t.dueDate) < 0;
                return (
                  <div key={t.id} className={`list-item ${t.completed ? 'done' : ''}`}>
                    <input type="checkbox" className="check" checked={t.completed} onChange={() => toggle(t)} aria-label={`Mark "${t.title}" as ${t.completed ? 'pending' : 'completed'}`} />
                    <div className="grow">
                      <div className="item-title">{t.title}</div>
                      <div className="muted small">{t.subjectName} · {formatMinutes(t.estimatedDurationMinutes)}</div>
                      {t.description && <div className="muted small">{t.description}</div>}
                    </div>
                    <div className="item-meta">
                      <Badge value={t.priority} />
                      <span className={`small ${overdue ? 'text-danger' : 'muted'}`}>{overdue ? 'Overdue · ' : 'Due '}{formatDate(t.dueDate)}</span>
                    </div>
                    <div className="row gap">
                      <button className="btn btn-small" onClick={() => openEdit(t)}>Edit</button>
                      <button className="btn btn-small btn-danger" onClick={() => remove(t)}>Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {editing && (
        <Modal title={editing.id ? 'Edit task' : 'Add task'} onClose={() => setEditing(null)}>
          <form onSubmit={save} noValidate>
            <ErrorMessage message={formError} />
            <Field label="Title" error={errors.title}><input name="title" value={form.title} onChange={change} maxLength={150} autoFocus /></Field>
            <Field label="Subject" error={errors.subjectId}><SubjectSelect subjects={subjects} value={form.subjectId} onChange={change} /></Field>
            <Field label="Description"><textarea name="description" rows={2} value={form.description} onChange={change} /></Field>
            <div className="form-row">
              <Field label="Due date" error={errors.dueDate}><input type="date" name="dueDate" value={form.dueDate} onChange={change} /></Field>
              <Field label="Estimated minutes" error={errors.estimatedDurationMinutes}><input type="number" name="estimatedDurationMinutes" min="1" max="1440" value={form.estimatedDurationMinutes} onChange={change} /></Field>
            </div>
            <div className="form-row">
              <Field label="Priority">
                <select name="priority" value={form.priority} onChange={change}>
                  <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
                </select>
              </Field>
              <Field label="Status">
                <select name="completed" value={String(form.completed)} onChange={(e) => setForm({ ...form, completed: e.target.value === 'true' })}>
                  <option value="false">Pending</option><option value="true">Completed</option>
                </select>
              </Field>
            </div>
            <div className="form-actions">
              <button type="button" className="btn" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save task'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
