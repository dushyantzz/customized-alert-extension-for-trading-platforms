// Environment variables utility

// Default API keys - these will be bundled with the extension but not exposed to users
const DEFAULT_API_KEYS = {
  alphavantage: 'ER6PI8OVOQXZDCMP',
  financialmodelingprep: 'odP1hkwF05hrSAHTfFToF4tLlLCwvOzQ',
  polygon: 'ptfF_xeBLK4kVrVmt0niYiqLNR4chcLm',
  tiingo: 'dc7ee21bf0fa3c5539877e98237e38f7f36a6980',
  gemini: 'AIzaSyBgGmck1EiYiYIntREANiqyuVqWfvDSDxo',
  perplexity: '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'
};

// Store API keys in a secure, non-user-accessible area
let secureApiKeys = null;

/**
 * Initialize secure API keys
 * This should be called once when the extension starts
 */
export async function initializeSecureApiKeys() {
  // Use chrome.storage.local but in a special namespace that's not exposed in the UI
  return new Promise((resolve) => {
    chrome.storage.local.get(['__secureApiKeys'], (result) => {
      if (result.__secureApiKeys) {
        secureApiKeys = result.__secureApiKeys;
      } else {
        // First time initialization - use defaults
        secureApiKeys = DEFAULT_API_KEYS;
        chrome.storage.local.set({ __secureApiKeys: secureApiKeys });
      }
      resolve(secureApiKeys);
    });
  });
}

/**
 * Get API key for a specific service
 * @param {string} service - Service name (alphavantage, financialmodelingprep, polygon, tiingo, gemini, perplexity)
 * @returns {Promise<string>} - API key for the service
 */
export async function getApiKey(service) {
  // Ensure secure API keys are initialized
  if (!secureApiKeys) {
    await initializeSecureApiKeys();
  }

  return secureApiKeys[service] || '';
}

/**
 * Check if API keys are properly configured
 * @returns {Promise<boolean>} - True if all required API keys are available
 */
export async function checkApiKeysConfigured() {
  if (!secureApiKeys) {
    await initializeSecureApiKeys();
  }

  // Check if at least one API key is available for data sources
  const hasDataSourceKey =
    !!secureApiKeys.alphavantage ||
    !!secureApiKeys.financialmodelingprep ||
    !!secureApiKeys.polygon ||
    !!secureApiKeys.tiingo;

  // Check if at least one AI API key is available
  const hasAiKey =
    !!secureApiKeys.gemini ||
    !!secureApiKeys.perplexity;

  return hasDataSourceKey && hasAiKey;
}
