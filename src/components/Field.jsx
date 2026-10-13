/** Label + input wrapper that also shows a validation message. */
export default function Field({ label, error, children }) {
  return (
    <label className={`field ${error ? 'has-error' : ''}`}>
      <span>{label}</span>
      {children}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}
