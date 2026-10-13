import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/subjects', label: 'Subjects', icon: '📘' },
  { to: '/tasks', label: 'Tasks', icon: '✅' },
  { to: '/timetable', label: 'Timetable', icon: '🗓️' },
  { to: '/exams', label: 'Exams', icon: '📝' },
  { to: '/progress', label: 'Progress', icon: '📈' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <div className="backdrop" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <span className="brand-mark">📚</span>
          <span>Study Planner</span>
        </div>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} onClick={onClose}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span aria-hidden="true">{l.icon}</span> {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
