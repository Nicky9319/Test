import React, { useState, useEffect } from 'react';

const TestUndetectableFeatures = () => {
  const [testResults, setTestResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    const results = {};

    try {
      // Test 1: Check if electronAPI is available
      console.log('Testing electronAPI availability...');
      results.electronAPI = !!window.electronAPI;
      console.log('electronAPI available:', results.electronAPI);

      // Test 2: Check if windowEvents is available
      console.log('Testing windowEvents availability...');
      results.windowEvents = !!window.windowEvents;
      console.log('windowEvents available:', results.windowEvents);

      // Test 3: Test getAvailableDisplays
      console.log('Testing getAvailableDisplays...');
      try {
        const displays = await window.electronAPI.getAvailableDisplays();
        results.getAvailableDisplays = Array.isArray(displays) && displays.length > 0;
        console.log('Displays found:', displays.length);
      } catch (error) {
        results.getAvailableDisplays = false;
        console.error('getAvailableDisplays failed:', error);
      }

      // Test 4: Test toggleUndetectability
      console.log('Testing toggleUndetectability...');
      try {
        const result = await window.electronAPI.toggleUndetectability();
        results.toggleUndetectability = typeof result === 'boolean';
        console.log('Undetectability toggled:', result);
      } catch (error) {
        results.toggleUndetectability = false;
        console.error('toggleUndetectability failed:', error);
      }

      // Test 5: Test setClickThrough
      console.log('Testing setClickThrough...');
      try {
        await window.electronAPI.setClickThrough(true);
        results.setClickThrough = true;
        console.log('Click-through enabled');
      } catch (error) {
        results.setClickThrough = false;
        console.error('setClickThrough failed:', error);
      }

      // Test 6: Test showDisplayOverlays
      console.log('Testing showDisplayOverlays...');
      try {
        await window.electronAPI.showDisplayOverlays();
        results.showDisplayOverlays = true;
        console.log('Display overlays shown');
        
        // Hide overlays after a short delay
        setTimeout(async () => {
          try {
            await window.electronAPI.hideDisplayOverlays();
            console.log('Display overlays hidden');
          } catch (error) {
            console.error('hideDisplayOverlays failed:', error);
          }
        }, 2000);
      } catch (error) {
        results.showDisplayOverlays = false;
        console.error('showDisplayOverlays failed:', error);
      }

      // Test 7: Test captureScreenshot
      console.log('Testing captureScreenshot...');
      try {
        const screenshot = await window.electronAPI.captureScreenshot();
        results.captureScreenshot = !!screenshot && !!screenshot.data;
        console.log('Screenshot captured:', !!screenshot);
      } catch (error) {
        results.captureScreenshot = false;
        console.error('captureScreenshot failed:', error);
      }

             // Test 8: Test requestMediaPermission
       console.log('Testing requestMediaPermission...');
       try {
         const permission = await window.electronAPI.requestMediaPermission('screen');
         results.requestMediaPermission = typeof permission === 'boolean';
         console.log('Screen permission:', permission);
       } catch (error) {
         results.requestMediaPermission = false;
         console.error('requestMediaPermission failed:', error);
       }

       // Test 9: Test fullscreen functionality
       console.log('Testing fullscreen functionality...');
       try {
         const isFullscreen = await window.electronAPI.isFullscreen();
         results.fullscreen = typeof isFullscreen === 'boolean';
         console.log('Fullscreen status:', isFullscreen);
       } catch (error) {
         results.fullscreen = false;
         console.error('fullscreen test failed:', error);
       }

    } catch (error) {
      console.error('Test suite failed:', error);
    }

    setTestResults(results);
    setIsLoading(false);
  };

  useEffect(() => {
    // Run tests automatically on component mount
    runTests();
  }, []);

  const getStatusColor = (passed) => {
    return passed ? 'text-green-500' : 'text-red-500';
  };

  const getStatusIcon = (passed) => {
    return passed ? '✅' : '❌';
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-center">Undetectable Window Feature Tests</h1>
      
      {isLoading && (
        <div className="text-center mb-6">
          <div className="text-blue-400">Running tests...</div>
        </div>
      )}

      <div className="space-y-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Test Results</h2>
          <div className="space-y-2">
            {Object.entries(testResults).map(([testName, passed]) => (
              <div key={testName} className="flex items-center justify-between">
                <span className="capitalize">{testName.replace(/([A-Z])/g, ' $1').trim()}:</span>
                <span className={`font-mono ${getStatusColor(passed)}`}>
                  {getStatusIcon(passed)} {passed ? 'PASS' : 'FAIL'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Manual Tests</h2>
          <div className="space-y-2">
            <button
              onClick={() => window.electronAPI.toggleUndetectability()}
              className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
            >
              Toggle Undetectability
            </button>
            <button
              onClick={() => window.electronAPI.showDisplayOverlays()}
              className="w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition-colors"
            >
              Show Display Overlays
            </button>
            <button
              onClick={() => window.electronAPI.hideDisplayOverlays()}
              className="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition-colors"
            >
              Hide Display Overlays
            </button>
                         <button
               onClick={() => window.electronAPI.setClickThrough(!testResults.setClickThrough)}
               className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded transition-colors"
             >
               Toggle Click-Through
             </button>
             <button
               onClick={() => window.electronAPI.toggleFullscreen()}
               className="w-full bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded transition-colors"
             >
               Toggle Fullscreen
             </button>
          </div>
        </div>

                 <div className="bg-gray-800 rounded-lg p-4">
           <h2 className="text-lg font-semibold mb-3">Global Shortcuts</h2>
           <div className="text-sm text-gray-300 space-y-1">
             <p>• <code>Cmd/Ctrl + Alt + Shift + I</code>: Toggle undetectability</p>
             <p>• <code>Cmd/Ctrl + Alt + F</code>: Toggle fullscreen</p>
             <p>• <code>Cmd/Ctrl + Alt + R</code>: Reload window</p>
             <p>• <code>Cmd/Ctrl + Alt + I</code>: Toggle DevTools</p>
           </div>
         </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Debug Info</h2>
          <div className="text-sm text-gray-300 space-y-1">
            <p>• Platform: {window.electron?.process?.platform || 'Unknown'}</p>
            <p>• Environment: {window.electron?.process?.env?.NODE_ENV || 'Unknown'}</p>
            <p>• electronAPI: {window.electronAPI ? 'Available' : 'Not Available'}</p>
            <p>• windowEvents: {window.windowEvents ? 'Available' : 'Not Available'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestUndetectableFeatures;
