export default function ProgressBar({ value = 0, label }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="progress-wrap">
      {label && <div className="progress-label"><span>{label}</span><span>{pct.toFixed(0)}%</span></div>}
      <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
