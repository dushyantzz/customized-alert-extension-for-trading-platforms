// Popup script for Advanced Trading Notifications extension

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize tabs
  initTabs();

  // Load configuration and update UI
  await loadConfig();

  // Load alert history
  await loadAlertHistory();

  // Set up event listeners
  setupEventListeners();

  // Update status indicator
  updateStatusIndicator('active', 'Monitoring active');
});

// Initialize tab functionality
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and panes
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));

      // Add active class to clicked button and corresponding pane
      button.classList.add('active');
      const tabId = button.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });
}

// Load configuration from storage
async function loadConfig() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({action: 'getConfig'}, (config) => {
      if (config) {
        // Update settings form
        updateSettingsForm(config);

        // Update symbols display
        updateSymbolsDisplay(config.symbols);
      }
      resolve(config);
    });
  });
}

// Update settings form with configuration values
function updateSettingsForm(config) {
  // Update symbols input
  document.getElementById('symbols').value = config.symbols.join(', ');

  // Update timeframe select
  document.getElementById('timeframe').value = config.timeframe;

  // Update API source select
  document.getElementById('api-source').value = config.apiSource;

  // Update notification settings
  document.getElementById('simultaneous-crossovers').checked = config.notificationSettings.simultaneousCrossovers;
  document.getElementById('sequential-crossovers').checked = config.notificationSettings.sequentialCrossovers;
  document.getElementById('max-candle-window').value = config.notificationSettings.maxCandleWindow;
  document.getElementById('include-ai-explanation').checked = config.notificationSettings.includeAiExplanation;

  // Check API status
  checkApiStatus();
}

// Update symbols display in dashboard
function updateSymbolsDisplay(symbols) {
  const container = document.getElementById('symbols-container');
  container.innerHTML = '';

  if (symbols.length === 0) {
    container.innerHTML = '<p class="no-data">No symbols configured</p>';
    return;
  }

  // Fetch latest prices for each symbol
  symbols.forEach(symbol => {
    const card = document.createElement('div');
    card.className = 'symbol-card';
    card.innerHTML = `
      <div class="symbol-name">${symbol}</div>
      <div class="symbol-price">Loading...</div>
      <div class="price-change">...</div>
    `;
    container.appendChild(card);

    // Fetch latest price (this would be replaced with actual API call)
    fetchLatestPrice(symbol).then(priceData => {
      if (priceData) {
        const priceElement = card.querySelector('.symbol-price');
        const changeElement = card.querySelector('.price-change');

        priceElement.textContent = `$${priceData.price.toFixed(2)}`;

        const changeClass = priceData.change >= 0 ? 'positive' : 'negative';
        const changeSign = priceData.change >= 0 ? '+' : '';
        changeElement.textContent = `${changeSign}${priceData.change.toFixed(2)}% today`;
        changeElement.className = `price-change ${changeClass}`;
      }
    });
  });
}

// Fetch latest price for a symbol (placeholder function)
async function fetchLatestPrice(symbol) {
  // This would be replaced with actual API call
  // For now, return random data for demonstration
  return new Promise(resolve => {
    setTimeout(() => {
      const randomPrice = 100 + Math.random() * 100;
      const randomChange = (Math.random() * 6) - 3; // -3% to +3%

      resolve({
        price: randomPrice,
        change: randomChange
      });
    }, 500);
  });
}

// Load alert history
async function loadAlertHistory() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['alertHistory'], (result) => {
      const alertHistory = result.alertHistory || [];

      // Update alerts tab
      updateAlertsTab(alertHistory);

      // Update recent alerts in dashboard
      updateRecentAlerts(alertHistory.slice(0, 3));

      resolve(alertHistory);
    });
  });
}

// Update alerts tab with alert history
function updateAlertsTab(alertHistory) {
  const container = document.getElementById('alerts-container');
  container.innerHTML = '';

  if (alertHistory.length === 0) {
    container.innerHTML = '<p class="no-data">No alerts found</p>';
    return;
  }

  alertHistory.forEach(alert => {
    const alertElement = createAlertElement(alert);
    container.appendChild(alertElement);
  });
}

