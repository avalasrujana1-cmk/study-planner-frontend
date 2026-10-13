export default function PageHeader({ title, subtitle, actionLabel, onAction, disabled }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actionLabel && (
        <button className="btn btn-primary" onClick={onAction} disabled={disabled}>+ {actionLabel}</button>
      )}
    </div>
  );
}
