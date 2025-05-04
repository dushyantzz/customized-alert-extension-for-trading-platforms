// Google Gemini API integration
import { getApiKey } from '../utils/env.js';

/**
 * Generate an explanation using Google Gemini API
 * @param {string} symbol - Trading symbol
 * @param {Object} crossover - Crossover data
 * @param {Object} marketData - Additional market data
 * @param {string} [apiKey] - Optional Gemini API key (will use env variable if not provided)
 * @returns {Promise<string>} - Promise that resolves with the generated explanation
 */
export async function generateExplanation(symbol, crossover, marketData, apiKey) {
  // If no API key provided, get it from environment variables
  if (!apiKey) {
    apiKey = await getApiKey('gemini');
  }
  const { type, direction } = crossover;

  // Construct the prompt
  let prompt = `You are an expert trading assistant. Explain the following technical indicator crossover in simple terms:

Symbol: ${symbol}
Crossover Type: ${type} (${direction})
`;

  if (type === 'simultaneous') {
    prompt += `Both MACD and EMA indicators have crossed ${direction === 'bullish' ? 'upward' : 'downward'} on the same candle.`;
  } else if (type === 'sequential') {
    const { sequence, window } = crossover;
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

/**
 * Generate documentation or help content using Gemini
 * @param {string} topic - The topic to generate documentation for
 * @param {string} [apiKey] - Optional Gemini API key (will use env variable if not provided)
 * @returns {Promise<string>} - Promise that resolves with the generated documentation
 */
export async function generateDocumentation(topic, apiKey) {
  // If no API key provided, get it from environment variables
  if (!apiKey) {
    apiKey = await getApiKey('gemini');
  }
  const prompt = `You are a technical documentation expert. Please provide clear, concise documentation about the following topic related to trading and technical analysis:

Topic: ${topic}

Please include:
1. A brief explanation of the concept
2. How it's typically used in trading
3. Any important considerations or limitations

Format the response in markdown with appropriate headings and bullet points. Keep it concise and easy to understand.`;

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
          maxOutputTokens: 500
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
    console.error('Error generating documentation with Gemini:', error);
    return 'Unable to generate documentation at this time.';
  }
}
