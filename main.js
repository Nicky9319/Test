// Imports and modules !!! ---------------------------------------------------------------------------------------------------

import { app, shell, BrowserWindow, ipcMain, globalShortcut, contextBridge } from 'electron'
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

import { initDb,
  getAgentsInfo,
  addAgentInfo,
  updateAgentEnvVariable} from './db/db.js';

import dotenv from 'dotenv';
dotenv.config();

import { execSync } from 'child_process';


// Imports and modules END !!! ---------------------------------------------------------------------------------------------------




// Variables and constants !!! ---------------------------------------------------------------------------------------------------

let mainWindow, store;
let ipAddress = process.env.SERVER_IP_ADDRESS || '';

log.transports.file.level = 'info';
autoUpdater.logger = log;

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// Variables and constants END !!! ---------------------------------------------------------------------------------------------------





// IPC On Section !!! ------------------------------------------------------------------------------------------------------

ipcMain.on('change-window', (event, arg) => {
  console.log("Changing The Application Window !!!!")
  window_name = "html/" + arg;
  // window_name = arg;
  mainWindow.loadFile(window_name);
})

// IPC On Section END !!! ---------------------------------------------------------------------------------------------------





// IPC Handle Section !!! ------------------------------------------------------------------------------------------------------


ipcMain.handle('get-ip-address', async (event) => {
});


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


ipcMain.handle('show-dialog', async (event, dialogType, dialogTitle, dialogMessage) => {
  await dialog.showMessageBox({
    type: dialogType,
    title: dialogTitle,
    message: dialogMessage
  })

  return;
});



ipcMain.handle('start-agent', (event, agentId) => {

})

ipcMain.handle('stop-agent', (event, agentId) =>{

})



ipcMain.handle('db:getAgentsInfo', async () => {
  return await getAgentsInfo();
});

// Add a new agent
ipcMain.handle('db:addAgentInfo', async (event, agentInfo) => {
  return await addAgentInfo(agentInfo);
});

// New handler for updating environment variables
ipcMain.handle('db:updateAgentEnv', async (event, agentId, varName, varValue) => {
  return await updateAgentEnvVariable(agentId, varName, varValue);
});

// Custom titlebar handlers
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
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});


// IPC Handle Section END !!! ---------------------------------------------------------------------------------------------------







// Auto Update Section !!! -------------------------------------------------------------------------------------

