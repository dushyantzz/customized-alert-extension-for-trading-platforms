// Perplexity Pro API integration
import { getApiKey } from '../utils/env.js';

/**
 * Generate a detailed analysis using Perplexity Pro API
 * @param {string} symbol - Trading symbol
 * @param {Object} crossover - Crossover data
 * @param {Object} marketData - Additional market data
 * @param {string} [apiKey] - Optional Perplexity API key (will use env variable if not provided)
 * @returns {Promise<string>} - Promise that resolves with the generated analysis
 */
export async function generateAnalysis(symbol, crossover, marketData, apiKey) {
  // If no API key provided, get it from environment variables
  if (!apiKey) {
    apiKey = await getApiKey('perplexity');
  }
  const { type, direction } = crossover;

  // Construct the prompt
  let prompt = `You are an expert trading assistant. Provide a detailed analysis of the following technical indicator crossover:

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

/**
 * Answer a user question about trading or market conditions
 * @param {string} question - User's question
 * @param {string} symbol - Trading symbol context
 * @param {Object} marketData - Additional market data
 * @param {string} [apiKey] - Optional Perplexity API key (will use env variable if not provided)
 * @returns {Promise<string>} - Promise that resolves with the answer
 */
export async function answerQuestion(question, symbol, marketData, apiKey) {
  // If no API key provided, get it from environment variables
  if (!apiKey) {
    apiKey = await getApiKey('perplexity');
  }
  const prompt = `Context: The user is asking about ${symbol}, which is currently trading at $${marketData.currentPrice} with a ${marketData.priceChange}% change in the last ${marketData.timeframe}.

User Question: ${question}

Please provide a helpful, accurate, and concise answer based on current market knowledge. Include relevant technical analysis concepts if appropriate.`;

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
            content: 'You are an expert trading assistant providing concise, accurate answers to trading questions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 250
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
    console.error('Error answering question with Perplexity:', error);
    return 'Unable to answer the question at this time.';
  }
}

/**
 * Get latest news and sentiment for a symbol
 * @param {string} symbol - Trading symbol
 * @param {string} [apiKey] - Optional Perplexity API key (will use env variable if not provided)
 * @returns {Promise<Object>} - Promise that resolves with news and sentiment
 */
export async function getNewsAndSentiment(symbol, apiKey) {
  // If no API key provided, get it from environment variables
  if (!apiKey) {
    apiKey = await getApiKey('perplexity');
  }
  const prompt = `Please provide the latest significant news and overall market sentiment for ${symbol}.

Include:
1. 2-3 most important recent news items affecting this stock/asset (with dates)
2. Overall market sentiment (bullish, bearish, or neutral)
3. Any upcoming events that might impact the price (earnings, product launches, etc.)

Format as a JSON object with the following structure:
{
  "news": [
    {"date": "YYYY-MM-DD", "headline": "News headline", "impact": "positive/negative/neutral"}
  ],
  "sentiment": "bullish/bearish/neutral",
  "upcomingEvents": [
    {"date": "YYYY-MM-DD", "event": "Event description"}
  ],
  "summary": "Brief 1-2 sentence summary"
}`;

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
            content: 'You are a financial news analyst providing accurate, up-to-date information in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    });

    const data = await response.json();

    // Extract and parse the generated JSON
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const content = data.choices[0].message.content;

      // Extract JSON from the response (in case there's additional text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error('Error parsing JSON from Perplexity response:', parseError);
          return {
            news: [],
            sentiment: 'unknown',
            upcomingEvents: [],
            summary: 'Unable to parse news data.'
          };
        }
      }
    }

    throw new Error('Invalid response from Perplexity API');
  } catch (error) {
    console.error('Error getting news with Perplexity:', error);
    return {
      news: [],
      sentiment: 'unknown',
      upcomingEvents: [],
      summary: 'Unable to retrieve news at this time.'
    };
  }
}
