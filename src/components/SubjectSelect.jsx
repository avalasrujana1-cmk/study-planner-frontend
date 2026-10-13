export default function SubjectSelect({ subjects, value, onChange, allowAll = false, name = 'subjectId' }) {
  return (
    <select name={name} value={value} onChange={onChange}>
      <option value="">{allowAll ? 'All subjects' : 'Select a subject'}</option>
      {subjects.map((s) => (
        <option key={s.id} value={s.id}>{s.name}</option>
      ))}
    </select>
  );
}
