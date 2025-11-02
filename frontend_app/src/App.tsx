import React from 'react';
import './App.css';
import FileUpload from './components/FileUpload';
import TimetablePage from './pages/TimetablePage';
import TimetableDesignPage from './pages/TimetableDesignPage';
import { useState } from 'react';

function App() {
  const [view, setView] = useState<'upload' | 'design'>('upload');

  return (
    <div className="App">
      <header className="App-header">
        <h1>BrainMo Timetable</h1>
        <div>
          <button 
            onClick={() => setView('upload')} 
            className={view === 'upload' ? 'active' : ''}
          >
            Upload / Preview
          </button>
          <button 
            onClick={() => setView('design')} 
            className={view === 'design' ? 'active' : ''}
          >
            My timetable
          </button>
        </div>
      </header>
      <main>
        {view === 'upload' ? (
          <div className="view-container">
            <FileUpload />
          </div>
        ) : (
          <TimetableDesignPage />
        )}
      </main>
    </div>
  );
}

export default App;
