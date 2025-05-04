// Technical indicator calculations and crossover detection

/**
 * Calculate EMA (Exponential Moving Average)
 * @param {Array} prices - Array of price values
 * @param {number} period - EMA period
 * @returns {Array} - Array of EMA values
 */
export function calculateEMA(prices, period) {
  const k = 2 / (period + 1);
  let emaArray = [];
  
  // Calculate SMA for the first EMA value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  
  // First EMA is SMA
  let ema = sum / period;
  emaArray.push(ema);
  
  // Calculate EMA for the rest of the values
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] * k) + (ema * (1 - k));
    emaArray.push(ema);
  }
  
  // Pad the beginning with nulls to match the input array length
  const padding = Array(period - 1).fill(null);
  return [...padding, ...emaArray];
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * @param {Array} prices - Array of price values
 * @param {number} fastPeriod - Fast EMA period (default: 12)
 * @param {number} slowPeriod - Slow EMA period (default: 26)
 * @param {number} signalPeriod - Signal EMA period (default: 9)
 * @returns {Object} - Object containing MACD line, signal line, and histogram
 */
export function calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  // Calculate fast and slow EMAs
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  
  // Calculate MACD line (fast EMA - slow EMA)
  const macdLine = [];
  for (let i = 0; i < prices.length; i++) {
    if (fastEMA[i] === null || slowEMA[i] === null) {
      macdLine.push(null);
    } else {
      macdLine.push(fastEMA[i] - slowEMA[i]);
    }
  }
  
  // Calculate signal line (EMA of MACD line)
  const validMacdValues = macdLine.filter(value => value !== null);
  const signalLine = calculateEMA(validMacdValues, signalPeriod);
  
  // Pad signal line with nulls to match the input array length
  const signalPadding = Array(prices.length - signalLine.length).fill(null);
  const paddedSignalLine = [...signalPadding, ...signalLine];
  
  // Calculate histogram (MACD line - signal line)
  const histogram = [];
  for (let i = 0; i < prices.length; i++) {
    if (macdLine[i] === null || paddedSignalLine[i] === null) {
      histogram.push(null);
    } else {
      histogram.push(macdLine[i] - paddedSignalLine[i]);
    }
  }
  
  return {
    macdLine,
    signalLine: paddedSignalLine,
    histogram
  };
}

/**
 * Calculate all indicators for candle data
 * @param {Array} candles - Array of candle data
 * @returns {Object} - Object containing calculated indicators
 */
export function calculateIndicators(candles) {
  // Extract close prices
  const closePrices = candles.map(candle => candle.close);
  
  // Calculate EMAs
  const ema9 = calculateEMA(closePrices, 9);
  const ema21 = calculateEMA(closePrices, 21);
  
  // Calculate MACD
  const macd = calculateMACD(closePrices);
  
  return {
    candles,
    ema: {
      ema9,
      ema21
    },
    macd
  };
}

/**
 * Detect EMA crossovers
 * @param {Array} ema9 - Array of EMA9 values
 * @param {Array} ema21 - Array of EMA21 values
 * @returns {Array} - Array of crossover objects with index and direction
 */
export function detectEMACrossovers(ema9, ema21) {
  const crossovers = [];
  
  for (let i = 1; i < ema9.length; i++) {
    // Skip if any values are null
    if (ema9[i] === null || ema21[i] === null || 
        ema9[i-1] === null || ema21[i-1] === null) {
      continue;
    }
    
    // Bullish crossover: EMA9 crosses above EMA21
    if (ema9[i-1] <= ema21[i-1] && ema9[i] > ema21[i]) {
      crossovers.push({
        index: i,
        direction: 'bullish',
        type: 'ema'
      });
    }
    // Bearish crossover: EMA9 crosses below EMA21
    else if (ema9[i-1] >= ema21[i-1] && ema9[i] < ema21[i]) {
      crossovers.push({
        index: i,
        direction: 'bearish',
        type: 'ema'
      });
    }
  }
  
  return crossovers;
}

/**
 * Detect MACD crossovers
 * @param {Array} macdLine - Array of MACD line values
 * @param {Array} signalLine - Array of signal line values
 * @returns {Array} - Array of crossover objects with index and direction
 */
export function detectMACDCrossovers(macdLine, signalLine) {
  const crossovers = [];
  
  for (let i = 1; i < macdLine.length; i++) {
    // Skip if any values are null
    if (macdLine[i] === null || signalLine[i] === null || 
        macdLine[i-1] === null || signalLine[i-1] === null) {
      continue;
    }
    
    // Bullish crossover: MACD crosses above signal line
    if (macdLine[i-1] <= signalLine[i-1] && macdLine[i] > signalLine[i]) {
      crossovers.push({
        index: i,
        direction: 'bullish',
        type: 'macd'
      });
    }
    // Bearish crossover: MACD crosses below signal line
    else if (macdLine[i-1] >= signalLine[i-1] && macdLine[i] < signalLine[i]) {
      crossovers.push({
        index: i,
        direction: 'bearish',
        type: 'macd'
      });
    }
  }
  
  return crossovers;
}

/**
 * Check for simultaneous crossovers (both MACD and EMA crossovers on the same candle)
 * @param {Array} emaCrossovers - Array of EMA crossover objects
 * @param {Array} macdCrossovers - Array of MACD crossover objects
 * @returns {Array} - Array of simultaneous crossover objects
 */