// Update recent alerts in dashboard
function updateRecentAlerts(recentAlerts) {
  const container = document.getElementById('recent-alerts-container');
  container.innerHTML = '';

  if (recentAlerts.length === 0) {
    container.innerHTML = '<p class="no-data">No recent alerts</p>';
    return;
  }

  recentAlerts.forEach(alert => {
    const alertElement = createAlertElement(alert);
    container.appendChild(alertElement);
  });
}

// Create alert element
function createAlertElement(alert) {
  const alertElement = document.createElement('div');
  alertElement.className = 'alert-item';
  alertElement.dataset.id = alert.id;

  // Format timestamp
  const timestamp = new Date(alert.timestamp);
  const formattedTime = timestamp.toLocaleString();

  // Determine alert type class
  const typeClass = alert.crossover.direction === 'bullish' ? 'bullish' : 'bearish';

  alertElement.innerHTML = `
    <div class="alert-header">
      <span class="alert-symbol">${alert.symbol}</span>
      <span class="alert-time">${formattedTime}</span>
    </div>
    <div class="alert-type ${typeClass}">
      ${alert.crossover.direction.toUpperCase()} ${alert.crossover.type.toUpperCase()} Crossover
    </div>
    <div class="alert-description">
      ${alert.crossover.description}
    </div>
    <div class="alert-actions">
      <button class="alert-action view-explanation" data-id="${alert.id}">View AI Explanation</button>
    </div>
  `;

  // Add event listener for view explanation button
  alertElement.querySelector('.view-explanation').addEventListener('click', () => {
    viewAiExplanation(alert);
  });

  return alertElement;
}

// View AI explanation for an alert
function viewAiExplanation(alert) {
  // Add AI message to chat
  const aiMessages = document.getElementById('ai-messages');

  // Add user message
  const userMessage = document.createElement('div');
  userMessage.className = 'ai-message user';
  userMessage.innerHTML = `
    <div class="ai-message-content">
      <p>Tell me about the ${alert.crossover.direction} ${alert.crossover.type} crossover for ${alert.symbol}</p>
    </div>
  `;
  aiMessages.appendChild(userMessage);

  // Add AI response
  const aiMessage = document.createElement('div');
  aiMessage.className = 'ai-message';

  if (alert.aiExplanation) {
    aiMessage.innerHTML = `
      <div class="ai-message-content">
        <p>${alert.aiExplanation}</p>
      </div>
    `;
  } else {
    // If no AI explanation, generate one
    aiMessage.innerHTML = `
      <div class="ai-message-content">
        <p>Generating analysis for ${alert.symbol} ${alert.crossover.direction} ${alert.crossover.type} crossover...</p>
      </div>
    `;

    // This would be replaced with actual API call to Perplexity or Gemini
    generateAiExplanation(alert).then(explanation => {
      aiMessage.querySelector('p').textContent = explanation;

      // Save explanation to alert history
      saveAiExplanationToAlert(alert.id, explanation);
    });
  }

  aiMessages.appendChild(aiMessage);

  // Scroll to bottom of messages
  aiMessages.scrollTop = aiMessages.scrollHeight;

  // Expand AI assistant if collapsed
  document.querySelector('.ai-assistant-content').style.display = 'flex';
}

