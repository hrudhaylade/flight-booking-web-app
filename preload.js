const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electronAPI', {
    // Application control
    navigateTo: (pageName) => {
      ipcRenderer.send('navigate-to-page', pageName);
    },
    
    // File operations
    saveBooking: (bookingData) => {
      ipcRenderer.send('save-booking-dialog', bookingData);
    },
    onBookingLoaded: (callback) => {
      ipcRenderer.on('booking-loaded', (event, data) => callback(data));
    },
    onBookingSaved: (callback) => {
      ipcRenderer.on('booking-saved-success', () => callback());
    },
    
    // User management
    getUsers: async () => {
      return await ipcRenderer.invoke('get-users');
    },
    addUser: async (username) => {
      return await ipcRenderer.invoke('add-user', username);
    },
    removeUser: async (username) => {
      return await ipcRenderer.invoke('remove-user', username);
    },
    
    // Authentication
    authenticateUser: async (username) => {
      return await ipcRenderer.invoke('authenticate-user', username);
    },
    getCurrentUser: async () => {
      return await ipcRenderer.invoke('get-current-user');
    },
    logoutUser: async () => {
      return await ipcRenderer.invoke('logout-user');
    },
    
    // Navigation events
    onNavigate: (callback) => {
      ipcRenderer.on('navigate', (event, sectionId) => callback(sectionId));
    },
    onSaveBooking: (callback) => {
      ipcRenderer.on('save-booking', () => callback());
    },
    
    // Dialog helpers
    showMessage: (options) => {
      ipcRenderer.send('show-message', options);
    },
    
    // System info
    getAppVersion: () => process.env.npm_package_version || '1.0.0',
    getPlatform: () => process.platform
  }
);

// Also expose Node.js process info
contextBridge.exposeInMainWorld('processInfo', {
  platform: process.platform,
  arch: process.arch,
  version: process.version
});

// Let the renderer know the preload script has executed successfully
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency]);
  }
});