# Advanced Trading Notifications

![Advanced Trading Notifications](icons/icon128.png)

A powerful Chrome extension that provides AI-powered trading alerts and notifications based on technical indicators and natural language requests. This extension combines financial data APIs with state-of-the-art AI to help traders stay informed about market movements without constantly monitoring charts.

## Features

### Core Features

- **Natural Language Custom Alerts**: Create alerts using plain English (e.g., "Alert me when MACD crosses above signal line on AAPL")
- Monitor selected trading symbols in real-time
- Detect technical indicator crossovers:
  - Simultaneous MACD and EMA crossovers
  - Sequential crossovers (one indicator followed by another within a specified window)
  - Bidirectional logic (works in both directions)
  - Custom user-defined conditions through natural language
- Send real-time browser notifications
- AI-powered explanations and analysis
- Configurable symbols, timeframes, and notification preferences
- Secure API key management system

### Technical Indicators

- MACD (Moving Average Convergence Divergence)
- EMA (Exponential Moving Average)
- Optional: RSI, Bollinger Bands, Volume Profile

### AI Integration

- Google Gemini API for explanations and documentation
- Perplexity Pro API for detailed analysis and Q&A

### Financial Data APIs

- Alpha Vantage API
- Financial Modeling Prep API
- Polygon.io API
- Tiingo API

## Installation

### Developer Mode Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the extension directory
5. The extension should now be installed and visible in your browser toolbar

### From Chrome Web Store (Coming Soon)

1. Visit the Chrome Web Store
2. Search for "Advanced Trading Notifications"
3. Click "Add to Chrome"

## Configuration

### Basic Configuration

1. Click the extension icon in your browser toolbar
2. Go to the "Settings" tab
3. Configure your symbols, timeframe, and API preferences
4. Save your settings

### Custom Alerts Configuration

1. Click the extension icon in your browser toolbar
2. Go to the "Custom Alerts" tab
3. Enter your alert condition in natural language (e.g., "Alert me when RSI goes below 30 on TSLA")
4. Click "Create Alert" to add it to your monitored conditions
5. Enable/disable or delete alerts as needed

### Advanced Configuration

1. Click the extension icon in your browser toolbar
2. Click "Advanced Settings" at the bottom of the popup
3. Configure detailed settings for indicators, alerts, and notifications
4. Save your settings

## API Keys

The extension comes with pre-configured API keys that are securely managed. These keys are:

- Not visible in the UI
- Stored in a secure namespace in Chrome's storage
- Used automatically for all API requests

The extension uses the following services:

- Alpha Vantage: [https://www.alphavantage.co/](https://www.alphavantage.co/)
- Financial Modeling Prep: [https://financialmodelingprep.com/](https://financialmodelingprep.com/)
- Polygon.io: [https://polygon.io/](https://polygon.io/)
- Tiingo: [https://www.tiingo.com/](https://www.tiingo.com/)
- Google Gemini: [https://ai.google.dev/](https://ai.google.dev/)
- Perplexity Pro: [https://www.perplexity.ai/](https://www.perplexity.ai/)

## Usage

### Monitoring Symbols

The extension will automatically monitor your configured symbols based on the selected timeframe. You can view the current status in the extension popup.

### Receiving Alerts

When a crossover condition or custom alert condition is detected, you'll receive a browser notification. You can click on the notification to view more details, or open the extension popup to see your alert history.

### Custom Alerts

The extension allows you to create custom alerts using natural language:

1. Describe what you want to monitor in plain English
2. The AI will parse your request and create an appropriate alert condition
3. The system will automatically monitor for these conditions
4. You'll receive notifications when your conditions are met

### AI Assistant

The extension includes an AI assistant that can:

1. Explain alerts in plain language
2. Provide context and analysis for trading signals
3. Answer questions about technical indicators and trading concepts
4. Parse and understand natural language alert requests

## Technical Details

### Architecture

- **Background Script**: Handles data fetching, indicator calculations, and alert logic
- **Popup UI**: User interface for configuration and viewing alerts
- **Content Script**: Extracts data from trading websites (optional)
- **Options Page**: Advanced configuration settings
- **Utilities**: Technical indicator calculations, API integration, notification handling
- **AI Integration**: Gemini and Perplexity API integration

### Data Flow

1. The extension fetches data from the selected financial API
2. Technical indicators are calculated from the price data
3. Both predefined crossover conditions and custom alert conditions are checked
4. If a condition is met, a notification is sent
5. AI APIs generate explanations and analysis

### Secure API Key Management

The extension implements a secure API key system:

1. API keys are stored in a protected namespace in Chrome's storage
2. Keys are initialized with default values and never exposed in the UI
3. All API requests are made from the background script
4. Keys are never exposed to content scripts or web pages

## Development

### Project Structure

```
advanced-trading-notifications/
├── manifest.json           # Extension configuration
├── background.js           # Background script (with custom alert processing)
├── popup.html              # Popup UI (with custom alerts tab)
├── popup.js                # Popup functionality (with natural language alert handling)
├── popup.css               # Popup styles (with custom alert styling)
├── options.html            # Options page
├── options.js              # Options functionality
├── options.css             # Options styles
├── content.js              # Content script
├── utils/                  # Utility functions
│   ├── api.js              # API integration
│   ├── indicators.js       # Technical indicators
│   ├── notifications.js    # Notification handling
│   └── env.js              # Secure API key management
├── ai/                     # AI integration
│   ├── gemini.js           # Google Gemini API
│   └── perplexity.js       # Perplexity Pro API
├── icons/                  # Extension icons
├── README.md               # Project documentation
└── DEPLOYMENT.md           # Deployment instructions
```

### Building and Testing

1. Make your changes to the code
2. Load the extension in developer mode
3. Test the functionality
4. Use the browser console for debugging

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Why This Extension Is Unique

### 1. Natural Language Processing
Unlike other trading tools that require complex configuration, this extension understands plain English requests. Just tell it what you want to monitor, and it handles the technical details.

### 2. AI Integration
The combination of financial data with AI analysis provides context and explanations that most trading tools lack. Instead of just receiving an alert, you get an explanation of what it means and why it matters.

### 3. Multi-API Flexibility
Most trading tools rely on a single data source. This extension gives you access to multiple professional APIs, ensuring reliability and allowing you to compare data across sources.

### 4. Secure by Design
The extension is built with security as a priority. Your API keys are protected, and all sensitive operations happen in the background script, away from potential exposure.

### 5. Browser-Based Convenience
No need to install desktop software or keep additional windows open. The extension works right in your browser, where you're likely already doing research and trading.

## Acknowledgments

- Technical indicator calculations based on industry-standard formulas
- AI integration powered by Google Gemini and Perplexity Pro
- Financial data provided by Alpha Vantage, Financial Modeling Prep, Polygon.io, and Tiingo
- Natural language processing capabilities enabled by advanced AI models

---

*Advanced Trading Notifications - Making sophisticated trading alerts accessible to everyone.*
#   c u s t o m i z e d - a l e r t - e x t e n s i o n - f o r - t r a d i n g - p l a t f o r m s  
 