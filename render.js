// This is a specific renderer for the welcome page
document.addEventListener('DOMContentLoaded', () => {
    // Replace the original goToIndex function with one that uses the Electron API
    // Only if we're running in Electron
    if (window.electronAPI) {
      window.goToIndex = function() {
        window.electronAPI.navigateTo('index');
      };
      
      // Handle the links to other pages
      const indexLink = document.querySelector('a[href="index.html"]');
      if (indexLink) {
        indexLink.addEventListener('click', (e) => {
          e.preventDefault();
          window.electronAPI.navigateTo('index');
        });
      }
      
      const supportLink = document.querySelector('a[href="support.html"]');
      if (supportLink) {
        supportLink.addEventListener('click', (e) => {
          e.preventDefault();
          window.electronAPI.navigateTo('support');
        });
      }
    }
  });