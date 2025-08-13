import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
const path = require('path')

import { initDb,
  getAgentsInfo,
  addAgentInfo,
  updateAgentEnvVariable} from './db/db.js';

  
// Import the db functions with direct relative path
let dbApi = {initDb, getAgentsInfo, addAgentInfo, updateAgentEnvVariable};



if (process.contextIsolated) {
  try{
    contextBridge.exposeInMainWorld('electron', electronAPI)

    contextBridge.exposeInMainWorld('db', {
      updateAgentEnvVariable: (agentId, envVariable) => dbApi.updateAgentEnvVariable ? dbApi.updateAgentEnvVariable(agentId, envVariable) : Promise.reject('db not loaded'),
      getAgentsInfo: () => dbApi.getAgentsInfo ? dbApi.getAgentsInfo() : Promise.reject('db not loaded'),
      addAgentInfo: (agent) => dbApi.addAgentInfo ? dbApi.addAgentInfo(agent) : Promise.reject('db not loaded'),
      initDb: () => dbApi.initDb ? dbApi.initDb() : Promise.reject('db not loaded'),
    });

    contextBridge.exposeInMainWorld('electronAPI', {
      closeApp: () => ipcRenderer.invoke('window:close'),
      minimizeApp: () => ipcRenderer.invoke('window:minimize'),
      maximizeApp: () => ipcRenderer.invoke('window:maximize'),
    });

  }
  catch (error) {
    console.error(error)
  }
}
else{
  window.electron = electronAPI
  window.db = {
    updateAgentEnvVariable: (agentId, envVariable) => dbApi.updateAgentEnvVariable ? dbApi.updateAgentEnvVariable(agentId, envVariable) : Promise.reject('db not loaded'),
    getAgentsInfo: () => dbApi.getAgentsInfo ? dbApi.getAgentsInfo() : Promise.reject('db not loaded'),
    addAgentInfo: (agent) => dbApi.addAgentInfo ? dbApi.addAgentInfo(agent) : Promise.reject('db not loaded'),
    initDb: () => dbApi.initDb ? dbApi.initDb() : Promise.reject('db not loaded'),
  }
  window.electronAPI = {
    closeApp: () => ipcRenderer.invoke('window:close'),
    minimizeApp: () => ipcRenderer.invoke('window:minimize'),
    maximizeApp: () => ipcRenderer.invoke('window:maximize'),
  }
}