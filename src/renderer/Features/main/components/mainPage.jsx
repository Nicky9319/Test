import React from 'react'
import HoverComponent from '../../common/components/HoverComponent'
import ClickThroughTestComponent from './ClickThroughTestComponent'

const MainPage = () => {
  return (
    <div className="main-page">
      <HoverComponent>
        <h1>Main Page</h1>
        <p>Welcome to the main page!</p>
        
        {/* Test content to verify click interaction */}
        <div style={{ marginTop: '20px' }}>
          <p>This is content on the main screen for testing click interaction.</p>
          <button 
            onClick={() => alert('Main screen button clicked!')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',  
              cursor: 'pointer'
            }}
          >
            Main Screen Button
          </button>
        </div>
      </HoverComponent>

      {/* Click-through test component */}
      <ClickThroughTestComponent />
    </div>
  );
};

export default MainPage
