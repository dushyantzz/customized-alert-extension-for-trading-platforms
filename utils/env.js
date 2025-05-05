// Environment variables utility

// Default API keys - these will be loaded from environment variables
// and not exposed to users
const DEFAULT_API_KEYS = {
  alphavantage: '',
  financialmodelingprep: '',
  polygon: '',
  tiingo: '',
  gemini: '',
  perplexity: ''
};

/**
 * Load environment variables from .env file
 * @returns {Promise<Object>} - Object containing environment variables
 */
async function loadEnvVariables() {
  try {
    const response = await fetch(chrome.runtime.getURL('.env'));
    const envText = await response.text();

    // Parse .env file
    const envVars = {};
    envText.split('\n').forEach(line => {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || !line.trim()) {
        return;
      }

      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });

    return envVars;
  } catch (error) {
    console.error('Error loading environment variables:', error);
    return {};
  }
}

// Store API keys in a secure, non-user-accessible area
let secureApiKeys = null;

/**
 * Initialize secure API keys
 * This should be called once when the extension starts
 */
export async function initializeSecureApiKeys() {
  // Use chrome.storage.local but in a special namespace that's not exposed in the UI
  return new Promise(async (resolve) => {
    chrome.storage.local.get(['__secureApiKeys'], async (result) => {
      if (result.__secureApiKeys) {
        secureApiKeys = result.__secureApiKeys;
      } else {
        // First time initialization - load from environment variables
        const envVars = await loadEnvVariables();

        // Initialize API keys from environment variables
        secureApiKeys = {
          alphavantage: envVars.ALPHA_VANTAGE_API_KEY || DEFAULT_API_KEYS.alphavantage,
          financialmodelingprep: envVars.FINANCIAL_MODELING_PREP_API_KEY || DEFAULT_API_KEYS.financialmodelingprep,
          polygon: envVars.POLYGON_API_KEY || DEFAULT_API_KEYS.polygon,
          tiingo: envVars.TIINGO_API_KEY || DEFAULT_API_KEYS.tiingo,
          gemini: envVars.GEMINI_API_KEY || DEFAULT_API_KEYS.gemini,
          perplexity: envVars.PERPLEXITY_API_KEY || DEFAULT_API_KEYS.perplexity
        };

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
