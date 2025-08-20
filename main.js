// Imports and modules !!! ---------------------------------------------------------------------------------------------------

import { app, shell, BrowserWindow, ipcMain, globalShortcut, contextBridge, screen, desktopCapturer, systemPreferences, protocol, net, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from './resources/icon.png?asset'

const {spawn, exec} = require('child_process');
const fs = require('fs');
const path = require('path');
const {autoUpdater, AppUpdater} = require('electron-differential-updater');
const log = require('electron-log');
const {os} = require('os');
const {url} = require('inspector');
const Docker = require('dockerode');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

import { initDb, getAgentsInfo, addAgentInfo, updateAgentEnvVariable} from './db/db.js';
import dotenv from 'dotenv';
dotenv.config();
import { execSync } from 'child_process';

// Imports and modules END !!! ---------------------------------------------------------------------------------------------------

// Variables and constants !!! ---------------------------------------------------------------------------------------------------

let mainWindow, store;
let ipAddress = process.env.SERVER_IP_ADDRESS || '';
let undetectabilityEnabled = true; // Enable undetectability by default
let currentDisplay = null;
let overlayWindows = new Map();
let isOverlayActive = false;

log.transports.file.level = 'info';
autoUpdater.logger = log;
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// Platform detection
const isMac = process.platform === 'darwin';
const isWindows = process.platform === 'win32';
const isLinux = process.platform === 'linux';
const isDev = process.env.NODE_ENV === 'development';

// Variables and constants END !!! ---------------------------------------------------------------------------------------------------

// Undetectable Window Class !!! ---------------------------------------------------------------------------------------------------

class UndetectableWindow {
  window;
  undetectabilityEnabled;
  currentDisplay;

  constructor(options = {}) {
    this.undetectabilityEnabled = options.undetectabilityEnabled || false;
    this.currentDisplay = options.initialDisplay || screen.getPrimaryDisplay();
    
    // Create window with undetectability features
    this.window = new BrowserWindow({
      show: isWindows, // On Windows, show immediately for undetectability
      type: "panel", // Special window type that's harder to detect
      alwaysOnTop: true,
      transparent: true,
      frame: false,
      roundedCorners: false,
      hasShadow: false,
      fullscreenable: true, // Allow fullscreen
      minimizable: false,
      hiddenInMissionControl: true, // macOS: hide from Mission Control
      skipTaskbar: this.undetectabilityEnabled, // Windows: hide from taskbar
      webPreferences: {
        preload: join(__dirname, '../preload/preload.js'),
        sandbox: false,
        contextIsolation: true,
        devTools: isDev,
      },
      ...options
    });

    // Set content protection if undetectability is enabled
    if (this.undetectabilityEnabled) {
      this.window.setContentProtection(true);
    }

    // Additional undetectability measures
    this.window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    this.window.setResizable(false);

    // Platform-specific settings
    if (isWindows) {
      this.window.setAlwaysOnTop(true, "screen-saver", 1);
      this.window.webContents.setBackgroundThrottling(false);
    }

    // Move to target display and make fullscreen
    this.moveToDisplay(this.currentDisplay);
    this.window.setFullScreen(true);

    // Set initial mouse event ignoring - start with interaction enabled
    this.setIgnoreMouseEvents(false);

    // Event handlers
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.window.once('ready-to-show', () => {
      this.window.show();
      this.window.setTitle('AgentBed');
    });

    this.window.on('page-title-updated', (event) => {
      if (this.window.getTitle() !== 'AgentBed') {
        this.window.setTitle('AgentBed');
      }
    });

    this.window.webContents.on('will-navigate', (event) => {
      event.preventDefault();
    });

    this.window.webContents.setWindowOpenHandler((details) => {
      try {
        const url = new URL(details.url);
        if (url.protocol === 'https:' || (isDev && url.protocol === 'http:') || url.protocol === 'mailto:') {
          shell.openExternal(details.url);
          this.sendToWebContents('opened-external-link', { url: details.url });
        }
      } catch (error) {
        log.error(`Error trying to open url ${details.url}`, error);
      }
      return { action: 'deny' };
    });
  }

  setIgnoreMouseEvents(ignore) {
    console.log(`[UndetectableWindow] Setting ignore mouse events: ${ignore}`);
    
    // When ignore is true, we want click-through (forward events to underlying apps)
    // When ignore is false, we want interaction with our window
    this.window.setIgnoreMouseEvents(ignore, { 
      forward: true,
      ignore: ignore 
    });
    
    // Additional settings for better click-through behavior
    if (ignore) {
      // When click-through is enabled, ensure window doesn't steal focus
      this.window.setFocusable(false);
      this.window.setFocusable(true);
    }
  }

  setContentProtection(enabled) {
    this.window.setContentProtection(enabled);
  }

  restoreContentProtection() {
    this.window.setContentProtection(this.undetectabilityEnabled);
  }

  moveToDisplay(display, options = {}) {
    this.currentDisplay = display;
    this.window.setPosition(display.workArea.x, display.workArea.y);
    this.window.setSize(display.workArea.width, display.workArea.height);
    
    // Ensure window is fullscreen when moving to a new display
    if (!options?.preserveFullscreen) {
      this.window.setFullScreen(true);
    }
    
    this.sendToWebContents('display-changed', {
      preservePosition: options?.preservePosition,
      cursorScreenX: options?.cursorScreenX,
      cursorScreenY: options?.cursorScreenY
    });
  }

  sendToWebContents(channel, data) {
    if (!this.window.isDestroyed()) {
      this.window.webContents.send(channel, data);
    }
  }

  focus() {
    this.window.focus();
  }

  blur() {
    if (isWindows) {
      this.window.setFocusable(false);
      this.window.setFocusable(true);
      this.window.setSkipTaskbar(true);
    }
    this.window.blur();
  }

  minimize() {
    this.window.minimize();
  }

  close() {
    if (!this.window.isDestroyed()) {
      this.window.close();
    }
  }

  isDestroyed() {
    return this.window.isDestroyed();
  }

  getBounds() {
    return this.window.getBounds();
  }

  reload() {
    this.window.webContents.reload();
  }

  toggleDevTools() {
    if (this.window.webContents.isDevToolsOpened()) {
      this.window.webContents.closeDevTools();
    } else {
      this.window.webContents.openDevTools({ mode: 'detach' });
      app.focus();
    }
  }

  toggleUndetectability() {
    this.undetectabilityEnabled = !this.undetectabilityEnabled;
    this.setContentProtection(this.undetectabilityEnabled);
    this.window.setSkipTaskbar(this.undetectabilityEnabled);
    
    // Ensure window stays fullscreen when toggling undetectability
    if (this.window.isFullScreen()) {
      this.window.setFullScreen(true);
    }
    
    return this.undetectabilityEnabled;
  }

  toggleFullscreen() {
    if (this.window.isFullScreen()) {
      this.window.setFullScreen(false);
    } else {
      this.window.setFullScreen(true);
    }
    return this.window.isFullScreen();
  }

  setFullscreen(fullscreen) {
    this.window.setFullScreen(fullscreen);
  }

  isFullscreen() {
    return this.window.isFullScreen();
  }
}

// Display Overlay Class !!! ---------------------------------------------------------------------------------------------------

class DisplayOverlay {
  window;
  displayId;
  ipcChannel;

  constructor(display, onClickCallback) {
    console.log(`[DisplayOverlay] Creating overlay for display ${display.id}`);
    this.displayId = display.id;
    this.ipcChannel = `overlay-click-${this.displayId}`;

    this.window = new BrowserWindow({
      show: false,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      focusable: false, // CRITICAL: Never steal focus from underlying apps
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
      webPreferences: {
        preload: join(__dirname, '../preload/preload.js'),
        sandbox: false,
        contextIsolation: true,
        devTools: false,
      }
    });

    console.log(`[DisplayOverlay] Window created for display ${this.displayId}`);

    // Make overlay visible on all workspaces
    this.window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    
    // CRITICAL: Set up focus management to prevent stealing focus
    this.window.setFocusable(false);
    this.window.setAlwaysOnTop(true, "screen-saver", 1);
    
    // Allow mouse events but never focus
    this.window.setIgnoreMouseEvents(false);
    
    // Prevent focus stealing on click
    this.window.on('focus', () => {
      console.log(`[DisplayOverlay] Focus event triggered for display ${this.displayId} - preventing focus`);
      this.window.blur();
    });

    // Setup IPC handler for overlay clicks
    const clickHandler = () => {
      console.log(`[DisplayOverlay] Overlay click triggered for display ${this.displayId}`);
      onClickCallback(this.displayId);
    };

    ipcMain.on(this.ipcChannel, clickHandler);

    this.window.on('closed', () => {
      console.log(`[DisplayOverlay] Cleaning up IPC handler for display ${this.displayId}`);
      ipcMain.removeListener(this.ipcChannel, clickHandler);
    });

    this.window.webContents.on('will-navigate', (event) => {
      event.preventDefault();
    });

    this.window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

    // CRITICAL: Prevent any focus stealing during window creation
    this.window.once('ready-to-show', () => {
      this.window.setFocusable(false);
      this.window.blur();
    });

    this.loadOverlayHTML(display);
  }

  loadOverlayHTML(display) {
    console.log(`[DisplayOverlay] Loading HTML for display ${display.id}`);
    
    const displayData = {
      display: {
        id: display.id,
        label: display.label || `Display ${display.id}`,
        bounds: display.bounds
      },
      ipcChannel: this.ipcChannel
    };

    let overlayUrl;
    if (isDev && process.env.ELECTRON_RENDERER_URL) {
      overlayUrl = new URL(`${process.env.ELECTRON_RENDERER_URL}/overlay.html`);
      console.log(`[DisplayOverlay] Using dev URL: ${overlayUrl.toString()}`);
    } else {
      // For production, load the overlay file directly
      overlayUrl = `file://${join(__dirname, '../renderer/overlay.html')}`;
      console.log(`[DisplayOverlay] Using file URL: ${overlayUrl}`);
    }

    const encodedData = encodeURIComponent(JSON.stringify(displayData));
    console.log(`[DisplayOverlay] Display data encoded: ${encodedData.substring(0, 100)}...`);
    
    // Handle URL construction properly
    if (overlayUrl instanceof URL) {
      overlayUrl.searchParams.set('displayData', encodedData);
      const finalUrl = overlayUrl.toString();
      console.log(`[DisplayOverlay] Loading URL: ${finalUrl}`);
      this.window.loadURL(finalUrl);
    } else {
      // For file URLs, append as query parameter
      const separator = overlayUrl.includes('?') ? '&' : '?';
      const finalUrl = `${overlayUrl}${separator}displayData=${encodedData}`;
      console.log(`[DisplayOverlay] Loading file URL: ${finalUrl}`);
      this.window.loadURL(finalUrl);
    }
  }

  show() {
    this.window.show();
    // Ensure window doesn't get focus when shown
    this.window.blur();
    this.window.setFocusable(false);
  }

  hide() {
    this.window.hide();
  }

  highlight() {
    this.window.webContents.executeJavaScript(`
      window.dispatchEvent(new CustomEvent('highlight'));
    `).catch(() => {});
  }

  unhighlight() {
    this.window.webContents.executeJavaScript(`
      window.dispatchEvent(new CustomEvent('unhighlight'));
    `).catch(() => {});
  }

  destroy() {
    console.log(`[DisplayOverlay] Destroying overlay for display ${this.displayId}`);
    if (!this.window.isDestroyed()) {
      this.window.close();
    }
  }

  getBounds() {
    return this.window.getBounds();
  }
}

// Display Overlay Manager !!! ---------------------------------------------------------------------------------------------------

class DisplayOverlayManager {
  overlays = new Map();
  isActive = false;

  showOverlays() {
    console.log("[DisplayOverlayManager] Showing overlays");
    this.hideOverlays();
    this.isActive = true;

    const displays = screen.getAllDisplays();
    console.log("[DisplayOverlayManager] Available displays:", displays.length);
    
    const currentWindowBounds = mainWindow.getBounds();
    const currentDisplay = screen.getDisplayMatching(currentWindowBounds);
    console.log("[DisplayOverlayManager] Current display:", currentDisplay.id);

    for (const display of displays) {
      console.log(`[DisplayOverlayManager] Processing display ${display.id}: ${display.label}`);
      if (display.id === currentDisplay.id) {
        console.log(`[DisplayOverlayManager] Skipping current display ${display.id}`);
        continue;
      }

      console.log(`[DisplayOverlayManager] Creating overlay for display ${display.id}`);
      const overlay = new DisplayOverlay(display, (displayId) => {
        console.log(`[DisplayOverlayManager] Display ${displayId} clicked, checking if active: ${this.isActive}`);
        
        if (!this.isActive) {
          console.log(`[DisplayOverlayManager] Ignoring click for display ${displayId} - overlays are inactive`);
          return;
        }

        console.log(`[DisplayOverlayManager] Moving window to display ${displayId}`);
        const targetDisplay = screen.getAllDisplays().find(d => d.id === displayId);
        if (targetDisplay) {
          mainWindow.moveToDisplay(targetDisplay);
          this.hideOverlays();
        }
      });

      this.overlays.set(display.id, overlay);
      overlay.show();
      console.log(`[DisplayOverlayManager] Overlay created and shown for display ${display.id}`);
    }
  }

  hideOverlays() {
    console.log("[DisplayOverlayManager] Hiding overlays");
    this.isActive = false;
    
    for (const overlay of this.overlays.values()) {
      overlay.destroy();
    }
    this.overlays.clear();
  }

  highlightDisplay(displayId) {
    const overlay = this.overlays.get(displayId);
    if (overlay) {
      overlay.highlight();
    }
  }

  unhighlightDisplay(displayId) {
    const overlay = this.overlays.get(displayId);
    if (overlay) {
      overlay.unhighlight();
    }
  }
}

// Utility Functions !!! ---------------------------------------------------------------------------------------------------

function getAvailableDisplays() {
  const currentBounds = mainWindow.getBounds();
  const currentDisplay = screen.getDisplayMatching(currentBounds);
  
  return screen.getAllDisplays().map(display => ({
    ...display,
    label: display.label || `Display ${display.id}`,
    primary: display.id === screen.getPrimaryDisplay().id,
    current: display.id === currentDisplay.id
  }));
}

function findDisplayById(displayId) {
  return screen.getAllDisplays().find(display => display.id === displayId);
}

async function captureScreenshot() {
  try {
    mainWindow.setContentProtection(true);
    
    if (isMac) {
      return await captureScreenshotMac();
    } else {
      return await captureScreenshotOther();
    }
  } finally {
    mainWindow.restoreContentProtection();
  }
}

async function captureScreenshotMac() {
  const targetDisplay = mainWindow.currentDisplay;
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: {
      width: targetDisplay.bounds.width,
      height: targetDisplay.bounds.height
    }
  });

  const source = sources.find(s => s.display_id === targetDisplay.id.toString()) || sources[0];
  
  if (!source) {
    throw new Error('Unable to capture screenshot: no display source found');
  }

  return {
    data: source.thumbnail.toPNG(),
    contentType: 'image/png'
  };
}

