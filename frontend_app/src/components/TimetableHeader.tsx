import React from 'react';
import './TimetableHeader.css';

interface TimetableHeaderProps {
  timetable: any;
  currentWeek: string;
  onRefresh: () => void;
  weekOffset: number;
  onWeekChange: (offset: number) => void;
}

const TimetableHeader: React.FC<TimetableHeaderProps> = ({ 
  timetable, 
  currentWeek, 
  onRefresh, 
  weekOffset, 
  onWeekChange 
}) => {
  const getCurrentMonthYear = () => {
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + (weekOffset * 7));
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[targetDate.getMonth()]} ${targetDate.getFullYear()}`;
  };

  const handlePreviousWeek = () => {
    onWeekChange(weekOffset - 1);
  };

  const handleNextWeek = () => {
    onWeekChange(weekOffset + 1);
  };

  const handleViewToday = () => {
    onWeekChange(0);
  };

  return (
    <div className="timetable-header">
      <div className="header-left">
        <h1>BrainMo</h1>
        <div className="week-nav">
          <button className="nav-button" onClick={handlePreviousWeek}>&lt;</button>
          <div className="week-info">
            <span className="week-term">{getCurrentMonthYear()}</span>
            <span className="week-label">Autumn 1 / {currentWeek}</span>
          </div>
          <button className="nav-button" onClick={handleNextWeek}>&gt;</button>
          <button className="view-today" onClick={handleViewToday}>View Today</button>
        </div>
      </div>
      <div className="header-right">
        <button className="ready-button">
          <span className="crown-icon">👑</span>
          Save! I'm Ready for Class!
        </button>
        <button className="profile-button">👤</button>
      </div>
    </div>
  );
};

export default TimetableHeader;