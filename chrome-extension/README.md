# ToneLayer Chrome Extension

This Manifest V3 extension rewrites selected browser text through the same ToneLayer `/rewrite` service used by the iOS app.

## Test locally

1. Open Chrome and go to `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder: `chrome-extension`.
5. Click **Details** for ToneLayer, open **Extension options**, and paste the ToneLayer app token.
6. Open any page with selectable text.
7. Select text, click the ToneLayer extension icon, then click **Rewrite**.

The popup can copy the rewrite or replace the selected text when the current page allows content scripts to edit that field.
