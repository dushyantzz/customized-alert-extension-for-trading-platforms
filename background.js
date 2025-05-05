// Background script for Advanced Trading Notifications extension
// Handles data fetching, indicator calculations, and alert logic
import { initializeSecureApiKeys, getApiKey, getTwilioCredentials, checkTwilioConfigured } from './utils/env.js';
import { sendWhatsAppNotification, formatAlertMessage } from './utils/whatsapp.js';

// Configuration defaults
const DEFAULT_CONFIG = {
  symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'],
  timeframe: '15m', // 1m, 5m, 15m, 1h, 4h, 1d
  apiSource: 'alphavantage', // alphavantage, financialmodelingprep, polygon, tiingo
  notificationSettings: {
    simultaneousCrossovers: true,
    sequentialCrossovers: true,
    maxCandleWindow: 6,
    includeAiExplanation: true,
    sendWhatsApp: true, // Send WhatsApp notifications
    sendBrowserNotifications: true // Send browser notifications
  },
  lastChecked: {},
  customAlerts: [], // Store user-defined custom alerts
  tradingViewIntegration: {
    enabled: true,
    autoInject: true
  }
};

// State to track crossover history
let crossoverHistory = {};

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Advanced Trading Notifications extension installed');

  // Initialize secure API keys
  await initializeSecureApiKeys();

  // Set default configuration
  const config = await getConfig();

  // Set up alarm for periodic data fetching
  setupAlarm(config);

  // Set up alarm for checking custom alerts
  chrome.alarms.create('checkCustomAlertsAlarm', {
    periodInMinutes: 5 // Check custom alerts every 5 minutes
  });

  // Set up TradingView integration
  if (config.tradingViewIntegration && config.tradingViewIntegration.enabled) {
    // Find any TradingView tabs
    chrome.tabs.query({ url: "*://*.tradingview.com/*" }, (tabs) => {
      if (tabs.length > 0) {
        // Inject our content script into existing TradingView tabs
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { action: 'injectTradingViewUI' });
        });
      }
    });
  }
});

// Listen for alarm to fetch data
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'fetchDataAlarm') {
    const config = await getConfig();
    await fetchDataAndCheckIndicators(config);
  } else if (alarm.name === 'checkCustomAlertsAlarm') {
    await checkCustomAlerts();
  }
});

// Listen for tab updates to inject TradingView UI
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('tradingview.com')) {
    const config = await getConfig();

    if (config.tradingViewIntegration && config.tradingViewIntegration.enabled &&
        config.tradingViewIntegration.autoInject) {
      // Inject our content script UI into TradingView
      chrome.tabs.sendMessage(tabId, { action: 'injectTradingViewUI' });
    }
  }
});

// Listen for messages from popup or options page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getConfig') {
    getConfig().then(config => sendResponse(config));
    return true; // Required for async sendResponse
  } else if (message.action === 'updateConfig') {
    saveConfig(message.config).then(() => {
      setupAlarm(message.config);
      sendResponse({success: true});
    });
    return true; // Required for async sendResponse
  } else if (message.action === 'fetchDataNow') {
    getConfig().then(config => {
      fetchDataAndCheckIndicators(config).then(() => {
        sendResponse({success: true});
      });
    });
    return true; // Required for async sendResponse
  } else if (message.action === 'createCustomAlert') {
    createCustomAlert(message.alertText).then(result => {
      sendResponse(result);
    });
    return true; // Required for async sendResponse
  } else if (message.action === 'deleteCustomAlert') {
    deleteCustomAlert(message.alertId).then(result => {
      sendResponse(result);
    });
    return true; // Required for async sendResponse
  } else if (message.action === 'checkCustomAlerts') {
    checkCustomAlerts().then(result => {
      sendResponse(result);
    });
    return true; // Required for async sendResponse
  } else if (message.action === 'checkTwilioStatus') {
    checkTwilioConfigured().then(configured => {
      sendResponse({ configured });
    }).catch(error => {
      console.error('Error checking Twilio status:', error);
      sendResponse({ configured: false, error: error.message });
    });
    return true; // Required for async sendResponse
  } else if (message.action === 'contentScriptData') {
    // Handle data from content script (TradingView integration)
    if (message.data && message.data.symbol) {
      console.log('Received data from TradingView:', message.data);
      // Store the current TradingView symbol and data
      chrome.storage.local.set({ tradingViewData: message.data });
    }
  }
});

