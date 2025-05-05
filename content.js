// Content script for Advanced Trading Notifications extension
// This script is injected into trading websites to extract data and inject UI elements

// TradingView utilities embedded directly in content script
// (Cannot use ES6 imports in content scripts without special setup)

/**
 * Extract chart data from TradingView page
 * @returns {Object} - Chart data extracted from TradingView
 */
function extractChartData() {
  try {
    // Get the current symbol from the URL or page elements
    const symbol = extractSymbolFromPage();

    // Get the current timeframe from the UI
    const timeframe = extractTimeframeFromPage();

    // Get price data if available
    const priceData = extractPriceDataFromPage();

    return {
      symbol,
      timeframe,
      priceData,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error extracting TradingView data:', error);
    return null;
  }
}

/**
 * Extract the current symbol from TradingView page
 * @returns {string} - Current symbol
 */
function extractSymbolFromPage() {
  // Try to get from URL first
  const urlMatch = window.location.pathname.match(/chart\/(.*?)\//) ||
                  window.location.search.match(/symbol=(.*?)(&|$)/);

  if (urlMatch && urlMatch[1]) {
    return urlMatch[1].toUpperCase();
  }

  // Try to get from page elements
  const symbolElement = document.querySelector('.chart-container .chart-markup-table .apply-common-tooltip');
  if (symbolElement) {
    return symbolElement.textContent.trim().toUpperCase();
  }

  // Fallback to page title
  const titleMatch = document.title.match(/(.*?)\s+—\s+/);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].toUpperCase();
  }

  return 'UNKNOWN';
}

/**
 * Extract the current timeframe from TradingView page
 * @returns {string} - Current timeframe
 */
function extractTimeframeFromPage() {
  // Try to get from UI elements
  const timeframeElement = document.querySelector('.chart-container .apply-common-tooltip[data-name="timeframe"]');
  if (timeframeElement) {
    return timeframeElement.textContent.trim();
  }

  // Try to get from URL
  const urlMatch = window.location.search.match(/interval=(.*?)(&|$)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }

  return 'UNKNOWN';
}

/**
 * Extract price data from TradingView page
 * @returns {Object|null} - Price data if available
 */
function extractPriceDataFromPage() {
  try {
    // Try to get current price
    const priceElement = document.querySelector('.chart-container .price-axis__last-value');
    if (priceElement) {
      const currentPrice = parseFloat(priceElement.textContent.replace(/[^0-9.-]+/g, ''));

      return {
        currentPrice,
        timestamp: new Date().toISOString()
      };
    }

    return null;
  } catch (error) {
    console.error('Error extracting price data:', error);
    return null;
  }
}

/**
 * Check if the current page is TradingView
 * @returns {boolean} - True if on TradingView
 */
function isTradingViewPage() {
  return window.location.hostname.includes('tradingview.com');
}

/**
 * Add custom alert UI to TradingView page
 * @param {Function} createAlertCallback - Callback function to create an alert
 */
function injectAlertUI(createAlertCallback) {
  // Check if our UI is already injected
  if (document.getElementById('trading-extension-alert-button')) {
    return;
  }

  // Create the alert button
  const alertButton = document.createElement('button');
  alertButton.id = 'trading-extension-alert-button';
  alertButton.className = 'trading-extension-button';
  alertButton.innerHTML = '🔔 Create Alert';
  alertButton.style.cssText = `
    position: fixed;
    top: 70px;
    right: 20px;
    z-index: 9999;
    background-color: #2962FF;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  `;

  // Add click event
  alertButton.addEventListener('click', () => {
    showAlertDialog(createAlertCallback);
  });

  // Add to page
  document.body.appendChild(alertButton);

  // Add styles
  const styles = document.createElement('style');
  styles.textContent = `
    .trading-extension-dialog {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: #1E222D;
      border-radius: 8px;
      padding: 20px;
      width: 400px;
      max-width: 90vw;
      z-index: 10000;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      color: #D1D4DC;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    }

    .trading-extension-dialog h2 {
      margin-top: 0;
      color: white;
      font-size: 18px;
      font-weight: 600;
    }

    .trading-extension-dialog input,
    .trading-extension-dialog textarea {
      width: 100%;
      background-color: #2A2E39;
      border: 1px solid #363A45;
      border-radius: 4px;
      padding: 8px 12px;
      color: white;
      margin-bottom: 15px;
      font-size: 14px;
    }

    .trading-extension-dialog textarea {
      height: 100px;
      resize: vertical;
    }

    .trading-extension-dialog-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    .trading-extension-dialog-button {
      padding: 8px 16px;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      font-size: 14px;
    }

    .trading-extension-dialog-button.primary {
      background-color: #2962FF;
      color: white;
    }

    .trading-extension-dialog-button.secondary {
      background-color: transparent;
      color: #D1D4DC;
      border: 1px solid #363A45;
    }

    .trading-extension-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0,0,0,0.5);
      z-index: 9999;
    }
  `;

  document.head.appendChild(styles);
}

