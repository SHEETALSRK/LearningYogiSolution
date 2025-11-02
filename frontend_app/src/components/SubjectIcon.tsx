import React from 'react';

interface SubjectIconProps {
  subject: string;
}

const SubjectIcon: React.FC<SubjectIconProps> = ({ subject }) => {
  const getIcon = (subject: string): string => {
    const s = subject.toLowerCase();
    if (s.includes('maths') || s.includes('math')) return '📐';
    if (s.includes('english')) return '📚';
    if (s.includes('science')) return '🔬';
    if (s.includes('computing')) return '💻';
    if (s.includes('pe') || s.includes('physical')) return '⚽';
    if (s.includes('music')) return '🎵';
    if (s.includes('history')) return '📜';
    if (s.includes('re') || s.includes('religious')) return '🕊️';
    if (s.includes('art')) return '🎨';
    if (s.includes('assembly')) return '👥';
    if (s.includes('break') || s.includes('lunch')) return '☕';
    return '📖';
  };

  return <span className="subject-icon">{getIcon(subject)}</span>;
};

export default SubjectIcon;