// Generate AI explanation (placeholder function)
async function generateAiExplanation(alert) {
  // This would be replaced with actual API call to Perplexity or Gemini
  return new Promise(resolve => {
    setTimeout(() => {
      const explanations = {
        'bullish': {
          'simultaneous': `This ${alert.symbol} bullish crossover is a strong signal. Both MACD and EMA indicators crossing upward simultaneously often indicates significant momentum. Consider this a potential entry point for a long position, but confirm with volume and broader market trends. Set a stop loss below recent support.`,
          'sequential': `For ${alert.symbol}, seeing a sequential bullish pattern (${alert.crossover.sequence}) within ${alert.crossover.window} candles is promising. This suggests building momentum that's being confirmed by multiple indicators. This pattern often precedes a continued uptrend, especially if accompanied by increasing volume.`
        },
        'bearish': {
          'simultaneous': `The simultaneous bearish crossover on ${alert.symbol} is a warning sign. Both MACD and EMA turning downward together often signals a strong reversal or continuation of a downtrend. Consider protecting long positions or looking for short opportunities, but be aware of potential support levels nearby.`,
          'sequential': `This sequential bearish pattern on ${alert.symbol} (${alert.crossover.sequence}) developing over ${alert.crossover.window} candles suggests weakening momentum. The confirmation from multiple indicators increases the reliability of this signal. Watch for support levels that might cause a bounce.`
        }
      };

      resolve(explanations[alert.crossover.direction][alert.crossover.type]);
    }, 1000);
  });
}

// Save AI explanation to alert history
function saveAiExplanationToAlert(alertId, explanation) {
  chrome.storage.local.get(['alertHistory'], (result) => {
    const alertHistory = result.alertHistory || [];

    // Find and update the alert
    const updatedHistory = alertHistory.map(alert => {
      if (alert.id === alertId) {
        return { ...alert, aiExplanation: explanation };
      }
      return alert;
    });

    // Save updated history
    chrome.storage.local.set({ alertHistory: updatedHistory });
  });
}

// Set up event listeners
function setupEventListeners() {
  // Settings form submission
  document.getElementById('settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    saveSettings();
  });

  // Reset settings button
  document.getElementById('reset-settings').addEventListener('click', resetSettings);

  // Refresh data button
  document.getElementById('refresh-data').addEventListener('click', refreshData);

  // Clear alerts button
  document.getElementById('clear-alerts').addEventListener('click', clearAlerts);

  // Toggle AI assistant
  document.getElementById('toggle-ai').addEventListener('click', toggleAiAssistant);

  // Send question to AI
  document.getElementById('send-question').addEventListener('click', sendQuestionToAi);
  document.getElementById('ai-question').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendQuestionToAi();
    }
  });

  // Custom alerts
  document.getElementById('create-custom-alert').addEventListener('click', createCustomAlert);
  document.getElementById('custom-alert-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      createCustomAlert();
    }
  });

  // Check custom alerts button
  document.getElementById('check-custom-alerts').addEventListener('click', checkCustomAlerts);

  // Load custom alerts
  loadCustomAlerts();

  // Check API status
  checkApiStatus();
}

// Save settings
function saveSettings() {
  // Get form values
  const symbolsInput = document.getElementById('symbols').value;
  const symbols = symbolsInput.split(',').map(s => s.trim()).filter(s => s);

  const timeframe = document.getElementById('timeframe').value;
  const apiSource = document.getElementById('api-source').value;

  const notificationSettings = {
    simultaneousCrossovers: document.getElementById('simultaneous-crossovers').checked,
    sequentialCrossovers: document.getElementById('sequential-crossovers').checked,
    maxCandleWindow: parseInt(document.getElementById('max-candle-window').value),
    includeAiExplanation: document.getElementById('include-ai-explanation').checked
  };

  // Get existing config to preserve custom alerts
  chrome.runtime.sendMessage({action: 'getConfig'}, (existingConfig) => {
    // Create config object
    const config = {
      symbols,
      timeframe,
      apiSource,
      notificationSettings,
      customAlerts: existingConfig.customAlerts || []
    };

    // Save config
    chrome.runtime.sendMessage({action: 'updateConfig', config}, (response) => {
      if (response && response.success) {
        // Update UI
        updateSymbolsDisplay(symbols);

        // Show success message
        showNotification('Settings saved successfully');
      } else {
        showNotification('Error saving settings', 'error');
      }
    });
  });
}

// Reset settings to defaults
function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    chrome.runtime.sendMessage({action: 'getConfig'}, (config) => {
      // Reset to default config
      chrome.runtime.sendMessage({action: 'updateConfig', config: null}, (response) => {
        if (response && response.success) {
          // Reload config
          loadConfig();

          // Show success message
          showNotification('Settings reset to defaults');
        } else {
          showNotification('Error resetting settings', 'error');
        }
      });
    });
  }
}

