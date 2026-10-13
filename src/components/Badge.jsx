import { capitalize } from '../utils/format.js';

export default function Badge({ value, kind = 'priority' }) {
  return <span className={`badge ${kind}-${String(value).toLowerCase()}`}>{capitalize(String(value))}</span>;
}
