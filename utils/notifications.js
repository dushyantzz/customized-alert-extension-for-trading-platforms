// Notification handling utilities

/**
 * Send a browser notification
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} iconUrl - URL to the notification icon
 * @returns {Promise} - Promise that resolves when notification is created
 */
export function sendNotification(title, message, iconUrl = 'icons/icon128.png') {
  return new Promise((resolve) => {
    chrome.notifications.create({
      type: 'basic',
      iconUrl,
      title,
      message,
      priority: 2
    }, (notificationId) => {
      resolve(notificationId);
    });
  });
}

/**
 * Format a crossover alert message
 * @param {string} symbol - Trading symbol
 * @param {Object} crossover - Crossover data
 * @param {Object} candles - Candle data
 * @returns {Object} - Formatted title and message
 */
export function formatAlertMessage(symbol, crossover, candles) {
  const { type, direction } = crossover;
  let title, message;
  
  // Get the current price
  const currentPrice = candles[candles.length - 1].close;
  const formattedPrice = currentPrice.toFixed(2);
  
  if (type === 'simultaneous') {
    title = `${symbol}: Simultaneous ${direction.toUpperCase()} Crossover`;
    message = `Both MACD and EMA indicators have crossed ${direction === 'bullish' ? 'upward' : 'downward'} on the same candle.\nCurrent price: $${formattedPrice}`;
  } else if (type === 'sequential') {
    const { sequence, window } = crossover;
    const firstIndicator = sequence.split('-then-')[0].toUpperCase();
    const secondIndicator = sequence.split('-then-')[1].toUpperCase();
    
    title = `${symbol}: Sequential ${direction.toUpperCase()} Crossover`;
    message = `${firstIndicator} crossed ${direction === 'bullish' ? 'upward' : 'downward'} followed by ${secondIndicator} within ${window} candles.\nCurrent price: $${formattedPrice}`;
  }
  
  return { title, message };
}

/**
 * Save alert to history
 * @param {string} symbol - Trading symbol
 * @param {Object} crossover - Crossover data
 * @param {string} aiExplanation - AI-generated explanation
 * @returns {Promise} - Promise that resolves when alert is saved
 */
export function saveAlertToHistory(symbol, crossover, aiExplanation = '') {
  return new Promise((resolve) => {
    chrome.storage.local.get(['alertHistory'], (result) => {
      const alertHistory = result.alertHistory || [];
      
      // Create alert object
      const alert = {
        id: Date.now().toString(),
        symbol,
        timestamp: new Date().toISOString(),
        crossover,
        aiExplanation
      };
      
      // Add to history
      alertHistory.unshift(alert);
      
      // Limit history to 100 items
      if (alertHistory.length > 100) {
        alertHistory.pop();
      }
      
      // Save to storage
      chrome.storage.local.set({ alertHistory }, () => {
        resolve(alert);
      });
    });
  });
}

/**
 * Get alert history
 * @param {number} limit - Maximum number of alerts to retrieve
 * @returns {Promise<Array>} - Promise that resolves with alert history
 */
export function getAlertHistory(limit = 50) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['alertHistory'], (result) => {
      const alertHistory = result.alertHistory || [];
      resolve(alertHistory.slice(0, limit));
    });
  });
}

/**
 * Clear alert history
 * @returns {Promise} - Promise that resolves when history is cleared
 */
export function clearAlertHistory() {
  return new Promise((resolve) => {
    chrome.storage.local.set({ alertHistory: [] }, resolve);
  });
}

/**
 * Mark alert as read
 * @param {string} alertId - ID of the alert to mark as read
 * @returns {Promise} - Promise that resolves when alert is marked as read
 */
export function markAlertAsRead(alertId) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['alertHistory'], (result) => {
      const alertHistory = result.alertHistory || [];
      
      // Find and update the alert
      const updatedHistory = alertHistory.map(alert => {
        if (alert.id === alertId) {
          return { ...alert, read: true };
        }
        return alert;
      });
      
      // Save to storage
      chrome.storage.local.set({ alertHistory: updatedHistory }, () => {
        resolve();
      });
    });
  });
}
