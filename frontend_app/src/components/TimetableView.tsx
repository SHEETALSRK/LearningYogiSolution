import React from 'react';
import './TimetableView.css';

type Slot = {
  time: string;
  subject: string;
  notes?: string;
};

type Timetable = {
  class?: string;
  term?: string;
  teacher?: string;
  days: Record<string, Slot[]>;
};

const TimetableView: React.FC<{ timetable: Timetable | null }> = ({ timetable }) => {
  if (!timetable) return <div>No timetable data available.</div>;

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <div className="timetable-container">
      <div className="timetable-header">
        <div className="meta">
          <h2>{timetable.class || 'Class'}</h2>
          <div>{timetable.term || ''}</div>
          <div>{timetable.teacher || ''}</div>
        </div>
      </div>

      <div className="timetable-grid">
        {days.map((day) => (
          <div key={day} className="timetable-day">
            <h3>{day}</h3>
            <div className="slots">
              {(timetable.days?.[day] || []).map((slot, i) => (
                <div key={i} className="slot-card">
                  <div className="slot-time">{slot.time}</div>
                  <div className="slot-subject">{slot.subject}</div>
                  {slot.notes && <div className="slot-notes">{slot.notes}</div>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimetableView;
