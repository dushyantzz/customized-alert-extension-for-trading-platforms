// API integration for financial data sources
import { getApiKey } from './env.js';

/**
 * Fetch candle data from the selected API source
 * @param {string} symbol - The trading symbol to fetch data for
 * @param {object} config - The extension configuration
 * @returns {Promise<Array>} - Array of candle data
 */
export async function fetchCandleData(symbol, config) {
  const { apiSource, timeframe } = config;

  // Get API key from config or environment variables
  let apiKey;

  switch (apiSource) {
    case 'alphavantage':
      apiKey = config.apiKeys?.alphavantage || await getApiKey('alphavantage');
      return fetchAlphaVantageData(symbol, apiKey, timeframe);
    case 'financialmodelingprep':
      apiKey = config.apiKeys?.financialmodelingprep || await getApiKey('financialmodelingprep');
      return fetchFinancialModelingPrepData(symbol, apiKey, timeframe);
    case 'polygon':
      apiKey = config.apiKeys?.polygon || await getApiKey('polygon');
      return fetchPolygonData(symbol, apiKey, timeframe);
    case 'tiingo':
      apiKey = config.apiKeys?.tiingo || await getApiKey('tiingo');
      return fetchTiingoData(symbol, apiKey, timeframe);
    default:
      throw new Error(`Unsupported API source: ${apiSource}`);
  }
}

/**
 * Convert timeframe string to Alpha Vantage interval
 * @param {string} timeframe - Extension timeframe format
 * @returns {string} - Alpha Vantage interval format
 */
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

/**
 * Fetch data from Alpha Vantage API
 * @param {string} symbol - The trading symbol
 * @param {string} apiKey - Alpha Vantage API key
 * @param {string} timeframe - Timeframe for the data
 * @returns {Promise<Array>} - Array of candle data
 */
async function fetchAlphaVantageData(symbol, apiKey, timeframe) {
  const interval = getAlphaVantageInterval(timeframe);
  const endpoint = interval === 'daily'
    ? 'TIME_SERIES_DAILY'
    : 'TIME_SERIES_INTRADAY';

  const url = `https://www.alphavantage.co/query?function=${endpoint}&symbol=${symbol}&interval=${interval}&outputsize=compact&apikey=${apiKey}`;

  try {
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

  } catch (error) {
    console.error('Error fetching Alpha Vantage data:', error);
    throw error;
  }
}

/**
 * Convert timeframe string to Financial Modeling Prep interval
 * @param {string} timeframe - Extension timeframe format
 * @returns {string} - FMP interval format
 */
function getFMPInterval(timeframe) {
  switch (timeframe) {
    case '1m': return '1min';
    case '5m': return '5min';
    case '15m': return '15min';
    case '30m': return '30min';
    case '1h': return '1hour';
    case '4h': return '4hour';
    case '1d': return '1day';
    default: return '15min';
  }
}

/**
 * Fetch data from Financial Modeling Prep API
 * @param {string} symbol - The trading symbol
 * @param {string} apiKey - FMP API key
 * @param {string} timeframe - Timeframe for the data
 * @returns {Promise<Array>} - Array of candle data
 */
