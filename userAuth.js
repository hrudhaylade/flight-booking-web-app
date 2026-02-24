
const { app, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');


const userDataPath = path.join(app.getPath('userData'), 'users.txt');


let currentUser = null;


function authenticateUser(username) {
  try {
    if (!fs.existsSync(userDataPath)) {
      return { success: false, message: 'User database not found' };
    }
    

    const fileContent = fs.readFileSync(userDataPath, 'utf8');
    const users = fileContent.split('\n').filter(user => user.trim() !== '');
    

    if (users.includes(username)) {
      currentUser = username;
      return { success: true, message: 'Authentication successful', username };
    } else {
      return { success: false, message: 'User not found' };
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, message: 'Authentication error: ' + error.message };
  }
}

function getCurrentUser() {
  return currentUser;
}

function logoutUser() {
  currentUser = null;
  return { success: true, message: 'Logged out successfully' };
}

function setupAuthHandlers() {
  ipcMain.handle('authenticate-user', async (event, username) => {
    return authenticateUser(username);
  });
  
  ipcMain.handle('get-current-user', async () => {
    return getCurrentUser();
  });
  
  ipcMain.handle('logout-user', async () => {
    return logoutUser();
  });
}

module.exports = {
  authenticateUser,
  getCurrentUser,
  logoutUser,
  setupAuthHandlers
};