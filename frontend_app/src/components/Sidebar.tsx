import React from 'react';
import './Sidebar.css';

interface SidebarProps {
  position: 'left' | 'right';
}

const Sidebar: React.FC<SidebarProps> = ({ position }) => {
  return (
    <div className={`sidebar ${position}`}>
      {position === 'left' ? (
        <>
          <button className="sidebar-button back">⬅</button>
          <button className="sidebar-button refresh">↻</button>
          <button className="sidebar-button menu">≡</button>
        </>
      ) : (
        <>
          <button className="sidebar-button menu">☰</button>
          <button className="sidebar-button delete">🗑</button>
        </>
      )}
    </div>
  );
};

export default Sidebar;