autoUpdater.on('checking-for-update', () => {
  console.log("Checking for Update")
  log.info('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  // autoUpdater.downloadUpdate();
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

// Auto Updater Section END !!! ----------------------------------------------------------------------------------






// Electron - Store Utility Section !!! -------------------------------------------------------------------------------------

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

// Electron Store Utility Section END !!! ----------------------------------------------------------------------------------






// Utility Functions Section !!! -------------------------------------------------------------------------------------

async function spawnPowerShellCommand(command , needOutput = false){
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
        if(code === 0){
          if (needOutput) resolve(stdout);
          else resolve();
        }
        else{
          resolve()
        }
        // else{
        //   reject(new Error(`Command failed with code ${code}: ${stderr}`));
        // }
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

async function waitForDockerPing() {
  return new Promise(async (resolve, reject) => {
    // const pingInterval = setInterval(async () => {
    //   try {
    //     await docker.ping();
    //     console.log("Engine is Running !!!");
    //     resolve();
    //     clearInterval(pingInterval);
    //   } catch (error) {
    //     console.log("Docker Engine Not Ready Yet");
    //   }
    // }, 5000);


  });
}

// Utility Functions Section END !!! --------------------------------------------------------------------------------
















// Config WSL Section !!! ------------------------------------------------------------------------------------------------------------------------------




/** Returns the Current State Of Wsl Helping to Decide What Step of Configuration is Wsl Currently present at */
/** 3 States [RestartSystem, InstallDistro,  ConfigureDistro, Good] */
function GetWslState(){
  return new Promise(async (resolve, reject) => {
    needsSystemRestart = await CheckWslNeedsRestart();
    if(needsSystemRestart){
        resolve("RestartSystem");
        return;
    }

    distroInstalled = await checkDistroPresent('Ubuntu');
    if(!distroInstalled){
        resolve("InstallDistro");
        return;
    }

    wslConfigCompleted = await checkWslConfigDone('Ubuntu');
    if(!wslConfigCompleted){
        resolve("ConfigureDistro");
        return;
    }

    resolve("Good");
    return;
  });
}

/** Gets The Current Wsl Status */
function GetWslSTATUS(){
  return new Promise((resolve, reject) => {
      spawnPowerShellCommand('wsl.exe --status' , true).then((output) => {
          resolve(output);
      });
  });
}

/** Checks If Wsl needs Restart Because of the current Wsl Status */
function CheckWslNeedsRestart(){
  return new Promise((resolve, reject) => {
      GetWslSTATUS().then(async (status) => {
          statusOutput = status.toString().replace(/\x00/g, '').trim();

          EnableVMPComponentStatement = `Please enable the "Virtual Machine Platform" optional component and ensure virtualization is enabled in the BIOS.`;
          CommandToEnableComponentStatement = `Enable "Virtual Machine Platform" by running: wsl.exe --install --no-distribution For information please visit https://aka.ms/enablevirtualization`

          if(statusOutput.includes(EnableVMPComponentStatement) || statusOutput.includes(CommandToEnableComponentStatement)){
              resolve(true);
              return;
          }

          resolve(false);
          return;
      });
  });
}

/** Checks if a specific Distro is present Inside Wsl or not */
function checkDistroPresent(distroName){

  return new Promise((resolve, reject) => {
      exec('wsl --list --quiet', (error, stdout, stderr) => {

          if (error) {
              console.error(`Error checking for distros: ${error.message}`);
              resolve(false);
              return;
          }

          if (stderr) {
              console.error(`Standard error: ${stderr}`);
              resolve(false);
              return;
          }

          if (stdout) {
              output = stdout.toString().replace(/\x00/g, '').trim();
              if(output.split('\n').map(line => line.replace(/\r$/, '')).includes(distroName)) {
                  console.log("Distro Found");
                  resolve(true);
                  return;
              }
              else{
                  resolve(false);
                  return;
              }         
          } 

          if (stdout == '') {
              resolve(false);
              return;
          }
      });

  })
}

// !!!! Need to be Updated
/** Check if All the Configurations Needed to Run Containers Inside a Distro Is Completed or Not, Return -> Boolean */
function checkWslConfigDone(distroName){
  return new Promise((resolve, reject) => {
      checkNvidiaContainerConfigDone(distroName).then((result) => {
          if (!result) {
              resolve(false);
              return;
          }

          checkPodmanConfigDone(distroName).then((result) => {
              resolve(result);
              return;
          })
      })




  })
}

/** Handled the Actions to take based on the Wsl State */
function handleWslStateActions(state){
  console.log("Current Wsl State : " , state);
  if(state == "RestartSystem"){
      console.log("Need to Restart System");
      ConfigSetupWslBeforeRestart().then(() => {
          console.log("Pre-requisites Done");
          mainWindow.webContents.send('navigate-to-component' , '/LoginPage/RestartWidget');
      });
  }
  else if(state == "ConfigureDistro" || state == "InstallDistro"){
      console.log("Need to Install or Configure Distro");
      mainWindow.webContents.send('navigate-to-component' , '/LoginPage/ConfigLoadingWidget');
  }
  else{
    storeStoreData('isWslSetupDone' , true);
    mainWindow.webContents.send('navigate-to-component' , '/MainPage');
  }
}

/** Completes the Configuration for Wsl Before Restart */
function ConfigSetupWslBeforeRestart(){
  return new Promise(async (resolve, reject) => {
      console.log("Starting Pre-requisites")

      VMPComponentActivateCommand = "dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart"
      try {await spawnPowerShellCommand(VMPComponentActivateCommand);} catch(error) {}
      console.log("VMP Activated")

      WslInstallCommand = `wsl.exe --install --no-distribution`;
      await spawnPowerShellCommand(WslInstallCommand);
      console.log("Wsl No Distro Installed")

      KernelUpdateCommand = `wsl.exe --update`;
      await spawnPowerShellCommand(KernelUpdateCommand);
      resolve();
  });
}

/** Configures the Complete Wsl Distro to run Containers By a specific User*/
async function ConfigWslFromScratch(username, password , distroName){
  console.log("configuring Wsl from Scratch")
  try {await MakeWslSetupDirectory(username , distroName);} catch(error){}
  console.log("Directory Work Done")
  await CopyShScriptToWsl(username , distroName);
  await ExecuteWslConfigShScript(username , password , distroName);
}

/** Installing the Complete Wsl Distro from Scratch and Configuring the Envrionment for that Distro */
function InstallWslDistroandConfigUser(username , password , distroName){
  return new Promise((resolve, reject) => {
    // console.log("Starting Wsl Installation and Config")
    const controller = new AbortController();
    const signal = controller.signal;

    InstallDistroWSL(signal , distroName);

    EventDistroInstalled = new Promise(async (resolve, reject) => {
        while(true){
            // console.log("Checking for Distro Installation");
            const isPresent = await checkDistroPresent(distroName);
            console.log(isPresent);

            if(isPresent){
                console.log("Distro Found");
                controller.abort();
                resolve();
                break;
            }
            
            await new Promise((resolve , reject) => {
                setTimeout(() => {
                    resolve();
                }, 5000);
            });

        }
    });

    EventDistroInstalled
    .then(() =>{
        console.log("Distro Installed Can Move forward to User Adding");
        AddNewUserInDistro(username , password , distroName , true)
        .then(async () => {
            console.log("User Added");

            await ConfigWslFromScratch(username , password , distroName);

            resolve();
        });
    });


  });

}


// !!!! Need to be Updated
/** Install a Distro In Wsl */  // 
function InstallDistroWSL(signal , distroName){
  return new Promise((resolve, reject) => {
      console.log(`Installing the Desired Distro: ${distroName}`);
      const InstallDistroProcess = spawn('wsl', ['--install', '-d', distroName]);

      InstallDistroProcess.on('close', () => {
          console.log(`Process of Installing the Desired Distro has Completed`);
          resolve();
          return;
      });


      signal.addEventListener('abort', () => {
          console.log("Abort Signal Received");
          InstallDistroProcess.kill('SIGKILL');
          resolve();
          return;
      });

  });
}

/** Setting Up a new User Inside a Distro alongiside with its password */
function AddNewUserInDistro(username , password , distroName , sudoAccess){
  return new Promise(async (resolve, reject) => {
      await AddUserToDistro(username , distroName , sudoAccess);
      await ChangeUserPasswordInDistro(username , password , distroName);
      resolve();
  });
}

/** Adds a User To Distro Without Setting Password */
function AddUserToDistro(username , distroName , sudoAccess){
  return new Promise((resolve, reject) => {

      let AddUserCommand = `wsl -d ${distroName} --exec bash -c "useradd -m -s /bin/bash ${username}"`;
      if(sudoAccess)
          AddUserCommand = `wsl -d ${distroName} --exec bash -c "useradd -m -s /bin/bash -G sudo ${username}"`;


      console.log(AddUserCommand)
      const AddUserProcess = spawn('powershell.exe', [AddUserCommand]);

      AddUserProcess.stderr.on('data', (data) => {
          console.error(`stderr: ${data}`);
      });

      AddUserProcess.on('close', () => {
          resolve();
      });

      AddUserProcess.stdout.on('data', (data) => {
          console.log(`stdout: ${data}`);
      });

  });
}

/** Changes the password for a specific User in a specific Distro */
function ChangeUserPasswordInDistro(username , password , distroName){
  return new Promise((resolve, reject) => {
      const ChangePasswordCommand = `echo ${username}:${password} | chpasswd`;
      console.log(ChangePasswordCommand)

      const ChangePasswordProcess = spawn('wsl', ['-d', distroName, '--exec', 'bash', '-c', ChangePasswordCommand]);

      ChangePasswordProcess.stderr.on('data', (data) => {
          console.error(`stderr: ${data}`);
      });

      ChangePasswordProcess.on('close', () => {
          console.log("Password Changed");
          resolve();
      });
  });
}

// !!!! Need to be Updated
/** Set-ups Directory For a Particular User Inside particular Distro Used To Store Sh Scripts Needed to Setup Environment */
function MakeWslSetupDirectory(username ,  distroName){
  return new Promise((resolve, reject) => {
    commandToExecute = "mkdir ~/wslSetupScript"
    logger.info('Main Js: Making Directory for Storing Wsl Setup Script')
    executeWslCommand(commandToExecute , distroName , username).then(() => {
        logger.info('Main Js: Directory Made for Storing Wsl Setup Script')
        resolve();
    });
  })
}

// !!!! Need to be Updated
/** Copying Sh Script From Host machine OS to Wsl for a particular user inside a particular Distro*/
function CopyShScriptToWsl(username , distroName){
  return new Promise((resolve, reject) => {
    commandToExecute = `cp ./wslPodmanSetup.sh ~/wslSetupScript`
    logger.info('Main Js: Copying Sh Script to Wsl')
    executeWslCommand(commandToExecute , distroName , username).then(() => {
        logger.info('Main Js: Sh Script Copied to Wsl')
        resolve();
    });
  })
}

// !!!! Need to be Updated
/** Executing the Sh Files Inside a Distro for a particular User */
function ExecuteWslConfigShScript(username , password , distroName){
  return new Promise((resolve, reject) => {
    console.log("Running the Script to Configure WSL Distro")
    commandToExecute = `cd /home/${username}/wslSetupScript  && echo ${password} | sudo -S bash wslPodmanSetup.sh`
    console.log(password);
    // executeWslCommand(commandToExecute , distroName , username).then(() => {
    //     console.log("Script Executed !!!")
    //     resolve();
    // });
    logger.info('Main Js: Executing the Sh Script to Configure WSL Distro')
    const ExecuteCMD = `wsl -d ${distroName} -u ${username} --exec bash -c "cd /home/${username}/wslSetupScript  && echo ${password} | sudo -S bash wslPodmanSetup.sh"`
    spawnPowerShellCommand(ExecuteCMD).then(() => {
        logger.info('Main Js: Script Executed and configuration Completed')
        resolve();
    });
  })
}


/** Executes a Command Inside a particular WSL Distro with a particular user */
function executeWslCommand(command , distroName , username = "root" , needOutput = false){
  return new Promise((resolve, reject) => {
      const ExecuteCMD = `wsl -d ${distroName} -u ${username} --exec bash -c "${command}"`
      const process = spawn('powershell.exe', [ExecuteCMD]);

      let stdout = '';
      process.stdout.on('data', (data) => {
          stdout += data.toString();
      });

      let stderr = '';
      process.stderr.on('data', (data) => {
        // console.log("Error : " , data.toString());
          stderr += data.toString();
      });

      process.on('close', (code) => {
        if(code === 0){
          if (needOutput) resolve(stdout);
          else resolve();
        }
        else{
          console.log("Error Exist In this Command");
          resolve("Error");
          // reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });
  });
}






// Config WSL Section END !!! ----------------------------------------------------------------------------------------------------------------














// App Event Trigger Section !!! --------------------------------------------------------------------------------



async function handleEvent(eventInfo) {
  console.log("Event Triggered")
  // console.log(eventInfo);
  console.log(eventInfo["AGENT_ID"])

  if (eventInfo["EVENT"] == "INSTALL_AGENT") {
    mainWindow.webContents.send('install-agent', agentId = eventInfo["AGENT_ID"], agentVersion = eventInfo["AGENT_VERSION"])
  }
  else if (eventInfo["EVENT"] == "UI_AUTOMATE") {
    uiAutomateHandler(eventInfo["DATA"]);
  }

}

async function handleWebEventTrigger(url) {
  console.log("Event Triggered")
  console.log(url);
  let eventInfo = url.replace(/^agentbed:\/\//i, '');

  if (eventInfo.endsWith('/')) {
    eventInfo = eventInfo.slice(0, -1);
  }

  try {
    const decoded = decodeURIComponent(eventInfo);
    const parsed = JSON.parse(decoded);
    console.log('Received AgentBed event:', parsed);
    await handleEvent(parsed);
  } catch (e) {
    console.log('Failed to parse AgentBed event:', eventInfo, e);
  }

}


// App Event Trigger Section END !!! ---------------------------------------------------------------------------




// App Section !!! -------------------------------------------------------------------------------------

app.on('second-instance', (event, argv) => {
  const urlArg = argv.find(arg => arg.startsWith('agentbed://'));
  if (urlArg) {
    console.log('Second instance with protocol:', urlArg);
    if (mainWindow) {
      handleWebEventTrigger(urlArg);
    }
  }
});

app.whenReady().then(async () => {

  // Single Instance Check 
  const AppLock = app.requestSingleInstanceLock();
  if (!AppLock) {app.exit(0);}

  // Global Shortcuts
  globalShortcut.register('CommandOrControl+R', () => {
    console.log('Ctrl+R is disabled');
  });

  globalShortcut.register('F5', () => {
    console.log('F5 is disabled');
  });

  // Initialize DB 
  try{ initDb()}
  catch (error) { console.error('Failed to initialize database:', error); }

  // Load Store
  store = await loadStore();

  // Auto Updater
    // autoUpdater.setFeedURL({
    //   provider: 'github',
    //   owner: 'Nicky9319',
    //   repo: 'UserApplication_UpdateRepo',
    //   private: false,
    // });  

    // autoUpdater.checkForUpdates();
  

  // Creating Window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    frame: false, // Remove default titlebar
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      sandbox: false,
      contextIsolation: true,
      devTools: true,
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })


  // Loading HTML and Configuring the Window
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.setMenuBarVisibility(false);


  // Register Protocol with the Windows

  if (process.platform === 'win32') {
    const urlArg = process.argv.find(arg => arg.startsWith('agentbed://'));
    if (urlArg) {
      mainWindow.webContents.once('did-finish-load', () => {
        handleWebEventTrigger(urlArg)
      });
    }
  }


});

app.on('will-quit' , async (event) => {
  event.preventDefault();
  console.log("Quitting The Application !!!");

  globalShortcut.unregisterAll();
  app.exit(0);
});


// App Section END !!! --------------------------------------------------------------------------------









// function createWindow() {
//   initDb()
//   .then(() => { 
//     console.log('Database initialized successfully');
//     addAgentInfo({ id: 1, name: 'Agent 1', env: {} })

//   });
  
//   // Create the browser window.
//   const mainWindow = new BrowserWindow({
//     width: 1440,
//     height: 1024,
//     show: false,
//     autoHideMenuBar: true,
//     ...(process.platform === 'linux' ? { icon } : {}),
//     webPreferences: {
//       preload: join(__dirname, '../preload/preload.js'),
//       sandbox: false
//     }
//   })

//   mainWindow.on('ready-to-show', () => {
//     mainWindow.show()
//   })

//   mainWindow.webContents.setWindowOpenHandler((details) => {
//     shell.openExternal(details.url)
//     return { action: 'deny' }
//   })

//   // HMR for renderer base on electron-vite cli.
//   // Load the remote URL for development or the local html file for production.
//   if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
//     mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
//   } else {
//     mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
//   }
// }

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

// app.whenReady().then(() => {
//   // Set app user model id for windows
//   electronApp.setAppUserModelId('com.electron')

//   // Default open or close DevTools by F12 in development
//   // and ignore CommandOrControl + R in production.
//   // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils


//   // app.on('browser-window-created', (_, window) => {
//   //   optimizer.watchWindowShortcuts(window)
//   // })

//   // IPC test
//   ipcMain.on('ping', () => console.log('pong'))

//   createWindow()

//   app.on('activate', function () {
//     // On macOS it's common to re-create a window in the app when the
//     // dock icon is clicked and there are no other windows open.
//     if (BrowserWindow.getAllWindows().length === 0) createWindow()
//   })
// })

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     app.quit()
//   }
// })

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