async function captureScreenshotOther() {
  // For non-Mac platforms, you might want to use a different approach
  // This is a placeholder - you'll need to implement based on your needs
  throw new Error('Screenshot capture not implemented for this platform');
}

// IPC Handlers !!! ---------------------------------------------------------------------------------------------------

// Window management handlers
ipcMain.handle('window:close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.handle('window:minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.window.isMaximized()) {
      mainWindow.window.unmaximize();
    } else {
      mainWindow.window.maximize();
    }
  }
});

// Undetectability handlers
ipcMain.handle('window:setClickThrough', (event, clickThrough) => {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(clickThrough);
  }
});

ipcMain.handle('window:enableInteraction', () => {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(false);
  }
});

ipcMain.handle('window:disableInteraction', () => {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(true);
  }
});

ipcMain.handle('window:toggleUndetectability', () => {
  undetectabilityEnabled = !undetectabilityEnabled;
  if (mainWindow) {
    mainWindow.undetectabilityEnabled = undetectabilityEnabled;
    mainWindow.setContentProtection(undetectabilityEnabled);
    mainWindow.window.setSkipTaskbar(undetectabilityEnabled);
  }
  return undetectabilityEnabled;
});

ipcMain.handle('window:toggleFullscreen', () => {
  if (mainWindow) {
    return mainWindow.toggleFullscreen();
  }
  return false;
});

