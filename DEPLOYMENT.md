# Deployment Guide for Advanced Trading Notifications Extension

This guide will walk you through the process of deploying the Advanced Trading Notifications extension to the Chrome Web Store and installing it for development purposes.

## Local Development Installation

### Prerequisites
- Google Chrome browser
- The extension source code (this repository)

### Steps for Local Installation

1. **Prepare the extension files**
   - Ensure all files are in the correct directory structure
   - Make sure all API keys are properly configured in the settings

2. **Load the extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" by toggling the switch in the top-right corner
   - Click "Load unpacked" button
   - Select the root directory of the extension (the folder containing `manifest.json`)
   - The extension should now appear in your extensions list and in the toolbar

3. **Testing the extension**
   - Click on the extension icon in the toolbar to open the popup
   - Configure your settings (symbols, timeframe)
   - Test the AI-powered custom alerts by creating natural language alerts
   - Verify that the secure API key system is working properly
   - Test the functionality by monitoring for alerts

## Chrome Web Store Deployment

### Prerequisites
- Google Developer account (requires one-time $5 registration fee)
- Zip file of the extension
- Promotional images and descriptions

### Steps for Web Store Deployment

1. **Prepare the extension package**
   - Create a ZIP file of your extension directory
   - Make sure to exclude any unnecessary files (like `.git`, development notes, etc.)
   - Command to create ZIP: `zip -r extension.zip * -x "*.git*" -x "*.md" -x "DEPLOYMENT.md"`

2. **Create promotional materials**
   - Create promotional images:
     - Small tile: 440x280 pixels
     - Large tile: 920x680 pixels
     - Marquee: 1400x560 pixels
   - Write a compelling description (up to 132 characters)
   - Write a detailed description (up to 16,000 characters)
   - Prepare screenshots of your extension in action

3. **Upload to Chrome Web Store**
   - Go to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
   - Sign in with your Google account
   - Click "New Item" button
   - Upload your ZIP file
   - Fill in all required fields:
     - Name
     - Description
     - Category (Productivity)
     - Language
     - Upload promotional images
     - Add screenshots
     - Set visibility options (public or private)
     - Set distribution countries

4. **Submit for review**
   - Google will review your extension for compliance with their policies
   - This process typically takes 1-3 business days
   - You may be asked to make changes if issues are found

5. **After approval**
   - Your extension will be published to the Chrome Web Store
   - You can update it at any time by uploading a new version with an incremented version number in the manifest.json

## Updating the Extension

1. **Make your changes to the code**
2. **Increment the version number in `manifest.json`**
3. **Create a new ZIP file**
4. **Go to the Chrome Developer Dashboard**
5. **Find your extension and click "Edit"**
6. **Click "Upload Updated Package" and select your new ZIP file**
7. **Submit for review again**

## Best Practices for Deployment

1. **Test thoroughly before submission**
   - Test all features and edge cases
   - Check for any console errors
   - Verify API integrations work correctly

2. **Keep API keys secure**
   - The extension now uses a secure API key storage system
   - API keys are stored in a special namespace in Chrome's storage that's not exposed in the UI
   - Keys are initialized from default values and securely managed by the extension
   - Consider implementing server-side proxies for API calls if possible for even greater security

3. **Version control**
   - Use semantic versioning (MAJOR.MINOR.PATCH)
   - Keep a changelog of updates
   - Increment version numbers appropriately

4. **User privacy**
   - Be transparent about data collection
   - Include a privacy policy
   - Only request necessary permissions

5. **Maintenance**
   - Monitor for issues after deployment
   - Respond to user feedback
   - Keep dependencies updated

## Troubleshooting Common Deployment Issues

1. **Extension not loading**
   - Check for console errors in the background page
   - Verify all file paths are correct
   - Ensure manifest.json is properly formatted

2. **API calls failing**
   - Verify API keys are correct
   - Check for CORS issues
   - Ensure API endpoints are accessible

3. **Chrome Web Store rejection**
   - Review the feedback carefully
   - Address all policy violations
   - Resubmit with detailed notes on changes made

4. **Performance issues**
   - Optimize API calls and data processing
   - Implement caching where appropriate
   - Minimize resource usage in background scripts

## Support and Maintenance

After deployment, it's important to:

1. **Monitor user feedback and reviews**
2. **Fix bugs promptly**
3. **Regularly update the extension with improvements**
4. **Keep up with Chrome API changes and deprecations**
5. **Maintain compatibility with Chrome updates**

## New Features Overview

### AI-Powered Custom Alerts

The extension now includes a powerful custom alert system that allows users to:

1. **Create alerts using natural language**
   - Users can type alerts like "Alert me when MACD crosses above signal line on AAPL"
   - The system uses AI to parse and understand these requests

2. **Monitor custom conditions automatically**
   - The extension checks custom alert conditions every 5 minutes
   - Alerts are triggered based on real-time market data

3. **Manage custom alerts**
   - Enable/disable alerts without deleting them
   - Delete alerts that are no longer needed
   - View detailed information about each alert

### Secure API Key Management

The extension implements a secure API key system that:

1. **Protects API keys from exposure**
   - Keys are stored in a secure namespace in Chrome's storage
   - Keys are not visible in the UI or settings

2. **Simplifies user experience**
   - Users don't need to enter API keys manually
   - The extension comes pre-configured with working keys

3. **Maintains security**
   - API requests are made from the background script
   - Keys are never exposed to content scripts or web pages

By following this guide, you should be able to successfully deploy your Advanced Trading Notifications extension to the Chrome Web Store and maintain it over time.
