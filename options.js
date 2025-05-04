// Options script for Advanced Trading Notifications extension

document.addEventListener('DOMContentLoaded', async () => {
  // Load configuration
  await loadConfig();
  
  // Set up event listeners
  setupEventListeners();
  
  // Initialize symbols list
  initSymbolsList();
  
  // Initialize conditional form elements
  initConditionalFormElements();
});

// Load configuration from storage
async function loadConfig() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({action: 'getConfig'}, (config) => {
      if (config) {
        // Update form with configuration values
        updateFormWithConfig(config);
      }
      resolve(config);
    });
  });
}

// Update form with configuration values
function updateFormWithConfig(config) {
  // This would be a more comprehensive version of the popup's updateSettingsForm
  // For now, we'll focus on the symbols list as an example
  
  // Update symbols list
  const symbolsList = document.getElementById('symbols-list');
  symbolsList.innerHTML = '';
  
  config.symbols.forEach(symbol => {
    addSymbolToList(symbol);
  });
  
  // Update other form fields based on advanced settings
  // This would be expanded to handle all the advanced settings
}

// Initialize symbols list
function initSymbolsList() {
  // Add event listener for adding symbols
  document.getElementById('add-symbol').addEventListener('click', () => {
    const newSymbolInput = document.getElementById('new-symbol');
    const symbol = newSymbolInput.value.trim().toUpperCase();
    
    if (symbol) {
      addSymbolToList(symbol);
      newSymbolInput.value = '';
    }
  });
  
  // Add event listener for Enter key in the input
  document.getElementById('new-symbol').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('add-symbol').click();
      e.preventDefault();
    }
  });
}

// Add symbol to the list
function addSymbolToList(symbol) {
  const symbolsList = document.getElementById('symbols-list');
  
  // Check if symbol already exists
  const existingSymbols = Array.from(symbolsList.querySelectorAll('.symbol-tag')).map(tag => 
    tag.querySelector('.symbol-text').textContent
  );
  
  if (existingSymbols.includes(symbol)) {
    return;
  }
  
  // Create symbol tag
  const symbolTag = document.createElement('div');
  symbolTag.className = 'symbol-tag';
  symbolTag.innerHTML = `
    <span class="symbol-text">${symbol}</span>
    <button class="remove-symbol" data-symbol="${symbol}">&times;</button>
  `;
  
  // Add event listener for removing symbol
  symbolTag.querySelector('.remove-symbol').addEventListener('click', (e) => {
    e.target.closest('.symbol-tag').remove();
  });
  
  // Add to list
  symbolsList.appendChild(symbolTag);
}

// Initialize conditional form elements
function initConditionalFormElements() {
  // Custom watchlist toggle
  document.getElementById('watchlist-custom').addEventListener('change', (e) => {
    document.getElementById('custom-watchlist').disabled = !e.target.checked;
  });
  
  // Additional indicators toggles
  document.getElementById('indicator-rsi').addEventListener('change', (e) => {
    document.getElementById('rsi-period').disabled = !e.target.checked;
  });
  
  document.getElementById('indicator-bb').addEventListener('change', (e) => {
    document.getElementById('bb-period').disabled = !e.target.checked;
  });
  
  // Volume confirmation toggle
  document.getElementById('require-volume').addEventListener('change', (e) => {
    document.getElementById('volume-threshold').disabled = !e.target.checked;
  });
  
  // Telegram notifications toggle
  document.getElementById('telegram-notifications').addEventListener('change', (e) => {
    document.getElementById('telegram-bot-token').disabled = !e.target.checked;
    document.getElementById('telegram-chat-id').disabled = !e.target.checked;
  });
}

// Set up event listeners
function setupEventListeners() {
  // Form submission
  document.getElementById('options-form').addEventListener('submit', (e) => {
    e.preventDefault();
    saveOptions();
  });
  
  // Reset options button
  document.getElementById('reset-options').addEventListener('click', resetOptions);
  
  // Watchlist checkboxes
  document.querySelectorAll('input[name="watchlists"]').forEach(checkbox => {
    checkbox.addEventListener('change', updateSymbolsFromWatchlists);
  });
}

// Update symbols from selected watchlists
function updateSymbolsFromWatchlists() {
  const watchlists = {
    tech: ['AAPL', 'MSFT', 'GOOGL', 'META', 'AMZN'],
    finance: ['JPM', 'BAC', 'GS', 'WFC', 'C'],
    crypto: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'ADA-USD']
  };
  
  // Get selected watchlists
  const selectedWatchlists = Array.from(document.querySelectorAll('input[name="watchlists"]:checked'))
    .map(checkbox => checkbox.value)
    .filter(value => value !== 'custom');
  
  // Get custom watchlist symbols
  let customSymbols = [];
  if (document.getElementById('watchlist-custom').checked) {
    const customWatchlistInput = document.getElementById('custom-watchlist').value;
    customSymbols = customWatchlistInput.split(',').map(s => s.trim().toUpperCase()).filter(s => s);
  }
  
  // Combine all selected watchlist symbols
  let allSymbols = [];
  selectedWatchlists.forEach(watchlist => {
    if (watchlists[watchlist]) {
      allSymbols = [...allSymbols, ...watchlists[watchlist]];
    }
  });
  
  // Add custom symbols
  allSymbols = [...allSymbols, ...customSymbols];
  
  // Remove duplicates
  allSymbols = [...new Set(allSymbols)];
  
  // Update symbols list
  const symbolsList = document.getElementById('symbols-list');
  symbolsList.innerHTML = '';
  
  allSymbols.forEach(symbol => {
    addSymbolToList(symbol);
  });
}