ipcMain.handle('window:setFullscreen', (event, fullscreen) => {
  if (mainWindow) {
    mainWindow.setFullscreen(fullscreen);
  }
});

ipcMain.handle('window:isFullscreen', () => {
  if (mainWindow) {
    return mainWindow.isFullscreen();
  }
  return false;
});

// Display management handlers
ipcMain.handle('window:getAvailableDisplays', () => {
  return getAvailableDisplays();
});

ipcMain.handle('window:moveToDisplay', (event, displayId, options = {}) => {
  const display = findDisplayById(displayId);
  if (display && mainWindow) {
    mainWindow.moveToDisplay(display, options);
  }
});

ipcMain.handle('window:showDisplayOverlays', () => {
  if (overlayManager) {
    overlayManager.showOverlays();
  }
});

ipcMain.handle('window:hideDisplayOverlays', () => {
  if (overlayManager) {
    overlayManager.hideOverlays();
  }
});

ipcMain.handle('window:highlightDisplay', (event, displayId) => {
  if (overlayManager) {
    overlayManager.highlightDisplay(displayId);
  }
});

ipcMain.handle('window:unhighlightDisplay', (event, displayId) => {
  if (overlayManager) {
    overlayManager.unhighlightDisplay(displayId);
  }
});

// Screenshot handler
ipcMain.handle('window:captureScreenshot', async () => {
  return await captureScreenshot();
});