/**
 * Show alert creation dialog
 * @param {Function} createAlertCallback - Callback function to create an alert
 */
function showAlertDialog(createAlertCallback) {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'trading-extension-overlay';

  // Create dialog
  const dialog = document.createElement('div');
  dialog.className = 'trading-extension-dialog';

  // Get current symbol
  const symbol = extractSymbolFromPage();

  dialog.innerHTML = `
    <h2>Create Custom Alert</h2>
    <p>Current Symbol: <strong>${symbol}</strong></p>

    <label for="alert-description">Describe your alert condition:</label>
    <textarea id="alert-description" placeholder="e.g., Alert me when MACD crosses above signal line"></textarea>

    <div class="trading-extension-dialog-buttons">
      <button id="cancel-alert" class="trading-extension-dialog-button secondary">Cancel</button>
      <button id="create-alert" class="trading-extension-dialog-button primary">Create Alert</button>
    </div>
  `;

  // Add to page
  document.body.appendChild(overlay);
  document.body.appendChild(dialog);

  // Add event listeners
  document.getElementById('cancel-alert').addEventListener('click', () => {
    overlay.remove();
    dialog.remove();
  });

  document.getElementById('create-alert').addEventListener('click', () => {
    const description = document.getElementById('alert-description').value.trim();

    if (description) {
      // Add symbol to description if not included
      const alertText = description.includes(symbol) ?
        description :
        `${description} on ${symbol}`;

      createAlertCallback(alertText);
    }

    overlay.remove();
    dialog.remove();
  });
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractChartData') {
    // Extract chart data from the current page
    const chartData = extractChartDataFromPage(message.selector);
    sendResponse({ success: true, data: chartData });
  } else if (message.action === 'injectTradingViewUI') {
    // Inject custom alert UI into TradingView
    if (isTradingViewPage()) {
      injectAlertUI((alertText) => {
        // Send the alert text to the background script
        chrome.runtime.sendMessage({
          action: 'createCustomAlert',
          alertText: alertText
        }, (response) => {
          // Show a notification to the user
          if (response && response.success) {
            showNotification('Custom alert created successfully');
          } else {
            showNotification('Error creating alert: ' + (response?.error || 'Unknown error'), 'error');
          }
        });
      });
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Not on TradingView' });
    }
  }
  return true; // Required for async sendResponse
});

/**
 * Extract chart data from the current page
 * @param {string} selector - CSS selector for the chart element
 * @returns {Object|null} - Extracted chart data or null if not found
 */
function extractChartDataFromPage(selector) {
  // This function would be customized based on the specific trading websites
  console.log('Attempting to extract chart data with selector:', selector);

  // Check if we're on a supported trading website
  const supportedSites = [
    'tradingview.com',
    'finance.yahoo.com',
    'investing.com',
    'stockcharts.com'
  ];

  const currentSite = window.location.hostname;
  const isSupportedSite = supportedSites.some(site => currentSite.includes(site));

  if (!isSupportedSite) {
    console.log('Not on a supported trading website');
    return null;
  }

  // TradingView specific extraction
  if (currentSite.includes('tradingview.com')) {
    // Use our improved TradingView integration
    return extractChartData();
  }

  // Yahoo Finance specific extraction
  if (currentSite.includes('finance.yahoo.com')) {
    return extractYahooFinanceData();
  }

  // Investing.com specific extraction
  if (currentSite.includes('investing.com')) {
    return extractInvestingData();
  }

  // StockCharts specific extraction
  if (currentSite.includes('stockcharts.com')) {
    return extractStockChartsData();
  }

  return null;
}

