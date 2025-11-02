import React, { useState } from 'react';
import TimetableView from '../components/TimetableView';

const TimetablePage: React.FC = () => {
  const [timetable, setTimetable] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLatest = async () => {
    setLoading(true);
    setError(null);

    // Use environment variable for API base, fall back to localhost:5000
    const API_BASE = (process.env.REACT_APP_API_BASE_URL as string) || 'http://localhost:5000';
    const url = `${API_BASE}/api/timetables/latest`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch timetable: ${res.status} ${res.statusText} - ${text.substring(0,200)}`);
      }

      // Try parse JSON safely
      const contentType = res.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        // response is not JSON (likely HTML) - surface that to help debugging
        const text = await res.text();
        throw new Error(`Unexpected response (not JSON): ${text.substring(0,300)}`);
      }

      // normalize structure if necessary
      if (data.timetable) {
        setTimetable(data.timetable);
      } else if (data.timetable_json) {
        setTimetable(JSON.parse(data.timetable_json));
      } else {
        setTimetable(data);
      }
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Timetable Viewer</h2>
      <div style={{ marginBottom: 12 }}>
        <button onClick={loadLatest} disabled={loading}>{loading ? 'Loading...' : 'Load Latest Timetable'}</button>
      </div>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <TimetableView timetable={timetable} />
    </div>
  );
};

export default TimetablePage;
