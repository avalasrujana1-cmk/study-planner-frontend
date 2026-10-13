import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import subjectService from '../services/subjectService.js';
import { getErrorMessage } from '../services/api.js';
import useFetch from '../hooks/useFetch.js';
import PageHeader from '../components/PageHeader.jsx';
import Modal from '../components/Modal.jsx';
import Field from '../components/Field.jsx';
import Badge from '../components/Badge.jsx';
import Loader from '../components/Loader.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import EmptyState from '../components/EmptyState.jsx';

const EMPTY = { name: '', description: '', priority: 'MEDIUM', targetStudyHours: '' };
const load = () => subjectService.list();

function validate(f) {
  const e = {};
  if (!f.name.trim()) e.name = 'Subject name is required';
  else if (f.name.length > 100) e.name = 'Use 100 characters or fewer';
  if (f.targetStudyHours === '' || Number(f.targetStudyHours) < 0) e.targetStudyHours = 'Enter target hours (0 or more)';
  if (f.description.length > 500) e.description = 'Use 500 characters or fewer';
  return e;
}

export default function Subjects() {
  const { data, loading, error, reload } = useFetch(load);
  const location = useLocation();
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {id} = edit
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const openNew = () => { setForm(EMPTY); setErrors({}); setFormError(''); setEditing({}); };
  const openEdit = (s) => {
    setForm({ name: s.name, description: s.description || '', priority: s.priority, targetStudyHours: s.targetStudyHours });
    setErrors({}); setFormError(''); setEditing(s);
  };

  useEffect(() => { if (location.state?.openForm) openNew(); }, [location.state]);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function save(e) {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) return;
    setSaving(true);
    setFormError('');
    const payload = { ...form, name: form.name.trim(), targetStudyHours: Number(form.targetStudyHours) };
    try {
      if (editing.id) await subjectService.update(editing.id, payload);
      else await subjectService.create(payload);
      setEditing(null);
      reload();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(s) {
    if (!window.confirm(`Delete "${s.name}"? Its tasks, study sessions and exams will also be deleted.`)) return;
    setActionError('');
    try {
      await subjectService.remove(s.id);
      reload();
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  }

  return (
    <>
      <PageHeader title="Subjects" subtitle="The courses you are studying this term." actionLabel="Add subject" onAction={openNew} />
      <ErrorMessage message={error || actionError} onRetry={error ? reload : undefined} />
      {loading && !data ? <Loader /> : data && data.length === 0 ? (
        <EmptyState icon="📘" title="No subjects yet" text="Add your first subject to start planning tasks, sessions and exams." actionLabel="Add subject" onAction={openNew} />
      ) : (
        <div className="grid cards-3">
          {(data || []).map((s) => (
            <div key={s.id} className="card subject-card">
              <div className="row between">
                <h3>{s.name}</h3>
                <Badge value={s.priority} />
              </div>
              <p className="muted">{s.description || 'No description'}</p>
              <p><strong>{s.targetStudyHours}</strong> target study hours</p>
              <div className="row gap">
                <button className="btn btn-small" onClick={() => openEdit(s)}>Edit</button>
                <button className="btn btn-small btn-danger" onClick={() => remove(s)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal title={editing.id ? 'Edit subject' : 'Add subject'} onClose={() => setEditing(null)}>
          <form onSubmit={save} noValidate>
            <ErrorMessage message={formError} />
            <Field label="Subject name" error={errors.name}>
              <input name="name" value={form.name} onChange={change} maxLength={100} autoFocus />
            </Field>
            <Field label="Description" error={errors.description}>
              <textarea name="description" rows={3} value={form.description} onChange={change} />
            </Field>
            <div className="form-row">
              <Field label="Priority">
                <select name="priority" value={form.priority} onChange={change}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </Field>
              <Field label="Target study hours" error={errors.targetStudyHours}>
                <input type="number" name="targetStudyHours" min="0" step="0.5" value={form.targetStudyHours} onChange={change} />
              </Field>
            </div>
            <div className="form-actions">
              <button type="button" className="btn" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save subject'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
