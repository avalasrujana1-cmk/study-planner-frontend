import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import examService from '../services/examService.js';
import subjectService from '../services/subjectService.js';
import { getErrorMessage } from '../services/api.js';
import useFetch from '../hooks/useFetch.js';
import { daysLabel, daysUntil, formatDate, todayISO } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import Modal from '../components/Modal.jsx';
import Field from '../components/Field.jsx';
import Badge from '../components/Badge.jsx';
import Loader from '../components/Loader.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import EmptyState from '../components/EmptyState.jsx';
import SubjectSelect from '../components/SubjectSelect.jsx';

const load = () => Promise.all([examService.list(), subjectService.list()]);
const EMPTY = { title: '', subjectId: '', examType: 'EXAM', examDate: todayISO(), description: '' };

function validate(f) {
  const e = {};
  if (!f.title.trim()) e.title = 'Title is required';
  if (!f.subjectId) e.subjectId = 'Choose a subject';
  if (!f.examDate) e.examDate = 'Date is required';
  return e;
}

/** urgent = within 3 days, soon = within 7 days */
export function urgency(days) {
  if (days < 0) return 'past';
  if (days <= 3) return 'urgent';
  if (days <= 7) return 'soon';
  return 'later';
}

export default function Exams() {
  const { data, loading, error, reload } = useFetch(load);
  const [exams, subjects] = data || [[], []];
  const location = useLocation();
  const [showPast, setShowPast] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const openNew = () => { setForm({ ...EMPTY, examDate: todayISO() }); setErrors({}); setFormError(''); setEditing({}); };
  const openEdit = (x) => {
    setForm({ title: x.title, subjectId: String(x.subjectId), examType: x.examType, examDate: x.examDate, description: x.description || '' });
    setErrors({}); setFormError(''); setEditing(x);
  };
  useEffect(() => { if (location.state?.openForm && data) openNew(); }, [location.state, !!data]); // eslint-disable-line

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const shown = exams.filter((x) => showPast || daysUntil(x.examDate) >= 0); // already sorted by date from API

  async function save(e) {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) return;
    setSaving(true); setFormError('');
    const payload = { ...form, title: form.title.trim(), subjectId: Number(form.subjectId) };
    try {
      if (editing.id) await examService.update(editing.id, payload);
      else await examService.create(payload);
      setEditing(null);
      reload();
    } catch (err) { setFormError(getErrorMessage(err)); }
    finally { setSaving(false); }
  }

  async function remove(x) {
    if (!window.confirm(`Delete "${x.title}"?`)) return;
    setActionError('');
    try { await examService.remove(x.id); reload(); }
    catch (err) { setActionError(getErrorMessage(err)); }
  }

  const noSubjects = !loading && !error && subjects.length === 0;

  return (
    <>
      <PageHeader title="Exams and deadlines" subtitle="Upcoming dates in chronological order." actionLabel="Add exam or deadline" onAction={openNew} disabled={noSubjects} />
      <ErrorMessage message={error || actionError} onRetry={error ? reload : undefined} />

      {noSubjects ? (
        <EmptyState icon="📘" title="Add a subject first" text="Exams and deadlines belong to a subject, so create one first." />
      ) : loading && !data ? <Loader /> : exams.length === 0 ? (
        <EmptyState icon="📝" title="No exams or deadlines" text="Add an exam or assignment deadline so it never sneaks up on you." actionLabel="Add exam or deadline" onAction={openNew} />
      ) : (
        <>
          <label className="check-label">
            <input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} /> Show past dates
          </label>
          {shown.length === 0 ? (
            <EmptyState icon="🎉" title="Nothing coming up" text="All of your saved dates are in the past." />
          ) : (
            <div className="card list">
              {shown.map((x) => {
                const days = daysUntil(x.examDate);
                return (
                  <div key={x.id} className={`list-item deadline ${urgency(days)}`}>
                    <div className="countdown">{daysLabel(days)}</div>
                    <div className="grow">
                      <div className="item-title">{x.title} <Badge value={x.examType} kind="type" /></div>
                      <div className="muted small">{x.subjectName} · {formatDate(x.examDate)}</div>
                      {x.description && <div className="muted small">{x.description}</div>}
                    </div>
                    <div className="row gap">
                      <button className="btn btn-small" onClick={() => openEdit(x)}>Edit</button>
                      <button className="btn btn-small btn-danger" onClick={() => remove(x)}>Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {editing && (
        <Modal title={editing.id ? 'Edit exam or deadline' : 'Add exam or deadline'} onClose={() => setEditing(null)}>
          <form onSubmit={save} noValidate>
            <ErrorMessage message={formError} />
            <Field label="Title" error={errors.title}><input name="title" value={form.title} onChange={change} maxLength={150} autoFocus /></Field>
            <Field label="Subject" error={errors.subjectId}><SubjectSelect subjects={subjects} value={form.subjectId} onChange={change} /></Field>
            <div className="form-row">
              <Field label="Type">
                <select name="examType" value={form.examType} onChange={change}>
                  <option value="EXAM">Exam</option><option value="QUIZ">Quiz</option>
                  <option value="ASSIGNMENT">Assignment</option><option value="PROJECT">Project</option>
                </select>
              </Field>
              <Field label="Date" error={errors.examDate}><input type="date" name="examDate" value={form.examDate} onChange={change} /></Field>
            </div>
            <Field label="Description"><textarea name="description" rows={3} value={form.description} onChange={change} /></Field>
            <div className="form-actions">
              <button type="button" className="btn" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
