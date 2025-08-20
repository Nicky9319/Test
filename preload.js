import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
const path = require('path')

import { initDb,
  getAgentsInfo,
  addAgentInfo,
  updateAgentEnvVariable} from './db/db.js';

  
// Import the db functions with direct relative path
let dbApi = {initDb, getAgentsInfo, addAgentInfo, updateAgentEnvVariable};

// Enhanced electron API with undetectable window features
const enhancedElectronAPI = {
  ...electronAPI,
  ipcRenderer: {
    send: (channel, ...args) => ipcRenderer.send(channel, ...args),
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    on: (channel, func) => {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
    once: (channel, func) => {
      ipcRenderer.once(channel, (event, ...args) => func(...args));
    },
    removeListener: (channel, func) => {
      ipcRenderer.removeListener(channel, func);
    }
  },
  process: {
    platform: process.platform,
    env: {
      NODE_ENV: process.env.NODE_ENV
    }
  }
};

if (process.contextIsolated) {
  try{
    contextBridge.exposeInMainWorld('electron', enhancedElectronAPI)

    contextBridge.exposeInMainWorld('db', {
      updateAgentEnvVariable: (agentId, envVariable) => dbApi.updateAgentEnvVariable ? dbApi.updateAgentEnvVariable(agentId, envVariable) : Promise.reject('db not loaded'),
      getAgentsInfo: () => dbApi.getAgentsInfo ? dbApi.getAgentsInfo() : Promise.reject('db not loaded'),
      addAgentInfo: (agent) => dbApi.addAgentInfo ? dbApi.addAgentInfo(agent) : Promise.reject('db not loaded'),
      initDb: () => dbApi.initDb ? dbApi.initDb() : Promise.reject('db not loaded'),
    });

    // Enhanced window API with undetectable features
    contextBridge.exposeInMainWorld('electronAPI', {
      // Basic window controls
      closeApp: () => ipcRenderer.invoke('window:close'),
      minimizeApp: () => ipcRenderer.invoke('window:minimize'),
      maximizeApp: () => ipcRenderer.invoke('window:maximize'),
      
      // Mouse interaction controls
      enableInteraction: () => ipcRenderer.invoke('window:enableInteraction'),
      disableInteraction: () => ipcRenderer.invoke('window:disableInteraction'),
      setClickThrough: (clickThrough) => ipcRenderer.invoke('window:setClickThrough', clickThrough),
      
      // Undetectability controls
      toggleUndetectability: () => ipcRenderer.invoke('window:toggleUndetectability'),
      
      // Fullscreen controls
      toggleFullscreen: () => ipcRenderer.invoke('window:toggleFullscreen'),
      setFullscreen: (fullscreen) => ipcRenderer.invoke('window:setFullscreen', fullscreen),
      isFullscreen: () => ipcRenderer.invoke('window:isFullscreen'),
      
      // Display management
      getAvailableDisplays: () => ipcRenderer.invoke('window:getAvailableDisplays'),
      moveToDisplay: (displayId, options) => ipcRenderer.invoke('window:moveToDisplay', displayId, options),
      
      // Overlay controls
      showDisplayOverlays: () => ipcRenderer.invoke('window:showDisplayOverlays'),
      hideDisplayOverlays: () => ipcRenderer.invoke('window:hideDisplayOverlays'),
      highlightDisplay: (displayId) => ipcRenderer.invoke('window:highlightDisplay', displayId),
      unhighlightDisplay: (displayId) => ipcRenderer.invoke('window:unhighlightDisplay', displayId),
      
      // Screenshot functionality
      captureScreenshot: () => ipcRenderer.invoke('window:captureScreenshot'),
      
      // Media permissions
      requestMediaPermission: (permissionType) => ipcRenderer.invoke('window:requestMediaPermission', permissionType),
      
      // Global shortcuts
      registerGlobalShortcut: (accelerator) => ipcRenderer.invoke('window:registerGlobalShortcut', accelerator),
      unregisterGlobalShortcut: (accelerator) => ipcRenderer.invoke('window:unregisterGlobalShortcut', accelerator),
      
      // Store operations
      storeData: (key, value) => ipcRenderer.invoke('store-data', key, value),
      storeHas: (key) => ipcRenderer.invoke('store-has', key),
      getData: (key) => ipcRenderer.invoke('get-data', key),
      deleteData: (key) => ipcRenderer.invoke('delete-data', key),
    });

    // Event listeners for window events
    contextBridge.exposeInMainWorld('windowEvents', {
      onDisplayChanged: (callback) => {
        ipcRenderer.on('display-changed', (event, data) => callback(data));
      },
      onAvailableDisplays: (callback) => {
        ipcRenderer.on('available-displays', (event, data) => callback(data));
      },
      onGlobalShortcutTriggered: (callback) => {
        ipcRenderer.on('global-shortcut-triggered', (event, data) => callback(data));
      },
      onOpenedExternalLink: (callback) => {
        ipcRenderer.on('opened-external-link', (event, data) => callback(data));
      },
      onRecenterMovableWindows: (callback) => {
        ipcRenderer.on('recenter-movable-windows', (event, data) => callback(data));
      }
    });

  }
  catch (error) {
    console.error(error)
  }
}
else{
  window.electron = enhancedElectronAPI
  window.db = {
    updateAgentEnvVariable: (agentId, envVariable) => dbApi.updateAgentEnvVariable ? dbApi.updateAgentEnvVariable(agentId, envVariable) : Promise.reject('db not loaded'),
    getAgentsInfo: () => dbApi.getAgentsInfo ? dbApi.getAgentsInfo() : Promise.reject('db not loaded'),
    addAgentInfo: (agent) => dbApi.addAgentInfo ? dbApi.addAgentInfo(agent) : Promise.reject('db not loaded'),
    initDb: () => dbApi.initDb ? dbApi.initDb() : Promise.reject('db not loaded'),
  }
  
  // Enhanced window API for non-context-isolated mode
  window.electronAPI = {
    // Basic window controls
    closeApp: () => ipcRenderer.invoke('window:close'),
    minimizeApp: () => ipcRenderer.invoke('window:minimize'),
    maximizeApp: () => ipcRenderer.invoke('window:maximize'),
    
    // Mouse interaction controls
    enableInteraction: () => ipcRenderer.invoke('window:enableInteraction'),
    disableInteraction: () => ipcRenderer.invoke('window:disableInteraction'),
    setClickThrough: (clickThrough) => ipcRenderer.invoke('window:setClickThrough', clickThrough),
    
    // Undetectability controls
    toggleUndetectability: () => ipcRenderer.invoke('window:toggleUndetectability'),
    
    // Display management
    getAvailableDisplays: () => ipcRenderer.invoke('window:getAvailableDisplays'),
    moveToDisplay: (displayId, options) => ipcRenderer.invoke('window:moveToDisplay', displayId, options),
    
    // Overlay controls
    showDisplayOverlays: () => ipcRenderer.invoke('window:showDisplayOverlays'),
    hideDisplayOverlays: () => ipcRenderer.invoke('window:hideDisplayOverlays'),
    highlightDisplay: (displayId) => ipcRenderer.invoke('window:highlightDisplay', displayId),
    unhighlightDisplay: (displayId) => ipcRenderer.invoke('window:unhighlightDisplay', displayId),
    
    // Screenshot functionality
    captureScreenshot: () => ipcRenderer.invoke('window:captureScreenshot'),
    
    // Media permissions
    requestMediaPermission: (permissionType) => ipcRenderer.invoke('window:requestMediaPermission', permissionType),
    
    // Global shortcuts
    registerGlobalShortcut: (accelerator) => ipcRenderer.invoke('window:registerGlobalShortcut', accelerator),
    unregisterGlobalShortcut: (accelerator) => ipcRenderer.invoke('window:unregisterGlobalShortcut', accelerator),
    
    // Store operations
    storeData: (key, value) => ipcRenderer.invoke('store-data', key, value),
    storeHas: (key) => ipcRenderer.invoke('store-has', key),
    getData: (key) => ipcRenderer.invoke('get-data', key),
    deleteData: (key) => ipcRenderer.invoke('delete-data', key),
  }
  
  // Event listeners for non-context-isolated mode
  window.windowEvents = {
    onDisplayChanged: (callback) => {
      ipcRenderer.on('display-changed', (event, data) => callback(data));
    },
    onAvailableDisplays: (callback) => {
      ipcRenderer.on('available-displays', (event, data) => callback(data));
    },
    onGlobalShortcutTriggered: (callback) => {
      ipcRenderer.on('global-shortcut-triggered', (event, data) => callback(data));
    },
    onOpenedExternalLink: (callback) => {
      ipcRenderer.on('opened-external-link', (event, data) => callback(data));
    },
    onRecenterMovableWindows: (callback) => {
      ipcRenderer.on('recenter-movable-windows', (event, data) => callback(data));
    }
  };
}