// Get configuration from storage
async function getConfig() {
  return new Promise(async (resolve) => {
    // Initialize secure API keys if not already done
    await initializeSecureApiKeys();

    chrome.storage.local.get('config', async (result) => {
      let config = result.config || DEFAULT_CONFIG;

      // Ensure customAlerts exists (for backward compatibility)
      if (!config.customAlerts) {
        config.customAlerts = [];
      }

      resolve(config);
    });
  });
}

// Save configuration to storage
async function saveConfig(config) {
  return new Promise((resolve) => {
    chrome.storage.local.set({config}, resolve);
  });
}

// Set up alarm for periodic data fetching
function setupAlarm(config) {
  // Clear existing alarm
  chrome.alarms.clear('fetchDataAlarm');

  // Set up new alarm based on timeframe
  let periodInMinutes = 15; // Default to 15 minutes

  switch(config.timeframe) {
    case '1m':
      periodInMinutes = 1;
      break;
    case '5m':
      periodInMinutes = 5;
      break;
    case '15m':
      periodInMinutes = 15;
      break;
    case '1h':
      periodInMinutes = 60;
      break;
    case '4h':
      periodInMinutes = 240;
      break;
    case '1d':
      periodInMinutes = 1440;
      break;
  }

  chrome.alarms.create('fetchDataAlarm', {
    periodInMinutes: periodInMinutes
  });

  console.log(`Alarm set to fetch data every ${periodInMinutes} minutes`);
}

// Main function to fetch data and check indicators
async function fetchDataAndCheckIndicators(config) {
  console.log('Fetching data and checking indicators');

  for (const symbol of config.symbols) {
    try {
      // Fetch data from selected API
      const candleData = await fetchCandleData(symbol, config);

      if (!candleData || candleData.length === 0) {
        console.error(`No data received for ${symbol}`);
        continue;
      }

      // Calculate indicators
      const indicatorData = calculateIndicators(candleData);

      // Check for crossovers
      const crossoverResults = checkForCrossovers(symbol, indicatorData, config);

      // Process any detected crossovers
      if (crossoverResults.length > 0) {
        for (const result of crossoverResults) {
          await processAlert(symbol, result, config);
        }
      }

    } catch (error) {
      console.error(`Error processing ${symbol}:`, error);
    }
  }
}

