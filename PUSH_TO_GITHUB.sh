#!/bin/bash
# Run these commands in your terminal to push to GitHub

cd "c:/Users/AsaphisPC/AsaforVTU"

# Add all changes
git add -A

# Commit with a message
git commit -m "Fix wallet sync issues and CORS

- Fixed creditWallet/debitWallet to properly resolve user IDs
- Added support for both UID and email lookups
- Fixed admin panel to show correct balances
- Added vtu.ferixas.com to CORS allowed origins
- Removed non-existent vtuRoutes that caused 404 errors
- Updated walletService with email lookup support"

# Push to GitHub
git push origin main
