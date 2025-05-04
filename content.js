// Content script for Advanced Trading Notifications extension
// This script is injected into trading websites to extract data if needed

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractChartData') {
    // Extract chart data from the current page
    const chartData = extractChartData(message.selector);
    sendResponse({ success: true, data: chartData });
  }
  return true; // Required for async sendResponse
});

/**
 * Extract chart data from the current page
 * @param {string} selector - CSS selector for the chart element
 * @returns {Object|null} - Extracted chart data or null if not found
 */
function extractChartData(selector) {
  // This function would be customized based on the specific trading websites
  // For now, it's a placeholder that returns null
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
    return extractTradingViewData();
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
 * Extract data from TradingView
 * @returns {Object|null} - Extracted chart data or null if not found
 */
function extractTradingViewData() {
  try {
    // Attempt to find the symbol information
    const symbolElement = document.querySelector('.chart-container .chart-markup-table.pane');
    if (!symbolElement) return null;
    
    // This is a simplified example - actual implementation would be more complex
    // and would need to adapt to TradingView's DOM structure
    
    // Try to find the symbol name
    const symbolNameElement = document.querySelector('.chart-title-indicator__title__text');
    const symbol = symbolNameElement ? symbolNameElement.textContent.trim() : 'Unknown';
    
    // Try to find the current price
    const priceElement = document.querySelector('.chart-status-price');
    const price = priceElement ? parseFloat(priceElement.textContent.trim()) : null;
    
    // Try to find the timeframe
    const timeframeElement = document.querySelector('.chart-controls-time-frame');
    const timeframe = timeframeElement ? timeframeElement.textContent.trim() : 'Unknown';
    
    return {
      source: 'tradingview',
      symbol,
      price,
      timeframe,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error extracting TradingView data:', error);
    return null;
  }
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

// Perform initial data extraction if on a supported site
const initialData = extractChartData();
if (initialData) {
  console.log('Initial chart data extracted:', initialData);
  
  // Send data to background script
  chrome.runtime.sendMessage({
    action: 'contentScriptData',
    data: initialData
  });
}