// Fetch candle data from the selected API
async function fetchCandleData(symbol, config) {
  try {
    const { apiSource, timeframe } = config;

    // Get API key from secure storage
    const apiKey = await getApiKey(apiSource);

    if (!apiKey) {
      console.error(`No API key available for ${apiSource}`);
      return [];
    }

    // Basic implementation for Alpha Vantage as an example
    if (apiSource === 'alphavantage') {
      const interval = getAlphaVantageInterval(timeframe);
      const endpoint = interval === 'daily' ? 'TIME_SERIES_DAILY' : 'TIME_SERIES_INTRADAY';

      const url = `https://www.alphavantage.co/query?function=${endpoint}&symbol=${symbol}&interval=${interval}&outputsize=compact&apikey=${apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      // Handle API error responses
      if (data['Error Message']) {
        throw new Error(`Alpha Vantage API error: ${data['Error Message']}`);
      }

      if (data['Note']) {
        console.warn(`Alpha Vantage API note: ${data['Note']}`);
      }

      // Parse the time series data
      const timeSeriesKey = interval === 'daily'
        ? 'Time Series (Daily)'
        : `Time Series (${interval})`;

      const timeSeries = data[timeSeriesKey];

      if (!timeSeries) {
        throw new Error('No time series data found in Alpha Vantage response');
      }

      // Convert to candle format
      return Object.entries(timeSeries).map(([timestamp, values]) => ({
        timestamp,
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseFloat(values['5. volume'])
      })).reverse(); // Reverse to get chronological order
    }

    // Placeholder for other APIs
    return [];
  } catch (error) {
    console.error('Error fetching candle data:', error);
    return [];
  }
}

// Helper function to convert timeframe to Alpha Vantage interval
function getAlphaVantageInterval(timeframe) {
  switch (timeframe) {
    case '1m': return '1min';
    case '5m': return '5min';
    case '15m': return '15min';
    case '30m': return '30min';
    case '1h': return '60min';
    case '1d': return 'daily';
    default: return '15min'; // Default to 15min
  }
}

// Calculate technical indicators from candle data
function calculateIndicators(candleData) {
  // This will be implemented in utils/indicators.js
  // For now, return a placeholder
  return {
    candles: candleData,
    macd: [],
    ema: []
  };
}

// Check for MACD and EMA crossovers
function checkForCrossovers(symbol, indicatorData, config) {
  // This will be implemented with the indicator logic
  // For now, return a placeholder
  return [];
}

// Process and send alerts for detected crossovers
async function processAlert(symbol, crossoverResult, config) {
  // Generate notification title and message
  const title = `${symbol} Alert: ${crossoverResult.type}`;
  let message = crossoverResult.description;
  let aiExplanation = '';

  // Add AI explanation if enabled
  if (config.notificationSettings.includeAiExplanation) {
    try {
      aiExplanation = await getAiExplanation(symbol, crossoverResult, config);
      message += `\n\nAI Analysis: ${aiExplanation}`;
    } catch (error) {
      console.error('Error getting AI explanation:', error);
    }
  }

  // Send browser notification if enabled
  if (config.notificationSettings.sendBrowserNotifications) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: title,
      message: message,
      priority: 2
    });
  }

  // Send WhatsApp notification if enabled
  if (config.notificationSettings.sendWhatsApp) {
    try {
      const isTwilioConfigured = await checkTwilioConfigured();

      if (isTwilioConfigured) {
        // Add explanation to crossover result for WhatsApp message
        const alertData = {
          ...crossoverResult,
          symbol,
          timestamp: new Date().toISOString(),
          explanation: aiExplanation
        };

        // Format the message for WhatsApp
        const whatsappMessage = formatAlertMessage(alertData);

        // Get Twilio credentials
        const twilioCredentials = await getTwilioCredentials();

        // Send the WhatsApp notification
        await sendWhatsAppNotification(whatsappMessage, twilioCredentials);
        console.log('WhatsApp notification sent for', symbol);
      } else {
        console.warn('Twilio not configured, skipping WhatsApp notification');
      }
    } catch (whatsappError) {
      console.error('Error sending WhatsApp notification:', whatsappError);
    }
  }

  // Save alert to history
  saveAlertToHistory(symbol, crossoverResult);
}

// Get AI explanation for the alert
async function getAiExplanation(symbol, crossoverResult, config) {
  try {
    // Determine which AI provider to use
    const aiProvider = config.aiSettings?.provider || 'perplexity';

    // Get market data for the symbol
    const marketData = {
      currentPrice: 0, // This would be fetched from the API
      priceChange: 0,  // This would be calculated from historical data
      timeframe: config.timeframe
    };

    // Simplified implementation without dynamic imports
    if (aiProvider === 'gemini') {
      const apiKey = await getApiKey('gemini');
      return await generateGeminiExplanation(symbol, crossoverResult, marketData, apiKey);
    } else {
      const apiKey = await getApiKey('perplexity');
      return await generatePerplexityAnalysis(symbol, crossoverResult, marketData, apiKey);
    }
  } catch (error) {
    console.error('Error generating AI explanation:', error);
    return "Unable to generate AI analysis at this time.";
  }
}

// Generate explanation using Gemini API
async function generateGeminiExplanation(symbol, crossoverResult, marketData, apiKey) {
  const { type, direction } = crossoverResult;

  // Construct the prompt
  let prompt = `You are an expert trading assistant. Explain the following technical indicator crossover in simple terms:

Symbol: ${symbol}
Crossover Type: ${type} (${direction})
`;

  if (type === 'simultaneous') {
    prompt += `Both MACD and EMA indicators have crossed ${direction === 'bullish' ? 'upward' : 'downward'} on the same candle.`;
  } else if (type === 'sequential') {
    const { sequence, window } = crossoverResult;
    const firstIndicator = sequence.split('-then-')[0].toUpperCase();
    const secondIndicator = sequence.split('-then-')[1].toUpperCase();

    prompt += `${firstIndicator} crossed ${direction === 'bullish' ? 'upward' : 'downward'} followed by ${secondIndicator} within ${window} candles.`;
  }

  prompt += `\n\nCurrent Price: $${marketData.currentPrice}
Recent Price Change: ${marketData.priceChange}% in the last ${marketData.timeframe}

Please provide:
1. A brief explanation of what this crossover pattern typically indicates
2. What traders might consider doing in response
3. Any important context or caveats to keep in mind

Keep your response concise (under 150 words) and easy to understand for a trader.`;

  try {
    // Make API request to Gemini
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 250
        }
      })
    });

    const data = await response.json();

    // Extract the generated text
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const generatedText = data.candidates[0].content.parts[0].text;
      return generatedText;
    } else {
      throw new Error('Invalid response from Gemini API');
    }
  } catch (error) {
    console.error('Error generating explanation with Gemini:', error);
    return 'Unable to generate explanation at this time.';
  }
}

// Generate analysis using Perplexity API
async function generatePerplexityAnalysis(symbol, crossoverResult, marketData, apiKey) {
  const { type, direction } = crossoverResult;

  // Construct the prompt
  let prompt = `You are an expert trading assistant. Provide a detailed analysis of the following technical indicator crossover:

Symbol: ${symbol}
Crossover Type: ${type} (${direction})
`;

  if (type === 'simultaneous') {
    prompt += `Both MACD and EMA indicators have crossed ${direction === 'bullish' ? 'upward' : 'downward'} on the same candle.`;
  } else if (type === 'sequential') {
    const { sequence, window } = crossoverResult;
    const firstIndicator = sequence.split('-then-')[0].toUpperCase();
    const secondIndicator = sequence.split('-then-')[1].toUpperCase();

    prompt += `${firstIndicator} crossed ${direction === 'bullish' ? 'upward' : 'downward'} followed by ${secondIndicator} within ${window} candles.`;
  }

  prompt += `\n\nCurrent Price: $${marketData.currentPrice}
Recent Price Change: ${marketData.priceChange}% in the last ${marketData.timeframe}

Please provide:
1. A detailed explanation of what this crossover pattern indicates
2. Historical reliability of this pattern for ${symbol}
3. Current market context that might affect the interpretation
4. Potential price targets or support/resistance levels to watch
5. Risk management considerations

Keep your response concise but informative for a trader.`;

  try {
    // Make API request to Perplexity
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'sonar-medium-online',
        messages: [
          {
            role: 'system',
            content: 'You are an expert trading assistant providing concise, accurate technical analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 300
      })
    });

    const data = await response.json();

    // Extract the generated text
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      throw new Error('Invalid response from Perplexity API');
    }
  } catch (error) {
    console.error('Error generating analysis with Perplexity:', error);
    return 'Unable to generate analysis at this time.';
  }
}

// Save alert to history
function saveAlertToHistory(symbol, crossoverResult) {
  chrome.storage.local.get('alertHistory', (result) => {
    const history = result.alertHistory || [];
    history.unshift({
      id: Date.now().toString(),
      symbol,
      timestamp: new Date().toISOString(),
      ...crossoverResult
    });

    // Limit history to 100 items
    if (history.length > 100) {
      history.pop();
    }

    chrome.storage.local.set({alertHistory: history});
  });
}

// Create a custom alert from natural language text
async function createCustomAlert(alertText) {
  try {
    console.log('Creating custom alert for:', alertText);

    if (!alertText || typeof alertText !== 'string' || alertText.trim() === '') {
      console.error('Invalid alert text:', alertText);
      return { success: false, error: 'Alert text cannot be empty' };
    }

    // Get API key for AI processing
    const apiKey = await getApiKey('gemini');
    console.log('Got API key for Gemini:', apiKey ? 'Yes' : 'No');

    // Use AI to parse the alert text (will fall back to basic parsing if no API key)
    const alertCondition = await parseAlertCondition(alertText, apiKey);

    if (!alertCondition) {
      console.error('Failed to parse alert condition');
      return { success: false, error: 'Could not parse alert condition' };
    }

    console.log('Parsed alert condition:', alertCondition);

    // Save the custom alert
    const config = await getConfig();
    const customAlert = {
      id: Date.now().toString(),
      text: alertText,
      condition: alertCondition,
      createdAt: new Date().toISOString(),
      active: true
    };

    // Initialize customAlerts array if it doesn't exist
    if (!config.customAlerts) {
      config.customAlerts = [];
    }

    config.customAlerts.push(customAlert);
    await saveConfig(config);

    console.log('Custom alert created successfully:', customAlert);
    return { success: true, alert: customAlert };
  } catch (error) {
    console.error('Error creating custom alert:', error);
    return { success: false, error: error.message || 'Unknown error creating alert' };
  }
}

// Delete a custom alert
async function deleteCustomAlert(alertId) {
  try {
    const config = await getConfig();

    const alertIndex = config.customAlerts.findIndex(alert => alert.id === alertId);
    if (alertIndex === -1) {
      return { success: false, error: 'Alert not found' };
    }

    config.customAlerts.splice(alertIndex, 1);
    await saveConfig(config);

    return { success: true };
  } catch (error) {
    console.error('Error deleting custom alert:', error);
    return { success: false, error: error.message };
  }
}

// Check all custom alerts against current market data
async function checkCustomAlerts() {
  try {
    const config = await getConfig();

    if (!config.customAlerts || config.customAlerts.length === 0) {
      return { success: true, alerts: [] };
    }

    const triggeredAlerts = [];

    for (const alert of config.customAlerts) {
      if (!alert.active) continue;

      const isTriggered = await evaluateAlertCondition(alert.condition);

      if (isTriggered) {
        // Create alert data
        const alertData = {
          type: 'custom',
          direction: alert.condition.direction || 'neutral',
          description: alert.text,
          symbol: alert.condition.symbol
        };

        // Create browser notification if enabled
        if (config.notificationSettings.sendBrowserNotifications) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: `${alertData.direction.toUpperCase()} ALERT: ${alertData.symbol}`,
            message: alert.text,
            priority: 2
          });
        }

        // Send WhatsApp notification if enabled
        if (config.notificationSettings.sendWhatsApp) {
          try {
            const isTwilioConfigured = await checkTwilioConfigured();

            if (isTwilioConfigured) {
              // Format the message for WhatsApp
              const whatsappMessage = formatAlertMessage({
                ...alertData,
                timestamp: new Date().toISOString()
              });

              // Get Twilio credentials
              const twilioCredentials = await getTwilioCredentials();

              // Send the WhatsApp notification
              await sendWhatsAppNotification(whatsappMessage, twilioCredentials);
              console.log('WhatsApp notification sent for custom alert:', alertData.symbol);
            }
          } catch (whatsappError) {
            console.error('Error sending WhatsApp notification for custom alert:', whatsappError);
          }
        }

        // Save to alert history
        saveAlertToHistory(alertData.symbol, alertData);

        triggeredAlerts.push(alert);
      }
    }

    return { success: true, alerts: triggeredAlerts };
  } catch (error) {
    console.error('Error checking custom alerts:', error);
    return { success: false, error: error.message };
  }
}

// Parse alert condition from natural language using AI
async function parseAlertCondition(alertText, apiKey) {
  try {
    console.log('Parsing alert condition for:', alertText);

    // Extract symbol directly from the alert text as a fallback
    let extractedSymbol = null;
    const symbolMatch = alertText.match(/\b[A-Z]{1,5}\b/);
    if (symbolMatch) {
      extractedSymbol = symbolMatch[0];
      console.log('Extracted symbol from text:', extractedSymbol);
    }

    // If we can't use AI (no API key), create a basic condition
    if (!apiKey) {
      console.log('No API key available, using basic parsing');
      return {
        symbol: extractedSymbol || 'UNKNOWN',
        indicator: alertText.includes('MACD') ? 'MACD' :
                  alertText.includes('RSI') ? 'RSI' :
                  alertText.includes('EMA') ? 'EMA' : 'price',
        condition: alertText.includes('above') ? 'above' :
                  alertText.includes('below') ? 'below' :
                  alertText.includes('cross') ? 'crossover' : 'change',
        direction: alertText.includes('bullish') ? 'bullish' :
                  alertText.includes('bearish') ? 'bearish' : 'neutral'
      };
    }

    // Construct the prompt for Gemini
    const prompt = `You are a trading assistant that converts natural language alert requests into structured JSON format.

Parse the following alert request and extract the key components:
"${alertText}"

Return ONLY a JSON object with these fields:
- symbol: The stock/crypto symbol mentioned (e.g., "AAPL", "BTC-USD")
- indicator: The technical indicator mentioned (e.g., "MACD", "RSI", "EMA")
- condition: The condition type (e.g., "crossover", "above", "below")
- threshold: Any numerical threshold mentioned (e.g., 30 for "RSI below 30")
- direction: Either "bullish" or "bearish" based on the alert context
- comparisonIndicator: If comparing two indicators (e.g., "signal line" in "MACD crosses above signal line")

If any field is not applicable, omit it from the JSON.`;

    console.log('Sending request to Gemini API');

    // Make API request to Gemini
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 250
        }
      })
    });

    const data = await response.json();
    console.log('Received response from Gemini API:', data);

    // Check for errors in the API response
    if (data.error) {
      console.error('Gemini API error:', data.error);
      throw new Error(`Gemini API error: ${data.error.message || 'Unknown error'}`);
    }

    // Extract the generated text
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const generatedText = data.candidates[0].content.parts[0].text;
      console.log('Generated text:', generatedText);

      // Extract JSON from the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        console.log('Extracted JSON:', jsonStr);

        try {
          const parsedJson = JSON.parse(jsonStr);

          // Ensure we have at least a symbol
          if (!parsedJson.symbol && extractedSymbol) {
            parsedJson.symbol = extractedSymbol;
          }

          // If we still don't have a symbol, use a default
          if (!parsedJson.symbol) {
            parsedJson.symbol = 'UNKNOWN';
          }

          return parsedJson;
        } catch (jsonError) {
          console.error('Error parsing JSON:', jsonError);
          throw new Error('Invalid JSON in AI response');
        }
      }
    }

    // If we get here, we couldn't parse the AI response
    // Fall back to a basic condition with the extracted symbol
    console.log('Falling back to basic condition');
    return {
      symbol: extractedSymbol || 'UNKNOWN',
      indicator: alertText.includes('MACD') ? 'MACD' :
                alertText.includes('RSI') ? 'RSI' :
                alertText.includes('EMA') ? 'EMA' : 'price',
      condition: alertText.includes('above') ? 'above' :
                alertText.includes('below') ? 'below' :
                alertText.includes('cross') ? 'crossover' : 'change',
      direction: alertText.includes('bullish') ? 'bullish' :
                alertText.includes('bearish') ? 'bearish' : 'neutral'
    };
  } catch (error) {
    console.error('Error parsing alert condition:', error);

    // Return a basic condition as a fallback
    const symbolMatch = alertText.match(/\b[A-Z]{1,5}\b/);
    const extractedSymbol = symbolMatch ? symbolMatch[0] : 'UNKNOWN';

    return {
      symbol: extractedSymbol,
      indicator: alertText.includes('MACD') ? 'MACD' :
                alertText.includes('RSI') ? 'RSI' :
                alertText.includes('EMA') ? 'EMA' : 'price',
      condition: alertText.includes('above') ? 'above' :
                alertText.includes('below') ? 'below' :
                alertText.includes('cross') ? 'crossover' : 'change',
      direction: alertText.includes('bullish') ? 'bullish' :
                alertText.includes('bearish') ? 'bearish' : 'neutral'
    };
  }
}

// Evaluate if an alert condition is triggered based on current market data
async function evaluateAlertCondition(condition) {
  try {
    const { symbol, indicator, condition: conditionType, threshold, comparisonIndicator } = condition;

    // Fetch latest data for the symbol
    const config = await getConfig();
    const candleData = await fetchCandleData(symbol, config);

    if (!candleData || candleData.length === 0) {
      console.error(`No data received for ${symbol}`);
      return false;
    }

    // Calculate indicators
    const indicatorData = calculateIndicators(candleData);

    // Evaluate the condition based on indicator type
    switch (indicator?.toLowerCase()) {
      case 'macd':
        return evaluateMacdCondition(indicatorData.macd, conditionType, comparisonIndicator, threshold);
      case 'rsi':
        return evaluateRsiCondition(indicatorData.rsi, conditionType, threshold);
      case 'ema':
        return evaluateEmaCondition(indicatorData.ema, conditionType, comparisonIndicator, threshold);
      default:
        // For now, return false for unsupported indicators
        return false;
    }
  } catch (error) {
    console.error('Error evaluating alert condition:', error);
    return false;
  }
}

// Evaluate MACD-specific conditions
function evaluateMacdCondition(macd, conditionType, comparisonIndicator, threshold) {
  // This is a placeholder implementation
  // In a real implementation, you would check the actual MACD values

  // For now, return a random result for demonstration
  return Math.random() > 0.8; // 20% chance of triggering
}

// Evaluate RSI-specific conditions
function evaluateRsiCondition(rsi, conditionType, threshold) {
  // This is a placeholder implementation
  // In a real implementation, you would check the actual RSI values

  if (!rsi || !rsi.values || rsi.values.length === 0) {
    return false;
  }

  const currentRsi = rsi.values[rsi.values.length - 1];

  if (conditionType === 'above' && threshold) {
    return currentRsi > threshold;
  } else if (conditionType === 'below' && threshold) {
    return currentRsi < threshold;
  }

  // For other conditions, return a random result for demonstration
  return Math.random() > 0.8; // 20% chance of triggering
}

// Evaluate EMA-specific conditions
function evaluateEmaCondition(ema, conditionType, comparisonIndicator, threshold) {
  // This is a placeholder implementation
  // In a real implementation, you would check the actual EMA values

  // For now, return a random result for demonstration
  return Math.random() > 0.8; // 20% chance of triggering
}
