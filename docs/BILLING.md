# ToneLayer Billing Setup

This project is set up for external subscription billing. The Chrome extension should stay free to install, then require a paid ToneLayer account/access token before rewrite calls are allowed.

## Recommended launch pricing

- Free trial: 10 rewrites/month or 7 days
- Starter: $8/month for light personal use
- Pro: $18/month for heavier personal use
- Team/clinic/coach: $79/month starting price

Avoid unlimited free use because every rewrite can create backend AI cost.

## Payment provider setup

Use Stripe Payment Links or Stripe Checkout first. Payment Links are the fastest path because Stripe hosts the payment page and supports subscriptions without custom checkout code.

Create these products in Stripe:

1. ToneLayer Starter - recurring monthly - $8/month
2. ToneLayer Pro - recurring monthly - $18/month
3. ToneLayer Team - recurring monthly - $79/month

For each product, create a subscription Payment Link. Put the public payment/pricing page at:

```text
https://tonelayer.app/pricing
```

Put the billing/account portal at:

```text
https://tonelayer.app/account/billing
```

The Chrome extension options page already links to those URLs. Change the URLs in `chrome-extension/options.html` if your live billing pages use different paths.

## Required backend behavior

Do not put Stripe secret keys or master app tokens in the Chrome extension.

The backend should handle:

1. Stripe webhook receives subscription created/updated/canceled events.
2. ToneLayer account record stores plan status and rewrite limit.
3. Backend issues an access token for the subscribed user/device.
4. Chrome extension stores only that user access token in `chrome.storage.sync`.
5. `/rewrite` checks the access token and plan before running the AI rewrite.
6. If the plan is inactive or over limit, `/rewrite` returns a clear upgrade/renewal error.

## Chrome Web Store disclosure

If rewrite functionality requires payment, say that plainly in the listing before install. Suggested listing text:

```text
ToneLayer is free to install. Rewriting requires an active ToneLayer subscription after the included trial. Payment is processed by Alden Lougee through ToneLayer billing, not by Google. Terms, refund policy, and subscription management are available at https://tonelayer.app/account/billing.
```

## Minimum policy checklist

- Clearly describe what users are buying.
- Clearly state whether core functionality requires payment.
- Identify Alden Lougee/ToneLayer as the seller, not Google.
- Publish terms of sale and refund/cancellation policy.
- Securely process payment through Stripe or another PCI-compliant processor.
- Do not store card details in the extension.
