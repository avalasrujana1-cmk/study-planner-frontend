export default function EmptyState({ icon = '🗂️', title, text, actionLabel, onAction }) {
  return (
    <div className="empty">
      <div className="empty-icon" aria-hidden="true">{icon}</div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {actionLabel && <button className="btn btn-primary" onClick={onAction}>{actionLabel}</button>}
    </div>
  );
}