// Save options
function saveOptions() {
  // Get all symbols from the list
  const symbolsList = document.getElementById('symbols-list');
  const symbols = Array.from(symbolsList.querySelectorAll('.symbol-tag')).map(tag => 
    tag.querySelector('.symbol-text').textContent
  );
  
  // Get MACD settings
  const macdSettings = {
    fast: parseInt(document.getElementById('macd-fast').value),
    slow: parseInt(document.getElementById('macd-slow').value),
    signal: parseInt(document.getElementById('macd-signal').value)
  };
  
  // Get EMA settings
  const emaSettings = {
    fast: parseInt(document.getElementById('ema-fast').value),
    slow: parseInt(document.getElementById('ema-slow').value)
  };
  
  // Get additional indicators
  const additionalIndicators = Array.from(document.querySelectorAll('input[name="additionalIndicators"]:checked'))
    .map(checkbox => checkbox.value);
  
  // Get RSI settings
  const rsiSettings = {
    period: parseInt(document.getElementById('rsi-period').value)
  };
  
  // Get Bollinger Bands settings
  const bbSettings = {
    period: parseInt(document.getElementById('bb-period').value)
  };
  
  // Get alert conditions
  const alertConditions = {
    simultaneousCrossovers: document.getElementById('simultaneous-crossovers').checked,
    sequentialCrossovers: document.getElementById('sequential-crossovers').checked,
    maxCandleWindow: parseInt(document.getElementById('max-candle-window').value),
    directions: Array.from(document.querySelectorAll('input[name="alertConditions.directions"]:checked'))
      .map(checkbox => checkbox.value),
    requireVolume: document.getElementById('require-volume').checked,
    volumeThreshold: parseInt(document.getElementById('volume-threshold').value)
  };
  
  // Get notification methods
  const notificationMethods = {
    browser: document.getElementById('browser-notifications').checked,
    sound: document.getElementById('sound-alerts').checked,
    telegram: document.getElementById('telegram-notifications').checked
  };
  
  // Get Telegram settings
  const telegramSettings = {
    botToken: document.getElementById('telegram-bot-token').value,
    chatId: document.getElementById('telegram-chat-id').value
  };
  
  // Get AI settings
  const aiSettings = {
    includeExplanation: document.getElementById('include-ai-explanation').checked,
    provider: document.getElementById('ai-provider').value,
    explanationLength: document.getElementById('explanation-length').value
  };
  
  // Get API settings
  const apiSettings = {
    primarySource: document.getElementById('api-source').value,
    backupSource: document.getElementById('backup-api-source').value,
    requestLimit: parseInt(document.getElementById('api-request-limit').value),
    cacheDuration: parseInt(document.getElementById('data-caching').value)
  };
  
  // Create advanced config object
  const advancedConfig = {
    symbols,
    macdSettings,
    emaSettings,
    additionalIndicators,
    rsiSettings,
    bbSettings,
    alertConditions,
    notificationMethods,
    telegramSettings,
    aiSettings,
    apiSettings
  };
  
  // Get basic config from storage
  chrome.runtime.sendMessage({action: 'getConfig'}, (basicConfig) => {
    // Merge basic and advanced config
    const config = {
      ...basicConfig,
      symbols,
      timeframe: basicConfig.timeframe,
      apiSource: apiSettings.primarySource,
      apiKeys: basicConfig.apiKeys,
      notificationSettings: {
        simultaneousCrossovers: alertConditions.simultaneousCrossovers,
        sequentialCrossovers: alertConditions.sequentialCrossovers,
        maxCandleWindow: alertConditions.maxCandleWindow,
        includeAiExplanation: aiSettings.includeExplanation
      },
      // Add advanced settings
      advancedSettings: advancedConfig
    };
    
    // Save config
    chrome.runtime.sendMessage({action: 'updateConfig', config}, (response) => {
      if (response && response.success) {
        // Show success message
        showNotification('Settings saved successfully');
      } else {
        showNotification('Error saving settings', 'error');
      }
    });
  });
}

// Reset options to defaults
function resetOptions() {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    chrome.runtime.sendMessage({action: 'updateConfig', config: null}, (response) => {
      if (response && response.success) {
        // Reload page to refresh all form elements
        window.location.reload();
      } else {
        showNotification('Error resetting settings', 'error');
      }
    });
  }
}

// Show notification
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