/**
 * Show a notification to the user
 * @param {string} message - The message to show
 * @param {string} type - The type of notification (success, error, info)
 */
function showNotification(message, type = 'success') {
  // Create notification element if it doesn't exist
  let notification = document.getElementById('trading-extension-notification');

  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'trading-extension-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      transition: opacity 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    `;
    document.body.appendChild(notification);
  }

  // Set styles based on type
  if (type === 'success') {
    notification.style.backgroundColor = '#4CAF50';
    notification.style.color = 'white';
  } else if (type === 'error') {
    notification.style.backgroundColor = '#F44336';
    notification.style.color = 'white';
  } else {
    notification.style.backgroundColor = '#2196F3';
    notification.style.color = 'white';
  }

  // Set message
  notification.textContent = message;

  // Show notification
  notification.style.opacity = '1';

  // Hide after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

/**
 * Extract data from Yahoo Finance
 * @returns {Object|null} - Extracted chart data or null if not found
 */
function extractYahooFinanceData() {
  try {
    // Attempt to find the symbol information
    const symbolElement = document.querySelector('[data-symbol]');
    if (!symbolElement) return null;

    const symbol = symbolElement.getAttribute('data-symbol');

    // Try to find the current price
    const priceElement = document.querySelector('[data-field="regularMarketPrice"]');
    const price = priceElement ? parseFloat(priceElement.textContent.replace(/[^0-9.-]+/g, '')) : null;

    return {
      source: 'yahoo',
      symbol,
      price,
      timeframe: 'Unknown', // Yahoo Finance doesn't have an easily accessible timeframe
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error extracting Yahoo Finance data:', error);
    return null;
  }
}

/**
 * Extract data from Investing.com
 * @returns {Object|null} - Extracted chart data or null if not found
 */
function extractInvestingData() {
  try {
    // Attempt to find the symbol information
    const symbolElement = document.querySelector('.instrumentHead');
    if (!symbolElement) return null;

    const symbol = symbolElement.textContent.trim();

    // Try to find the current price
    const priceElement = document.querySelector('.last-price-value');
    const price = priceElement ? parseFloat(priceElement.textContent.replace(/[^0-9.-]+/g, '')) : null;

    // Try to find the timeframe
    const timeframeElement = document.querySelector('.timeperiod');
    const timeframe = timeframeElement ? timeframeElement.textContent.trim() : 'Unknown';

    return {
      source: 'investing',
      symbol,
      price,
      timeframe,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error extracting Investing.com data:', error);
    return null;
  }
}

/**
 * Extract data from StockCharts
 * @returns {Object|null} - Extracted chart data or null if not found
 */
function extractStockChartsData() {
  try {
    // Attempt to find the symbol information
    const symbolElement = document.querySelector('.chartImg');
    if (!symbolElement) return null;

    const symbol = symbolElement.getAttribute('data-ticker') || 'Unknown';

    // StockCharts doesn't expose price data easily in the DOM
    // This would require more complex extraction

    return {
      source: 'stockcharts',
      symbol,
      price: null,
      timeframe: 'Unknown',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error extracting StockCharts data:', error);
    return null;
  }
}

// Initialize content script
console.log('Advanced Trading Notifications content script loaded');

// Check if we're on TradingView
if (isTradingViewPage()) {
  console.log('TradingView detected, initializing extension features');

  // Inject custom alert UI
  injectAlertUI((alertText) => {
    // Send the alert text to the background script
    chrome.runtime.sendMessage({
      action: 'createCustomAlert',
      alertText: alertText
    }, (response) => {
      // Show a notification to the user
      if (response && response.success) {
        showNotification('Custom alert created successfully');
      } else {
        showNotification('Error creating alert: ' + (response?.error || 'Unknown error'), 'error');
      }
    });
  });

  // Perform initial data extraction
  const initialData = extractChartData();
  if (initialData) {
    console.log('Initial chart data extracted:', initialData);

    // Send data to background script
    chrome.runtime.sendMessage({
      action: 'contentScriptData',
      data: initialData
    });
  }
} else {
  // Perform initial data extraction if on another supported site
  const initialData = extractChartDataFromPage();
  if (initialData) {
    console.log('Initial chart data extracted:', initialData);

    // Send data to background script
    chrome.runtime.sendMessage({
      action: 'contentScriptData',
      data: initialData
    });
  }
}
