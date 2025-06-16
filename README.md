# Chrome Extension Template

This is a basic template for creating a Chrome extension.

## Files Structure
- `manifest.json`: The extension's configuration file
- `popup.html`: The HTML for the extension's popup
- `popup.css`: Styles for the popup
- `popup.js`: JavaScript functionality for the popup
- `icons/`: Directory containing extension icons (you'll need to add your own icons)

## How to Use

1. Create an `icons` directory and add your extension icons in the following sizes:
   - 16x16 pixels (icon16.png)
   - 48x48 pixels (icon48.png)
   - 128x128 pixels (icon128.png)

2. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select this directory

3. Customize the extension:
   - Modify the manifest.json to add permissions and features
   - Edit popup.html, popup.css, and popup.js to implement your functionality
   - Add any additional files needed for your extension

## Manifest Version 3

This template uses Manifest V3, which is the latest version of Chrome's extension platform. Key features include:
- Service workers instead of background pages
- Improved security model
- Better performance

## Additional Resources
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Overview](https://developer.chrome.com/docs/extensions/mv3/intro/)