// Refresh data
function refreshData() {
  updateStatusIndicator('loading', 'Fetching data...');

  chrome.runtime.sendMessage({action: 'fetchDataNow'}, (response) => {
    if (response && response.success) {
      // Reload alert history
      loadAlertHistory();

      // Update status
      updateStatusIndicator('active', 'Data refreshed');

      // Show success message
      showNotification('Data refreshed successfully');
    } else {
      updateStatusIndicator('error', 'Error fetching data');
      showNotification('Error refreshing data', 'error');
    }
  });
}

// Clear alerts
function clearAlerts() {
  if (confirm('Are you sure you want to clear all alerts?')) {
    chrome.storage.local.set({alertHistory: []}, () => {
      // Update UI
      updateAlertsTab([]);
      updateRecentAlerts([]);

      // Show success message
      showNotification('Alerts cleared successfully');
    });
  }
}

// Toggle AI assistant
function toggleAiAssistant() {
  const content = document.querySelector('.ai-assistant-content');
  const button = document.getElementById('toggle-ai');

  if (content.style.display === 'none') {
    content.style.display = 'flex';
    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    `;
  } else {
    content.style.display = 'none';
    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    `;
  }
}

// Send question to AI
function sendQuestionToAi() {
  const questionInput = document.getElementById('ai-question');
  const question = questionInput.value.trim();

  if (!question) return;

  // Clear input
  questionInput.value = '';

  // Add user message to chat
  const aiMessages = document.getElementById('ai-messages');

  const userMessage = document.createElement('div');
  userMessage.className = 'ai-message user';
  userMessage.innerHTML = `
    <div class="ai-message-content">
      <p>${question}</p>
    </div>
  `;
  aiMessages.appendChild(userMessage);

  // Add AI response (loading)
  const aiMessage = document.createElement('div');
  aiMessage.className = 'ai-message';
  aiMessage.innerHTML = `
    <div class="ai-message-content">
      <p>Thinking...</p>
    </div>
  `;
  aiMessages.appendChild(aiMessage);

  // Scroll to bottom of messages
  aiMessages.scrollTop = aiMessages.scrollHeight;

  // This would be replaced with actual API call to Perplexity or Gemini
  answerQuestion(question).then(answer => {
    aiMessage.querySelector('p').textContent = answer;

    // Scroll to bottom of messages
    aiMessages.scrollTop = aiMessages.scrollHeight;
  });
}

// Answer question (placeholder function)
async function answerQuestion(question) {
  // This would be replaced with actual API call to Perplexity or Gemini
  return new Promise(resolve => {
    setTimeout(() => {
      // Simple keyword-based responses for demonstration
      const lowerQuestion = question.toLowerCase();

      if (lowerQuestion.includes('macd') && lowerQuestion.includes('ema')) {
        resolve('MACD and EMA are both trend-following indicators. MACD (Moving Average Convergence Divergence) measures the relationship between two moving averages, while EMA (Exponential Moving Average) gives more weight to recent prices. When used together, they can provide stronger confirmation of trend changes.');
      } else if (lowerQuestion.includes('macd')) {
        resolve('MACD (Moving Average Convergence Divergence) is a trend-following momentum indicator that shows the relationship between two moving averages of a security\'s price. A bullish crossover occurs when the MACD line crosses above the signal line, while a bearish crossover occurs when the MACD line crosses below the signal line.');
      } else if (lowerQuestion.includes('ema')) {
        resolve('EMA (Exponential Moving Average) is a type of moving average that gives more weight to recent prices, making it more responsive to new information. Traders often use crossovers between shorter and longer EMAs to identify trend changes. For example, when a 9-period EMA crosses above a 21-period EMA, it may signal a bullish trend.');
      } else if (lowerQuestion.includes('crossover')) {
        resolve('A crossover occurs when one indicator line crosses another. In technical analysis, crossovers are important signals that can indicate potential trend changes or continuation. The significance of a crossover depends on the indicators involved and the market context.');
      } else if (lowerQuestion.includes('bullish')) {
        resolve('A bullish signal suggests that prices may rise. In the context of this extension, a bullish crossover occurs when faster indicators cross above slower ones (like MACD line crossing above signal line, or shorter EMA crossing above longer EMA). These signals are stronger when multiple indicators confirm each other.');
      } else if (lowerQuestion.includes('bearish')) {
        resolve('A bearish signal suggests that prices may fall. In the context of this extension, a bearish crossover occurs when faster indicators cross below slower ones (like MACD line crossing below signal line, or shorter EMA crossing below longer EMA). These signals are stronger when multiple indicators confirm each other.');
      } else {
        resolve('I\'m your trading assistant focused on technical indicators and alerts. I can explain concepts like MACD, EMA, crossovers, and their implications. I can also provide context for specific alerts you receive. What would you like to know about?');
      }
    }, 1000);
  });
}