async function fetchFinancialModelingPrepData(symbol, apiKey, timeframe) {
  const interval = getFMPInterval(timeframe);
  const url = `https://financialmodelingprep.com/api/v3/historical-chart/${interval}/${symbol}?apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('Invalid response from Financial Modeling Prep API');
    }

    // Convert to candle format
    return data.map(item => ({
      timestamp: item.date,
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: parseFloat(item.volume)
    })).reverse(); // Ensure chronological order

  } catch (error) {
    console.error('Error fetching Financial Modeling Prep data:', error);
    throw error;
  }
}

/**
 * Convert timeframe string to Polygon.io multiplier and timespan
 * @param {string} timeframe - Extension timeframe format
 * @returns {object} - Polygon multiplier and timespan
 */
function getPolygonTimeframe(timeframe) {
  switch (timeframe) {
    case '1m': return { multiplier: 1, timespan: 'minute' };
    case '5m': return { multiplier: 5, timespan: 'minute' };
    case '15m': return { multiplier: 15, timespan: 'minute' };
    case '30m': return { multiplier: 30, timespan: 'minute' };
    case '1h': return { multiplier: 1, timespan: 'hour' };
    case '4h': return { multiplier: 4, timespan: 'hour' };
    case '1d': return { multiplier: 1, timespan: 'day' };
    default: return { multiplier: 15, timespan: 'minute' };
  }
}

/**
 * Fetch data from Polygon.io API
 * @param {string} symbol - The trading symbol
 * @param {string} apiKey - Polygon API key
 * @param {string} timeframe - Timeframe for the data
 * @returns {Promise<Array>} - Array of candle data
 */
async function fetchPolygonData(symbol, apiKey, timeframe) {
  const { multiplier, timespan } = getPolygonTimeframe(timeframe);

  // Calculate date range (last 100 candles)
  const toDate = new Date();
  const fromDate = new Date();

  // Adjust from date based on timeframe
  if (timespan === 'minute') {
    fromDate.setMinutes(fromDate.getMinutes() - (multiplier * 100));
  } else if (timespan === 'hour') {
    fromDate.setHours(fromDate.getHours() - (multiplier * 100));
  } else if (timespan === 'day') {
    fromDate.setDate(fromDate.getDate() - (multiplier * 100));
  }

  // Format dates for API
  const from = fromDate.toISOString().split('T')[0];
  const to = toDate.toISOString().split('T')[0];

  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/${from}/${to}?apiKey=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results) {
      throw new Error(`Polygon API error: ${data.error || 'Unknown error'}`);
    }

    // Convert to candle format
    return data.results.map(item => ({
      timestamp: new Date(item.t).toISOString(),
      open: item.o,
      high: item.h,
      low: item.l,
      close: item.c,
      volume: item.v
    }));

  } catch (error) {
    console.error('Error fetching Polygon data:', error);
    throw error;
  }
}

/**
 * Convert timeframe string to Tiingo resampleFreq
 * @param {string} timeframe - Extension timeframe format
 * @returns {string} - Tiingo resampleFreq format
 */
function getTiingoResampleFreq(timeframe) {
  switch (timeframe) {
    case '1m': return '1min';
    case '5m': return '5min';
    case '15m': return '15min';
    case '30m': return '30min';
    case '1h': return '1hour';
    case '4h': return '4hour';
    case '1d': return '1day';
    default: return '15min';
  }
}

/**
 * Fetch data from Tiingo API
 * @param {string} symbol - The trading symbol
 * @param {string} apiKey - Tiingo API key
 * @param {string} timeframe - Timeframe for the data
 * @returns {Promise<Array>} - Array of candle data
 */
async function fetchTiingoData(symbol, apiKey, timeframe) {
  const resampleFreq = getTiingoResampleFreq(timeframe);

  // Calculate date range (last 100 candles)
  const endDate = new Date();
  const startDate = new Date();

  // Adjust start date based on timeframe
  if (resampleFreq.includes('min')) {
    const minutes = parseInt(resampleFreq) * 100;
    startDate.setMinutes(startDate.getMinutes() - minutes);
  } else if (resampleFreq.includes('hour')) {
    const hours = parseInt(resampleFreq) * 100;
    startDate.setHours(startDate.getHours() - hours);
  } else if (resampleFreq.includes('day')) {
    startDate.setDate(startDate.getDate() - 100);
  }

  // Format dates for API
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const url = `https://api.tiingo.com/tiingo/daily/${symbol}/prices?startDate=${startDateStr}&endDate=${endDateStr}&resampleFreq=${resampleFreq}&token=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('Invalid response from Tiingo API');
    }

    // Convert to candle format
    return data.map(item => ({
      timestamp: item.date,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume
    }));

  } catch (error) {
    console.error('Error fetching Tiingo data:', error);
    throw error;
  }
}
