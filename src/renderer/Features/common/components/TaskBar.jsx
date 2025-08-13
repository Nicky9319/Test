import React from 'react';

const TaskBar = () => {
  const handleClose = () => {
    window.electronAPI.closeApp();
  };

  const handleMinimize = () => {
    window.electronAPI.minimizeApp();
  };

  const handleMaximize = () => {
    window.electronAPI.maximizeApp();
  };

  return (
    <div className="task-bar">
      <div className="task-bar-drag-area">
        <div className="app-title">DonnaDesk</div>
      </div>
      <div className="window-controls">
        <button 
          className="window-control minimize-btn" 
          onClick={handleMinimize}
          title="Minimize"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="2" y="5" width="8" height="2" fill="currentColor"/>
          </svg>
        </button>
        <button 
          className="window-control maximize-btn" 
          onClick={handleMaximize}
          title="Maximize"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1"/>
          </svg>
        </button>
        <button 
          className="window-control close-btn" 
          onClick={handleClose}
          title="Close"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TaskBar;