export function checkSimultaneousCrossovers(emaCrossovers, macdCrossovers) {
  const simultaneousCrossovers = [];
  
  for (const emaCrossover of emaCrossovers) {
    for (const macdCrossover of macdCrossovers) {
      if (emaCrossover.index === macdCrossover.index && 
          emaCrossover.direction === macdCrossover.direction) {
        simultaneousCrossovers.push({
          index: emaCrossover.index,
          direction: emaCrossover.direction,
          type: 'simultaneous',
          description: `Simultaneous ${emaCrossover.direction} crossover of both MACD and EMA`
        });
      }
    }
  }
  
  return simultaneousCrossovers;
}

/**
 * Check for sequential crossovers (one crossover followed by another within a specified window)
 * @param {Array} emaCrossovers - Array of EMA crossover objects
 * @param {Array} macdCrossovers - Array of MACD crossover objects
 * @param {number} maxWindow - Maximum candle window for sequential crossovers
 * @returns {Array} - Array of sequential crossover objects
 */
export function checkSequentialCrossovers(emaCrossovers, macdCrossovers, maxWindow = 6) {
  const sequentialCrossovers = [];
  
  // Check MACD followed by EMA
  for (const macdCrossover of macdCrossovers) {
    for (const emaCrossover of emaCrossovers) {
      if (emaCrossover.direction === macdCrossover.direction && 
          emaCrossover.index > macdCrossover.index && 
          emaCrossover.index <= macdCrossover.index + maxWindow) {
        sequentialCrossovers.push({
          firstIndex: macdCrossover.index,
          secondIndex: emaCrossover.index,
          direction: macdCrossover.direction,
          type: 'sequential',
          sequence: 'macd-then-ema',
          window: emaCrossover.index - macdCrossover.index,
          description: `${macdCrossover.direction.charAt(0).toUpperCase() + macdCrossover.direction.slice(1)} MACD crossover followed by EMA crossover within ${emaCrossover.index - macdCrossover.index} candles`
        });
      }
    }
  }
  
  // Check EMA followed by MACD
  for (const emaCrossover of emaCrossovers) {
    for (const macdCrossover of macdCrossovers) {
      if (macdCrossover.direction === emaCrossover.direction && 
          macdCrossover.index > emaCrossover.index && 
          macdCrossover.index <= emaCrossover.index + maxWindow) {
        sequentialCrossovers.push({
          firstIndex: emaCrossover.index,
          secondIndex: macdCrossover.index,
          direction: emaCrossover.direction,
          type: 'sequential',
          sequence: 'ema-then-macd',
          window: macdCrossover.index - emaCrossover.index,
          description: `${emaCrossover.direction.charAt(0).toUpperCase() + emaCrossover.direction.slice(1)} EMA crossover followed by MACD crossover within ${macdCrossover.index - emaCrossover.index} candles`
        });
      }
    }
  }
  
  return sequentialCrossovers;
}

/**
 * Check for all types of crossovers in indicator data
 * @param {string} symbol - Trading symbol
 * @param {Object} indicatorData - Object containing calculated indicators
 * @param {Object} config - Extension configuration
 * @returns {Array} - Array of crossover results
 */
export function checkForCrossovers(symbol, indicatorData, config) {
  const { ema, macd, candles } = indicatorData;
  const { notificationSettings } = config;
  const results = [];
  
  // Detect individual crossovers
  const emaCrossovers = detectEMACrossovers(ema.ema9, ema.ema21);
  const macdCrossovers = detectMACDCrossovers(macd.macdLine, macd.signalLine);
  
  // Check for simultaneous crossovers
  if (notificationSettings.simultaneousCrossovers) {
    const simultaneousCrossovers = checkSimultaneousCrossovers(emaCrossovers, macdCrossovers);
    results.push(...simultaneousCrossovers);
  }
  
  // Check for sequential crossovers
  if (notificationSettings.sequentialCrossovers) {
    const sequentialCrossovers = checkSequentialCrossovers(
      emaCrossovers, 
      macdCrossovers, 
      notificationSettings.maxCandleWindow
    );
    results.push(...sequentialCrossovers);
  }
  
  // Filter out crossovers that have already been reported
  return filterNewCrossovers(symbol, results, candles);
}

/**
 * Filter out crossovers that have already been reported
 * @param {string} symbol - Trading symbol
 * @param {Array} crossovers - Array of crossover results
 * @param {Array} candles - Array of candle data
 * @returns {Array} - Array of new crossover results
 */
function filterNewCrossovers(symbol, crossovers, candles) {
  // Get the last checked timestamp for this symbol
  return new Promise((resolve) => {
    chrome.storage.local.get(['lastChecked'], (result) => {
      const lastChecked = result.lastChecked || {};
      const lastTimestamp = lastChecked[symbol] || '';
      
      // Filter out crossovers that occurred before the last checked timestamp
      const newCrossovers = crossovers.filter(crossover => {
        const index = crossover.index || crossover.secondIndex;
        const timestamp = candles[index].timestamp;
        return timestamp > lastTimestamp;
      });
      
      // Update the last checked timestamp
      if (candles.length > 0) {
        lastChecked[symbol] = candles[candles.length - 1].timestamp;
        chrome.storage.local.set({ lastChecked });
      }
      
      resolve(newCrossovers);
    });
  });
}
