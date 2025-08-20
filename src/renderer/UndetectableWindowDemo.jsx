import React, { useState, useEffect } from 'react';

const UndetectableWindowDemo = () => {
  const [displays, setDisplays] = useState([]);
  const [isUndetectable, setIsUndetectable] = useState(false);
  const [isClickThrough, setIsClickThrough] = useState(true);
  const [overlaysActive, setOverlaysActive] = useState(false);
  const [screenshotData, setScreenshotData] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Load available displays on component mount
    loadDisplays();

    // Check initial fullscreen state
    checkFullscreenState();

    // Set up event listeners
    if (window.windowEvents) {
      window.windowEvents.onAvailableDisplays((data) => {
        setDisplays(data.displays);
      });

      window.windowEvents.onDisplayChanged((data) => {
        console.log('Display changed:', data);
        loadDisplays();
      });

      window.windowEvents.onGlobalShortcutTriggered((data) => {
        console.log('Global shortcut triggered:', data);
        if (data.accelerator === 'CommandOrControl+Alt+Shift+I') {
          toggleUndetectability();
        }
      });
    }
  }, []);

  const loadDisplays = async () => {
    try {
      const displaysData = await window.electronAPI.getAvailableDisplays();
      setDisplays(displaysData);
    } catch (error) {
      console.error('Failed to load displays:', error);
    }
  };

  const toggleUndetectability = async () => {
    try {
      const newState = await window.electronAPI.toggleUndetectability();
      setIsUndetectable(newState);
      console.log('Undetectability toggled:', newState);
    } catch (error) {
      console.error('Failed to toggle undetectability:', error);
    }
  };

  const toggleClickThrough = async () => {
    try {
      const newState = !isClickThrough;
      await window.electronAPI.setClickThrough(newState);
      setIsClickThrough(newState);
      console.log('Click-through toggled:', newState);
    } catch (error) {
      console.error('Failed to toggle click-through:', error);
    }
  };

  const moveToDisplay = async (displayId) => {
    try {
      await window.electronAPI.moveToDisplay(displayId);
      console.log('Moved to display:', displayId);
    } catch (error) {
      console.error('Failed to move to display:', error);
    }
  };

  const showOverlays = async () => {
    try {
      await window.electronAPI.showDisplayOverlays();
      setOverlaysActive(true);
      console.log('Display overlays shown');
    } catch (error) {
      console.error('Failed to show overlays:', error);
    }
  };

  const hideOverlays = async () => {
    try {
      await window.electronAPI.hideDisplayOverlays();
      setOverlaysActive(false);
      console.log('Display overlays hidden');
    } catch (error) {
      console.error('Failed to hide overlays:', error);
    }
  };

  const captureScreenshot = async () => {
    try {
      const result = await window.electronAPI.captureScreenshot();
      setScreenshotData(result);
      console.log('Screenshot captured');
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
    }
  };

  const requestScreenPermission = async () => {
    try {
      const granted = await window.electronAPI.requestMediaPermission('screen');
      console.log('Screen permission granted:', granted);
    } catch (error) {
      console.error('Failed to request screen permission:', error);
    }
  };

  const registerShortcut = async () => {
    try {
      await window.electronAPI.registerGlobalShortcut('CommandOrControl+Alt+S');
      console.log('Global shortcut registered: Cmd/Ctrl+Alt+S');
    } catch (error) {
      console.error('Failed to register shortcut:', error);
    }
  };

  const checkFullscreenState = async () => {
    try {
      const fullscreen = await window.electronAPI.isFullscreen();
      setIsFullscreen(fullscreen);
    } catch (error) {
      console.error('Failed to check fullscreen state:', error);
    }
  };

  const toggleFullscreen = async () => {
    try {
      const newState = await window.electronAPI.toggleFullscreen();
      setIsFullscreen(newState);
      console.log('Fullscreen toggled:', newState);
    } catch (error) {
      console.error('Failed to toggle fullscreen:', error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center">AgentBed Undetectable Window Demo</h1>
      
      {/* Status Section */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Window Status</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <span>Undetectable Mode:</span>
            <span className={`px-3 py-1 rounded ${isUndetectable ? 'bg-green-600' : 'bg-red-600'}`}>
              {isUndetectable ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Click-Through:</span>
            <span className={`px-3 py-1 rounded ${isClickThrough ? 'bg-green-600' : 'bg-red-600'}`}>
              {isClickThrough ? 'Enabled' : 'Disabled'}
            </span>
          </div>
                     <div className="flex items-center justify-between">
             <span>Overlays Active:</span>
             <span className={`px-3 py-1 rounded ${overlaysActive ? 'bg-green-600' : 'bg-red-600'}`}>
               {overlaysActive ? 'Active' : 'Inactive'}
             </span>
           </div>
           <div className="flex items-center justify-between">
             <span>Fullscreen:</span>
             <span className={`px-3 py-1 rounded ${isFullscreen ? 'bg-green-600' : 'bg-red-600'}`}>
               {isFullscreen ? 'Enabled' : 'Disabled'}
             </span>
           </div>
           <div className="flex items-center justify-between">
             <span>Available Displays:</span>
             <span className="px-3 py-1 rounded bg-blue-600">
               {displays.length}
             </span>
           </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Window Controls</h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={toggleUndetectability}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
          >
            Toggle Undetectability
          </button>
          <button
            onClick={toggleClickThrough}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded transition-colors"
          >
            Toggle Click-Through
          </button>
          <button
            onClick={showOverlays}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition-colors"
          >
            Show Display Overlays
          </button>
          <button
            onClick={hideOverlays}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition-colors"
          >
            Hide Display Overlays
          </button>
          <button
            onClick={captureScreenshot}
            className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded transition-colors"
          >
            Capture Screenshot
          </button>
                     <button
             onClick={requestScreenPermission}
             className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded transition-colors"
           >
             Request Screen Permission
           </button>
           <button
             onClick={toggleFullscreen}
             className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded transition-colors"
           >
             Toggle Fullscreen
           </button>
        </div>
      </div>

      {/* Displays Section */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Available Displays</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displays.map((display) => (
            <div
              key={display.id}
              className={`p-4 rounded-lg border-2 transition-colors ${
                display.current
                  ? 'border-green-500 bg-green-900/20'
                  : 'border-gray-600 bg-gray-700/20'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">{display.label}</h3>
                <div className="flex gap-2">
                  {display.primary && (
                    <span className="px-2 py-1 text-xs bg-blue-600 rounded">Primary</span>
                  )}
                  {display.current && (
                    <span className="px-2 py-1 text-xs bg-green-600 rounded">Current</span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-300 mb-2">
                Resolution: {display.bounds.width} × {display.bounds.height}
              </p>
              <p className="text-sm text-gray-300 mb-3">
                Position: ({display.bounds.x}, {display.bounds.y})
              </p>
              {!display.current && (
                <button
                  onClick={() => moveToDisplay(display.id)}
                  className="w-full bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm transition-colors"
                >
                  Move to This Display
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Screenshot Section */}
      {screenshotData && (
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Screenshot</h2>
          <div className="bg-gray-700 rounded-lg p-4">
            <img
              src={`data:${screenshotData.contentType};base64,${Buffer.from(screenshotData.data).toString('base64')}`}
              alt="Screenshot"
              className="max-w-full h-auto rounded border border-gray-600"
            />
          </div>
        </div>
      )}

      {/* Instructions Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Instructions</h2>
        <div className="space-y-2 text-sm text-gray-300">
          <p>• <strong>Undetectable Mode:</strong> Hides the window from screen recorders and screenshots</p>
          <p>• <strong>Click-Through:</strong> Makes the window transparent to mouse events</p>
          <p>• <strong>Display Overlays:</strong> Shows clickable overlays on other displays for easy switching</p>
          <p>• <strong>Global Shortcuts:</strong> Use Cmd/Ctrl+Alt+Shift+I to toggle undetectability</p>
          <p>• <strong>Screenshots:</strong> Captures the current display (requires screen permission)</p>
        </div>
      </div>
    </div>
  );
};

export default UndetectableWindowDemo;