// Media permission handlers
ipcMain.handle('window:requestMediaPermission', async (event, permissionType) => {
  if (isMac) {
    if (permissionType === 'screen') {
      try {
        await desktopCapturer.getSources({ types: ['screen'] });
        return true;
      } catch {
        return false;
      }
    }
    
    try {
      const status = systemPreferences.getMediaAccessStatus(permissionType);
      if (status === 'not-determined') {
        return await systemPreferences.askForMediaAccess(permissionType);
      }
      return status === 'granted';
    } catch (error) {
      log.error('Media permission error:', error);
      return false;
    }
  }
  return true;
});

// Store handlers (keeping your existing ones)
ipcMain.handle('store-data', (event, key, value) => {
  storeStoreData(key, value);
});

ipcMain.handle('store-has', (event, key) => {
  return storeHas(key);
});

ipcMain.handle('get-data', (event, key) => {
  return storeGetData(key);
});

ipcMain.handle('delete-data', (event, key) => {
  storeDeleteData(key);
});

// Database handlers (keeping your existing ones)
ipcMain.handle('db:getAgentsInfo', async () => {
  return await getAgentsInfo();
});

ipcMain.handle('db:addAgentInfo', async (event, agentInfo) => {
  return await addAgentInfo(agentInfo);
});

ipcMain.handle('db:updateAgentEnv', async (event, agentId, varName, varValue) => {
  return await updateAgentEnvVariable(agentId, varName, varValue);
});

