export default function StatCard({ label, value, hint, tone = 'blue' }) {
  return (
    <div className={`card stat tone-${tone}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  );
}
