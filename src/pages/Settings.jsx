import { useState } from 'react';
import dashboardService from '../services/dashboardService.js';
import { API_BASE_URL, getErrorMessage } from '../services/api.js';
import PageHeader from '../components/PageHeader.jsx';

export default function Settings() {
  const [status, setStatus] = useState(null);

  async function test() {
    setStatus({ type: 'info', text: 'Checking…' });
    try {
      await dashboardService.health();
      setStatus({ type: 'ok', text: 'Connected. The backend is running.' });
    } catch (err) {
      setStatus({ type: 'error', text: getErrorMessage(err) });
    }
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Connection details for this app." />
      <div className="card">
        <h3>Backend connection</h3>
        <p className="muted">The app sends requests to this API address. Change it with the <code>VITE_API_BASE_URL</code> environment variable.</p>
        <p><code>{API_BASE_URL}</code></p>
        <button className="btn btn-primary" onClick={test}>Test connection</button>
        {status && (
          <div className={`alert ${status.type === 'error' ? 'alert-error' : status.type === 'ok' ? 'alert-ok' : ''}`} role="status" style={{ marginTop: 12 }}>
            {status.text}
          </div>
        )}
      </div>
      <div className="card">
        <h3>About</h3>
        <p className="muted">Smart Study Planner · React, Spring Boot and MySQL. All data is stored in your database.</p>
      </div>
    </>
  );
}
