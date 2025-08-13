const path = require('path');
const { app } = require('electron');

let db; // Will hold the database instance

// Initialize the database with a default structure if it doesn't exist
export async function initDb() {
  // Wait for Electron app to be ready
  if (!app.isReady()) {
    await app.whenReady();
  }
  
  try {
    // Import the exact named exports from lowdb v3+
    const { Low } = await import('lowdb');
    const { JSONFile } = await import('lowdb/node');
    
    const dbPath = path.join(app.getPath('userData'), 'agentInfo.json');
    const adapter = new JSONFile(dbPath);
    
    // Create a default data structure first
    const defaultData = { 'agent-info': [] };
    db = new Low(adapter, defaultData);  // Pass defaultData as the second parameter
    
    await db.read();
    // Set default structure if data is null
    if (db.data === null) {
      db.data = defaultData;
    }
    
    console.log("Database initialized successfully at:", dbPath);
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

export async function getAgentsInfo() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  await db.read();
  return db.data['agent-info'];
}

export async function addAgentInfo(agentInfo) {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  await db.read();
  db.data['agent-info'].push(agentInfo);
  await db.write();
}

// Add new function to update agent environment variables
export async function updateAgentEnvVariable(agentId, varName, varValue) {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  await db.read();
  
  const agentIndex = db.data['agent-info'].findIndex(agent => agent.id === agentId);
  if (agentIndex === -1) {
    throw new Error(`Agent with ID ${agentId} not found`);
  }
  
  const envVarIndex = db.data['agent-info'][agentIndex].envVariables.findIndex(
    env => env.name === varName
  );
  
  if (envVarIndex === -1) {
    throw new Error(`Environment variable ${varName} not found for agent ${agentId}`);
  }
  
  // Update the value
  db.data['agent-info'][agentIndex].envVariables[envVarIndex].value = varValue;
  
  // Save the changes to the database
  await db.write();
  return db.data['agent-info'][agentIndex];
}

// module.exports = {
//   initDb,
//   getAgentsInfo,
//   addAgentInfo,
//   updateAgentEnvVariable
// };