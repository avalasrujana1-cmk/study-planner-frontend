import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Subjects from './pages/Subjects.jsx';
import Tasks from './pages/Tasks.jsx';
import Timetable from './pages/Timetable.jsx';
import Exams from './pages/Exams.jsx';
import Progress from './pages/Progress.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="main-area">
        <header className="topbar">
          <button className="icon-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}>☰</button>
          <strong>Smart Study Planner</strong>
        </header>
        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/exams" element={<Exams />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
