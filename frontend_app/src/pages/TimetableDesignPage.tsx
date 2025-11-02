import React, { useEffect, useState } from 'react';
import './TimetableDesignPage.css';
import TimetableHeader from '../components/TimetableHeader';
import SubjectIcon from '../components/SubjectIcon';
import Sidebar from '../components/Sidebar';

type Slot = { time?: string; subject?: string; notes?: string };
type Timetable = { class?: string; term?: string; teacher?: string; days: Record<string, Slot[]> };

function parseTimePart(t: string) {
  // Accept formats like "8:35", "1:15", optionally with am/pm
  const m = t.trim().toLowerCase();
  const ampm = m.match(/(am|pm)$/);
  let part = m.replace(/(am|pm)$/, '').trim();
  const [hStr, minStr] = part.split(':');
  let h = Number(hStr);
  const min = Number(minStr || '0');
  if (ampm) {
    if (ampm[1] === 'pm' && h < 12) h += 12;
    if (ampm[1] === 'am' && h === 12) h = 0;
  } else {
    // no am/pm: assume school times, convert 1-7 to afternoon (13-19)
    if (h >= 1 && h <= 7) h += 12;
  }
  return h * 60 + min;
}

function parseRange(range?: string) {
  if (!range) return null;
  // formats: "8:35-9:00" or "9:00 - 10:15"
  const parts = range.split('-').map((p) => p.trim());
  if (parts.length < 2) return null;
  try {
    const start = parseTimePart(parts[0]);
    const end = parseTimePart(parts[1]);
    return { start, end };
  } catch (e) {
    return null;
  }
}

