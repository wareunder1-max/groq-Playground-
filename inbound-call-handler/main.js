/**
 * Main application entry point
 * Initializes the UIController and starts the application
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Speech-to-Text App initialized');
  
  // Initialize UIController
  const app = new UIController();
  app.init();
});
