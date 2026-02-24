const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const userAuth = require('./userAuth');

let mainWindow;

const userDataPath = path.join(app.getPath('userData'), 'users.txt');

function initializeUsersFile() {
  if (!fs.existsSync(userDataPath)) {
    
    const defaultUsers = [
      'Abhipsha.P',
      'Hrudhay Lade',
      'Ashwin Kumar.S'
    ];
    
    fs.writeFileSync(userDataPath, defaultUsers.join('\n'), 'utf8');
    console.log('Created default users file at:', userDataPath);
  }
}

function getUsers() {
  try {
    if (!fs.existsSync(userDataPath)) {
      initializeUsersFile();
    }

    const fileContent = fs.readFileSync(userDataPath, 'utf8');
    return fileContent.split('\n').filter(user => user.trim() !== '');
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

function addUser(username) {
  try {
    const users = getUsers();
    
    if (users.includes(username)) {
      return { success: false, message: 'User already exists' };
    }
    
    users.push(username);
    
    fs.writeFileSync(userDataPath, users.join('\n'), 'utf8');
    
    return { success: true, message: 'User added successfully' };
  } catch (error) {
    console.error('Error adding user:', error);
    return { success: false, message: 'Error adding user: ' + error.message };
  }
}

function removeUser(username) {
  try {
    let users = getUsers();
    
    if (!users.includes(username)) {
      return { success: false, message: 'User not found' };
    }
    
   
    users = users.filter(user => user !== username);
    
    fs.writeFileSync(userDataPath, users.join('\n'), 'utf8');
    
    return { success: true, message: 'User removed successfully' };
  } catch (error) {
    console.error('Error removing user:', error);
    return { success: false, message: 'Error removing user: ' + error.message };
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'assets/icons/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('login.html');

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }


  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  createMenu();
  initializeUsersFile();
  userAuth.setupAuthHandlers(); 

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function showUserManagement() {
  const userManagementWindow = new BrowserWindow({
    width: 600,
    height: 500,
    parent: mainWindow,
    modal: true,
    title: 'User Management',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  userManagementWindow.loadFile('user-management.html');
  
  if (process.env.NODE_ENV === 'development') {
    userManagementWindow.webContents.openDevTools();
  }
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Save Booking',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('save-booking');
          }
        },
        {
          label: 'Load Booking',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            openBookingFile();
          }
        },
        {
          label: 'Manage Users',
          accelerator: 'CmdOrCtrl+U',
          click: () => {
            showUserManagement();
          }
        },
        { type: 'separator' },
        {
          label: 'Logout',
          click: () => {
            userAuth.logoutUser();
            mainWindow.loadFile('login.html');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Navigation',
      submenu: [
        {
          label: 'Welcome',
          click: () => {
            mainWindow.loadFile('traveldestination.html');
          }
        },
        {
          label: 'Home',
          click: () => {
            mainWindow.loadFile('index.html');
          }
        },
        {
          label: 'Support',
          click: () => {
            mainWindow.loadFile('support.html');
          }
        }
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'About SkyQuest',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              title: 'About SkyQuest',
              message: 'SkyQuest Flight Booking System',
              detail: 'Version 1.0.0\nDeveloped by SkyQuest Team\n© 2025 SkyQuest'
            });
          }
        }
      ]
    }
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function openBookingFile() {
  dialog.showOpenDialog(mainWindow, {
    title: 'Open Booking File',
    defaultPath: app.getPath('documents'),
    filters: [
      { name: 'Booking Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  }).then(result => {
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      try {
        const data = fs.readFileSync(filePath, 'utf8');
        mainWindow.webContents.send('booking-loaded', JSON.parse(data));
      } catch (err) {
        dialog.showErrorBox('Error Reading File', 'Could not read the selected file.');
        console.error('Error reading file:', err);
      }
    }
  }).catch(err => {
    console.error('Error opening file dialog:', err);
  });
}

ipcMain.on('save-booking-dialog', (event, bookingData) => {
  dialog.showSaveDialog(mainWindow, {
    title: 'Save Booking',
    defaultPath: path.join(app.getPath('documents'), 'booking.json'),
    filters: [
      { name: 'Booking Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  }).then(result => {
    if (!result.canceled && result.filePath) {
      try {
        fs.writeFileSync(result.filePath, JSON.stringify(bookingData, null, 2), 'utf8');
        mainWindow.webContents.send('booking-saved-success');
      } catch (err) {
        dialog.showErrorBox('Error Saving File', 'Could not save the booking data.');
        console.error('Error saving file:', err);
      }
    }
  }).catch(err => {
    console.error('Error showing save dialog:', err);
  });
});

ipcMain.on('show-message', (event, options) => {
  dialog.showMessageBox(mainWindow, options);
});

ipcMain.on('navigate-to-page', (event, pageName) => {
  const pageMap = {
    'welcome': 'welcome.html',
    'index': 'index.html',
    'support': 'support.html',
    'login': 'login.html',
    'traveldestination': 'traveldestination.html'
  };
  
  if (pageMap[pageName]) {
    mainWindow.loadFile(pageMap[pageName]);
  }
});

ipcMain.handle('get-users', async () => {
  return getUsers();
});

ipcMain.handle('add-user', async (event, username) => {
  return addUser(username);
});

ipcMain.handle('remove-user', async (event, username) => {
  return removeUser(username);
});

ipcMain.handle('authenticate-user', async (event, username) => {
  return userAuth.authenticateUser(username);
});

ipcMain.handle('get-current-user', async () => {
  return userAuth.getCurrentUser();
});

ipcMain.handle('logout-user', async () => {
  const result = userAuth.logoutUser();
  if (result.success) {
    mainWindow.loadFile('login.html');
  }
  return result;
});

app.on('before-quit', (event) => {
  const choice = dialog.showMessageBoxSync(mainWindow, {
    type: 'question',
    buttons: ['Yes', 'No'],
    title: 'Confirm Exit',
    message: 'Are you sure you want to quit?'
  });
  
  if (choice === 1) {
    event.preventDefault();
  }
});