const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const TimetableDesignPage: React.FC = () => {
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = previous week, 1 = next week

  useEffect(() => {
    loadLatest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadLatest = async () => {
    setLoading(true);
    setError(null);
    try {
      const API_BASE = (process.env.REACT_APP_API_BASE_URL as string) || 'http://localhost:5000';
      const res = await fetch(`${API_BASE}/api/timetables/latest`);
      if (!res.ok) throw new Error('Failed to fetch timetable');
      const data = await res.json();
      let parsed = null as any;
      if (data.timetable) parsed = data.timetable;
      else if (data.timetable_json) parsed = JSON.parse(data.timetable_json);
      else parsed = data;
      
      // Log the data to see what we're working with
      console.log('Timetable data:', parsed);
      if (parsed && parsed.days) {
        console.log('Monday slots:', parsed.days.Monday);
      }
      
      setTimetable(parsed);
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  // Use fixed time range to match the grid display
  const minMinute = 8 * 60; // 8:00 AM
  const maxMinute = 15 * 60; // 3:00 PM
  const totalMinutes = maxMinute - minMinute; // 7 hours = 420 minutes

  const subjectColorMap: Record<string, { color: string, background: string }> = {
    maths: { color: '#9254de', background: '#f9f0ff' },
    math: { color: '#9254de', background: '#f9f0ff' },
    english: { color: '#d46b08', background: '#fff7e6' },
    science: { color: '#d4b106', background: '#feffe6' },
    computing: { color: '#d48806', background: '#fff7e6' },
    pe: { color: '#389e0d', background: '#f6ffed' },
    music: { color: '#08979c', background: '#e6fffb' },
    history: { color: '#1d39c4', background: '#f0f5ff' },
    re: { color: '#531dab', background: '#f9f0ff' },
    art: { color: '#096dd9', background: '#e6f7ff' },
    assembly: { color: '#c41d7f', background: '#fff0f6' },
    break: { color: '#666666', background: '#f5f5f5' },
    lunch: { color: '#666666', background: '#f5f5f5' },
    default: { color: '#595959', background: '#fafafa' },
  };

  function colorForSubject(subject?: string) {
    if (!subject) return subjectColorMap.default;
    const s = subject.toLowerCase();
    for (const key of Object.keys(subjectColorMap)) {
      if (key !== 'default' && s.includes(key)) return subjectColorMap[key as keyof typeof subjectColorMap];
    }
    return subjectColorMap.default;
  }

  const timeSlots = Array.from({ length: 17 }, (_, i) => {
    const hour = 8 + Math.floor(i / 2);
    const minutes = i % 2 === 0 ? "00" : "30";
    return `${hour}:${minutes}`;
  });

  const getCurrentDay = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNames[dayOfWeek];
  };

  const getDayDate = (dayName: string) => {
    // Get current date and find Monday of the target week (current week + offset)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Get to Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset + (weekOffset * 7)); // Add week offset
    
    // Map day names to offsets from Monday
    const dayOffsets: Record<string, number> = {
      'Monday': 0,
      'Tuesday': 1,
      'Wednesday': 2,
      'Thursday': 3,
      'Friday': 4
    };
    
    const offset = dayOffsets[dayName] || 0;
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + offset);
    
    return String(targetDate.getDate()).padStart(2, '0');
  };

  const getCurrentWeekNumber = () => {
    const today = new Date();
    today.setDate(today.getDate() + (weekOffset * 7)); // Add week offset
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const days = Math.floor((today.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  };

  const handleWeekChange = (newOffset: number) => {
    setWeekOffset(newOffset);
  };

  const timePoints = [
    '8:00', '8:30', '9:00', '9:30', '10:00', '10:30', '11:00', 
    '11:30', '12:00', '1:00', '1:30', '2:00', '2:30', '3:00'
  ];

  const getEmptySlots = (day: string) => {
    const slots = timetable?.days?.[day] || [];
    const emptySlots = [];
    let currentTime = minMinute;

    slots.forEach((slot) => {
      const r = parseRange(slot.time);
      if (r && r.start > currentTime) {
        emptySlots.push({ start: currentTime, end: r.start });
      }
      if (r) {
        currentTime = r.end;
      }
    });

    if (currentTime < maxMinute) {
      emptySlots.push({ start: currentTime, end: maxMinute });
    }

    return emptySlots;
  };

  return (
    <div className="design-page-root">
      <TimetableHeader
        timetable={timetable}
        currentWeek={`Week ${getCurrentWeekNumber()}`}
        onRefresh={loadLatest}
        weekOffset={weekOffset}
        onWeekChange={handleWeekChange}
      />

      <Sidebar position="left" />
      <Sidebar position="right" />

      {error && <div className="design-error">{error}</div>}

      <div className="design-calendar">
        <div className="days-grid">
          {/* Empty top-left corner */}
          <div className="time-column"></div>

          {/* Horizontal time markers at the top */}
          <div className="time-header-row">
            {timePoints.map((time) => {
              // Parse time and calculate position
              const parsed = parseTimePart(time);
              const positionPercent = ((parsed - minMinute) / totalMinutes) * 100;
              return (
                <div 
                  key={time} 
                  className="time-point"
                  style={{ left: `${positionPercent}%` }}
                >
                  {time}
                </div>
              );
            })}
          </div>

          {/* Day labels on the left */}
          <div className="day-labels">
            {daysOrder.map((day) => (
              <div key={`label-${day}`} className="day-label">
                <div className="day-date">{getDayDate(day)}</div>
                <div className="day-name">{day.substring(0, 3)}</div>
                {day === getCurrentDay() && <div className="today-marker">Today</div>}
              </div>
            ))}
          </div>

          {/* Day rows container */}
          <div className="days-container">
            {/* Vertical grid lines */}
            <div className="timeline">
              {timePoints.map((time) => {
                const parsed = parseTimePart(time);
                const positionPercent = ((parsed - minMinute) / totalMinutes) * 100;
                return (
                  <div 
                    key={`grid-${time}`} 
                    className="timeline-col"
                    style={{ left: `${positionPercent}%` }}
                  />
                );
              })}
            </div>

            {daysOrder.map((day, dayIndex) => (
              <div key={`row-${day}`} className="day-row">
                <div className="day-column">
                  {/* Actual timetable slots */}
                  {(timetable?.days?.[day] || []).map((slot, idx) => {
                    const r = parseRange(slot.time);
                    let style: React.CSSProperties = {};
                    if (r) {
                      // Calculate horizontal position based on time
                      const totalWidth = 100; // percentage
                      const startPercent = ((r.start - minMinute) / totalMinutes) * totalWidth;
                      const widthPercent = ((r.end - r.start) / totalMinutes) * totalWidth;
                      
                      console.log(`Slot: ${slot.subject}, Time: ${slot.time}`);
                      console.log(`  r.start=${r.start}, r.end=${r.end}, minMinute=${minMinute}, totalMinutes=${totalMinutes}`);
                      console.log(`  Calculated: left=${startPercent}%, width=${widthPercent}%`);
                      
                      // Stack overlapping slots vertically
                      // Check if this slot overlaps with previous slots
                      let verticalOffset = 0;
                      const daySlots = timetable?.days?.[day] || [];
                      for (let i = 0; i < idx; i++) {
                        const prevSlot = daySlots[i];
                        const prevRange = parseRange(prevSlot.time);
                        if (prevRange && r) {
                          // Check for overlap
                          if (!(r.end <= prevRange.start || r.start >= prevRange.end)) {
                            verticalOffset += 50; // Stack 50% down for each overlap
                          }
                        }
                      }
                      
                      style = {
                        left: `${startPercent}%`,
                        width: `${widthPercent}%`,
                        top: `${4 + verticalOffset}%`,
                        height: `${Math.min(84, 100 - verticalOffset - 8)}%`, // Adjust height based on offset
                      };
                    }
                    const bg = colorForSubject(slot.subject);
                    const durationMins = r ? Math.round((r.end - r.start)) : 0;
                    
                    // Determine if the slot is narrow (less than 5% width or less than 50 pixels equivalent)
                    // But don't rotate if subject name is too long (more than 30 characters)
                    const widthPercent = r ? ((r.end - r.start) / totalMinutes) * 100 : 0;
                    const subjectLength = slot.subject?.length || 0;
                    const isNarrow = widthPercent < 5 && subjectLength <= 30;

                    return (
                      <div className="design-slot" key={idx} style={style}>
                        <div className="slot-accent" style={{ background: bg.color }} />
                        <div className={`slot-content ${isNarrow ? 'narrow' : ''}`} style={{ background: bg.background }}>
                          <div className="slot-subject" style={{ color: bg.color }}>
                            <span className="slot-subject-text">{slot.subject}</span>
                          </div>
                          <div className="slot-duration">{durationMins}min</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableDesignPage;