// Update status indicator
function updateStatusIndicator(status, text) {
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');

  // Remove all status classes
  statusDot.classList.remove('active', 'error', 'loading');

  // Add appropriate class
  if (status === 'active') {
    statusDot.classList.add('active');
  } else if (status === 'error') {
    statusDot.classList.add('error');
  } else if (status === 'loading') {
    statusDot.classList.add('loading');
  }

  // Update text
  statusText.textContent = text;
}

// Create a custom alert
function createCustomAlert() {
  const alertInput = document.getElementById('custom-alert-input');
  const alertText = alertInput.value.trim();

  if (!alertText) {
    showNotification('Please enter an alert description', 'error');
    return;
  }

  // Show loading state
  alertInput.disabled = true;
  document.getElementById('create-custom-alert').disabled = true;
  showNotification('Creating alert...', 'info');

  // Send to background script for processing
  chrome.runtime.sendMessage({
    action: 'createCustomAlert',
    alertText: alertText
  }, (response) => {
    // Reset input
    alertInput.value = '';
    alertInput.disabled = false;
    document.getElementById('create-custom-alert').disabled = false;

    if (response && response.success) {
      showNotification('Custom alert created successfully');
      loadCustomAlerts(); // Refresh the alerts list
    } else {
      showNotification(`Error creating alert: ${response?.error || 'Unknown error'}`, 'error');
    }
  });
}

// Load custom alerts
function loadCustomAlerts() {
  chrome.runtime.sendMessage({action: 'getConfig'}, (config) => {
    if (config && config.customAlerts) {
      updateCustomAlertsDisplay(config.customAlerts);
    }
  });
}

// Update custom alerts display
function updateCustomAlertsDisplay(customAlerts) {
  const container = document.getElementById('custom-alerts-container');
  container.innerHTML = '';

  if (!customAlerts || customAlerts.length === 0) {
    container.innerHTML = '<p class="no-data">No custom alerts created</p>';
    return;
  }

  customAlerts.forEach(alert => {
    const alertElement = createCustomAlertElement(alert);
    container.appendChild(alertElement);
  });
}