// Global shortcut handlers
ipcMain.handle('window:registerGlobalShortcut', (event, accelerator) => {
  return globalShortcut.register(accelerator, () => {
    mainWindow.sendToWebContents('global-shortcut-triggered', { accelerator });
  });
});

ipcMain.handle('window:unregisterGlobalShortcut', (event, accelerator) => {
  return globalShortcut.unregister(accelerator);
});

// Utility Functions (keeping your existing ones) !!! ---------------------------------------------------------------------------------------------------

async function spawnPowerShellCommand(command, needOutput = false) {
  return new Promise((resolve, reject) => {
    const process = spawn('powershell.exe', [command]);

    let stdout = '';
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    let stderr = '';
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        if (needOutput) resolve(stdout);
        else resolve();
      } else {
        resolve();
      }
    });
  });
}

async function executeCMDCommand(command, needOutput = false) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(`Exec error: ${error}`);
        reject(error);
      } else {
        if (stdout) console.log(`Stdout: ${stdout}`);
        if (stderr) console.log(`Stderr: ${stderr}`);

        if (needOutput) resolve(stdout);
        else resolve();
      }
    });
  });
}

async function loadStore() {
  const Store = (await import('electron-store')).default;
  const store = new Store();
  return store;
}

function storeStoreData(key, value) {
  store.set(key, value);
}

