# ToneLayer Chrome Extension

This Manifest V3 extension rewrites selected browser text, decodes communication patterns, and translates between ND-readable and NT-readable styles through the same ToneLayer service used by the iOS app.

## Features

- **ND→NT**: rewrites neurodivergent communication into NT-readable wording.
- **Decoder**: explains what a received message may mean and flags communication patterns.
- **NT→ND**: turns polished NT wording into more explicit, direct ND-readable communication.

## Test locally

1. Open Chrome and go to `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder: `chrome-extension`.
5. Click **Details** for ToneLayer, open **Extension options**, and paste the ToneLayer access token from your subscribed account.
6. Open any page with selectable text.
7. Select text, click the ToneLayer extension icon, choose **ND→NT**, **Decoder**, or **NT→ND**, then run the tool.

The popup can copy the rewrite or replace the selected text when the current page allows content scripts to edit that field.

## Billing model

ToneLayer is designed as a free-to-install Chrome extension with paid rewrite access. Users subscribe through ToneLayer billing, then paste their account access token in extension options. See `BILLING.md` for Stripe setup steps and `STORE_LISTING.md` for Chrome Web Store payment disclosure copy.

## Legal notice

Copyright (c) 2026 Alden Lougee. All rights reserved. ToneLayer(TM) and the ToneLayer butterfly mark are trademarks of Alden Lougee. Unauthorized copying, modification, distribution, sublicensing, reverse engineering, or derivative use is prohibited without explicit written permission.

If ToneLayer is offered as a paid product or subscription, the Chrome Web Store listing and purchase flow must clearly state that Alden Lougee is the seller, describe what is paid, and include refund/terms information.