// Create custom alert element
function createCustomAlertElement(alert) {
  const alertElement = document.createElement('div');
  alertElement.className = 'custom-alert-item';
  alertElement.dataset.id = alert.id;

  // Format timestamp
  const timestamp = new Date(alert.createdAt);
  const formattedTime = timestamp.toLocaleString();

  // Determine alert type class based on condition
  const typeClass = alert.condition.direction === 'bullish' ? 'bullish' :
                   alert.condition.direction === 'bearish' ? 'bearish' : 'neutral';

  alertElement.innerHTML = `
    <div class="alert-header">
      <span class="alert-symbol">${alert.condition.symbol || 'Unknown'}</span>
      <span class="alert-time">Created: ${formattedTime}</span>
    </div>
    <div class="alert-description ${typeClass}">
      ${alert.text}
    </div>
    <div class="alert-details">
      <span class="alert-indicator">${alert.condition.indicator || 'Custom'}</span>
      <span class="alert-condition">${alert.condition.condition || 'condition'}</span>
      ${alert.condition.threshold ? `<span class="alert-threshold">Threshold: ${alert.condition.threshold}</span>` : ''}
    </div>
    <div class="alert-actions">
      <button class="alert-action delete-alert" data-id="${alert.id}">Delete</button>
      <label class="toggle-switch">
        <input type="checkbox" class="toggle-alert" data-id="${alert.id}" ${alert.active ? 'checked' : ''}>
        <span class="toggle-slider"></span>
        <span class="toggle-label">${alert.active ? 'Active' : 'Inactive'}</span>
      </label>
    </div>
  `;

  // Add event listener for delete button
  alertElement.querySelector('.delete-alert').addEventListener('click', () => {
    deleteCustomAlert(alert.id);
  });

  // Add event listener for toggle switch
  alertElement.querySelector('.toggle-alert').addEventListener('change', (e) => {
    toggleCustomAlert(alert.id, e.target.checked);
  });

  return alertElement;
}

// Delete custom alert
function deleteCustomAlert(alertId) {
  if (confirm('Are you sure you want to delete this alert?')) {
    chrome.runtime.sendMessage({
      action: 'deleteCustomAlert',
      alertId: alertId
    }, (response) => {
      if (response && response.success) {
        showNotification('Alert deleted successfully');
        loadCustomAlerts(); // Refresh the alerts list
      } else {
        showNotification(`Error deleting alert: ${response?.error || 'Unknown error'}`, 'error');
      }
    });
  }
}

// Toggle custom alert active state
function toggleCustomAlert(alertId, active) {
  chrome.runtime.sendMessage({action: 'getConfig'}, (config) => {
    if (config && config.customAlerts) {
      const alertIndex = config.customAlerts.findIndex(alert => alert.id === alertId);

      if (alertIndex !== -1) {
        config.customAlerts[alertIndex].active = active;

        chrome.runtime.sendMessage({action: 'updateConfig', config}, (response) => {
          if (response && response.success) {
            showNotification(`Alert ${active ? 'activated' : 'deactivated'}`);

            // Update toggle label
            const toggleLabel = document.querySelector(`.toggle-alert[data-id="${alertId}"]`)
              .parentElement.querySelector('.toggle-label');
            toggleLabel.textContent = active ? 'Active' : 'Inactive';
          } else {
            showNotification('Error updating alert', 'error');
          }
        });
      }
    }
  });
}

// Check custom alerts
function checkCustomAlerts() {
  showNotification('Checking custom alerts...', 'info');

  chrome.runtime.sendMessage({action: 'checkCustomAlerts'}, (response) => {
    if (response && response.success) {
      if (response.alerts && response.alerts.length > 0) {
        showNotification(`${response.alerts.length} alert(s) triggered!`);
      } else {
        showNotification('No alerts triggered');
      }
    } else {
      showNotification(`Error checking alerts: ${response?.error || 'Unknown error'}`, 'error');
    }
  });
}

// Check API status
function checkApiStatus() {
  chrome.runtime.sendMessage({action: 'getConfig'}, async (config) => {
    // Update data API status
    const dataApiStatus = document.getElementById('data-api-status');
    const aiApiStatus = document.getElementById('ai-api-status');

    // Check if we have at least one data API key
    const hasDataApiKey = config.apiSource && config.apiSource !== '';
    dataApiStatus.textContent = hasDataApiKey ? 'Connected' : 'Not configured';
    dataApiStatus.className = hasDataApiKey ? 'status-value connected' : 'status-value error';

    // Check if we have at least one AI API key
    const hasAiApiKey = config.notificationSettings && config.notificationSettings.includeAiExplanation;
    aiApiStatus.textContent = hasAiApiKey ? 'Connected' : 'Not configured';
    aiApiStatus.className = hasAiApiKey ? 'status-value connected' : 'status-value error';
  });
}

// Show notification (temporary message)
function showNotification(message, type = 'success') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;

  // Add to body
  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}
