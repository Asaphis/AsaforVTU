#!/bin/bash
# Run these commands in your terminal to push to GitHub

cd "c:/Users/AsaphisPC/AsaforVTU"

# Add all changes
git add -A

# Commit with a message
git commit -m "Fix dashboard stats and add ghost wallet migration endpoint

- Fixed dashboard stats to get user count from Firebase Auth
- Removed user_wallets queries causing 500 errors
- Only query wallets collection for balance
- Added /api/admin/migrate-ghost-wallets endpoint
- Fixed usersCount variable reference error
- Added vtu.ferixas.com to CORS origins"

# Push to GitHub
git push origin main