function storeHas(key) {
  return store.has(key);
}

function storeGetData(key) {
  return store.get(key);
}

function storeDeleteData(key) {
  store.delete(key);
}

// Auto Updater Section (keeping your existing one) !!! -------------------------------------------------------------------------------------

autoUpdater.on('checking-for-update', () => {
  console.log("Checking for Update")
  log.info('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  log.info('Update available.');
});

autoUpdater.on('update-not-available', (info) => {
  log.info('Update not available.');
});

autoUpdater.on('error', (err) => {
  log.error('Error in auto-updater. ' + err);
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = 'Download speed: ' + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')';
  log.info(log_message);
});

autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded');
});

// App Section !!! ---------------------------------------------------------------------------------------------------

let overlayManager;

app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.agentbed');

  // Initialize DB 
  try {
    initDb();
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }

  // Load Store
  store = await loadStore();

  // Create overlay manager
  overlayManager = new DisplayOverlayManager();

  // Create main window
  mainWindow = new UndetectableWindow({
    undetectabilityEnabled: undetectabilityEnabled,
    initialDisplay: screen.getPrimaryDisplay()
  });

  // Load the application
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.window.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.window.loadFile(join(__dirname, '../renderer/index.html'));
  }

  // Handle display changes
  screen.on('display-added', handleDisplayChange);
  screen.on('display-removed', handleDisplayChange);
  screen.on('display-metrics-changed', handleDisplayChange);

  // Register protocol handler
  if (isWindows) {
    const urlArg = process.argv.find(arg => arg.startsWith('agentbed://'));
    if (urlArg) {
      mainWindow.window.webContents.once('did-finish-load', () => {
        handleWebEventTrigger(urlArg);
      });
    }
  }

  // Set up global shortcuts for development
  if (isDev) {
    globalShortcut.register('CommandOrControl+Alt+Shift+I', () => {
      mainWindow.toggleUndetectability();
    });
    
    globalShortcut.register('CommandOrControl+Alt+F', () => {
      mainWindow.toggleFullscreen();
    });
    
    globalShortcut.register('CommandOrControl+Alt+R', () => {
      mainWindow.reload();
    });
    
    globalShortcut.register('CommandOrControl+Alt+I', () => {
      mainWindow.toggleDevTools();
    });
  }
});

function handleDisplayChange() {
  const displays = getAvailableDisplays();
  mainWindow.sendToWebContents('available-displays', { displays });
  
  // Check if current display still exists
  const currentDisplay = screen.getDisplayMatching(mainWindow.getBounds());
  if (!screen.getAllDisplays().some(d => d.id === currentDisplay.id)) {
    mainWindow.moveToDisplay(screen.getPrimaryDisplay());
    mainWindow.sendToWebContents('recenter-movable-windows', null);
  }
}

function handleWebEventTrigger(urlArg) {
  // Handle your custom protocol events here
  console.log('Handling web event trigger:', urlArg);
}

app.on('will-quit', async (event) => {
  event.preventDefault();
  console.log("Quitting The Application !!!");

  globalShortcut.unregisterAll();
  app.exit(0);
});

// App Section END !!! ---------------------------------------------------------------------------------------------------
