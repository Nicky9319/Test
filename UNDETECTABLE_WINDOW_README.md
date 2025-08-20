# AgentBed Undetectable Window System

This implementation provides a sophisticated undetectable window system similar to Cluely's approach, with comprehensive screen recording protection and overlay functionality.

## 🚀 Features

### 1. **Screen Recording Protection**
- **Content Protection**: Uses Electron's `setContentProtection(true)` to prevent screen recording
- **Undetectable Mode**: Hides window from screenshots and screen sharing applications
- **Taskbar Hiding**: Optionally hides from Windows taskbar
- **Mission Control Hiding**: Hides from macOS Mission Control

### 2. **Mouse Event Management**
- **Click-Through Mode**: Makes window transparent to mouse events
- **Selective Interaction**: Can enable/disable mouse interaction as needed
- **Event Forwarding**: Forwards mouse events to underlying applications

### 3. **Multi-Display Overlay System**
- **Display Detection**: Automatically detects all connected displays
- **Overlay Windows**: Creates semi-transparent overlays on other displays
- **Click-to-Switch**: Click overlays to move the main window to that display
- **Visual Feedback**: Hover and highlight effects on overlays

### 4. **Screenshot Functionality**
- **Protected Screenshots**: Captures screenshots while maintaining content protection
- **Platform Support**: Works on macOS and Windows
- **Permission Handling**: Requests screen recording permissions when needed

### 5. **Global Shortcuts**
- **Development Shortcuts**: Built-in shortcuts for development mode
- **Custom Shortcuts**: Register custom global shortcuts
- **Undetectability Toggle**: Quick toggle for undetectable mode

## 🛠️ Implementation Details

### Window Configuration

```javascript
// Undetectable window settings
{
  show: isWindows, // Show immediately on Windows for undetectability
  type: "panel", // Special window type
  alwaysOnTop: true,
  transparent: true,
  frame: false,
  roundedCorners: false,
  hasShadow: false,
  fullscreenable: false,
  minimizable: false,
  hiddenInMissionControl: true, // macOS
  skipTaskbar: undetectabilityEnabled, // Windows
}
```

### Content Protection

```javascript
// Enable content protection
this.window.setContentProtection(true);

// Make window invisible to screen recorders
this.window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
```

### Mouse Event Control

```javascript
// Ignore mouse events (click-through)
this.window.setIgnoreMouseEvents(true, { forward: true });

// Allow mouse interaction
this.window.setIgnoreMouseEvents(false);
```

## 📱 Usage

### Basic Controls

```javascript
// Toggle undetectable mode
await window.electronAPI.toggleUndetectability();

// Toggle click-through
await window.electronAPI.setClickThrough(true/false);

// Show display overlays
await window.electronAPI.showDisplayOverlays();

// Hide display overlays
await window.electronAPI.hideDisplayOverlays();

// Capture screenshot
const screenshot = await window.electronAPI.captureScreenshot();
```

### Display Management

```javascript
// Get available displays
const displays = await window.electronAPI.getAvailableDisplays();

// Move to specific display
await window.electronAPI.moveToDisplay(displayId);

// Highlight specific display overlay
await window.electronAPI.highlightDisplay(displayId);
```

### Event Listeners

```javascript
// Listen for display changes
window.windowEvents.onDisplayChanged((data) => {
  console.log('Display changed:', data);
});

// Listen for global shortcuts
window.windowEvents.onGlobalShortcutTriggered((data) => {
  console.log('Shortcut triggered:', data.accelerator);
});
```

## 🎮 Demo Interface

Access the demo interface at: `http://localhost:5173/#/undetectable-demo`

The demo provides:
- **Status Panel**: Shows current window state
- **Control Buttons**: Toggle all features
- **Display List**: View and switch between displays
- **Screenshot Viewer**: View captured screenshots
- **Instructions**: Usage guidelines

## 🔧 Development

### Global Shortcuts (Development Mode)

- `Cmd/Ctrl + Alt + Shift + I`: Toggle undetectability
- `Cmd/Ctrl + Alt + R`: Reload window
- `Cmd/Ctrl + Alt + I`: Toggle DevTools

### Custom Shortcuts

```javascript
// Register custom shortcut
await window.electronAPI.registerGlobalShortcut('CommandOrControl+Alt+S');

// Unregister shortcut
await window.electronAPI.unregisterGlobalShortcut('CommandOrControl+Alt+S');
```

## 🏗️ Architecture

### Window Classes

1. **UndetectableWindow**: Main application window with undetectability features
2. **DisplayOverlay**: Individual overlay windows for each display
3. **DisplayOverlayManager**: Manages all overlay windows

### Key Components

- **main.js**: Main process with window management
- **preload.js**: Enhanced preload script with new APIs
- **overlay.html**: Overlay window interface
- **UndetectableWindowDemo.jsx**: React demo component

## 🔒 Security Features

### Screen Recording Protection
- Content protection prevents screen recording
- Window is hidden from screen sharing applications
- Screenshots exclude the window when undetectable

### Mouse Event Security
- Click-through mode prevents accidental interaction
- Selective event forwarding maintains functionality
- Overlay system provides safe display switching

## 🌐 Platform Support

### macOS
- Content protection via `setContentProtection`
- Mission Control hiding
- Screen recording permission handling

### Windows
- Taskbar hiding
- Panel window type for undetectability
- Hardware acceleration considerations

### Linux
- Basic support (may need additional configuration)

## 🚨 Important Notes

1. **Permissions**: Screen recording requires user permission on macOS
2. **Development**: Some features only work in development mode
3. **Performance**: Content protection may impact performance
4. **Compatibility**: Not all screen recording software can be completely avoided

## 🔄 Migration from Original

The original window system has been completely replaced with the undetectable system. Key changes:

- Single window architecture with enhanced features
- Comprehensive display management
- Built-in overlay system
- Enhanced security features
- Improved user experience

## 📝 API Reference

### Window Controls
- `toggleUndetectability()`: Toggle undetectable mode
- `setClickThrough(boolean)`: Enable/disable click-through
- `enableInteraction()`: Enable mouse interaction
- `disableInteraction()`: Disable mouse interaction

### Display Management
- `getAvailableDisplays()`: Get all displays
- `moveToDisplay(displayId, options)`: Move to display
- `showDisplayOverlays()`: Show overlays
- `hideDisplayOverlays()`: Hide overlays

### Screenshots
- `captureScreenshot()`: Capture current display
- `requestMediaPermission(type)`: Request permissions

### Events
- `onDisplayChanged(callback)`: Display change events
- `onAvailableDisplays(callback)`: Display list updates
- `onGlobalShortcutTriggered(callback)`: Shortcut events

This implementation provides a production-ready undetectable window system with all the features found in professional applications like Cluely.
