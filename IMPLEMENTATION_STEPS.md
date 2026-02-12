# Implementation Steps - What To Do Next

## Phase 1: Verify All Changes (5 minutes)

### 1. Check Modified Files
All changes have been made to these files:

**Frontend:**
- ✓ `web/frontend/src/app/dashboard/page.tsx` - Real-time wallet updates, announcements polling
- ✓ `web/frontend/src/app/dashboard/wallet/page.tsx` - Backend wallet balance only
- ✓ `web/frontend/src/app/dashboard/support/page.tsx` - Backend API for tickets
- ✓ `web/frontend/src/lib/services.ts` - All API calls to backend with fallbacks
- ✓ `web/frontend/src/hooks/useWalletListener.ts` - NEW: Real-time wallet polling

**Backend:**
- No changes needed - endpoints already exist!

---

## Phase 2: Test Locally (15 minutes)

### 1. Start Your Development Environment
```bash
# Terminal 1: Backend
cd backend
npm install  # if needed
npm start
# Should run on http://localhost:5000

# Terminal 2: Frontend
cd web/frontend
npm install  # if needed
npm run dev
# Should run on http://localhost:3000
```

### 2. Run Quick Tests
Follow the testing guide: `TESTING_GUIDE.md`

Key tests to run:
1. Admin credits user → User sees update within 10 seconds ✓
2. Admin creates service → User sees it on frontend ✓
3. User creates support ticket → Admin receives it ✓
4. Admin creates announcement → User sees within 30 seconds ✓
5. Wallet balance not doubled ✓

---

## Phase 3: Deploy to Staging (20 minutes)

### 1. Update Environment Variables
Make sure your `.env` files have:

**Backend Realm (.env):**
```
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://staging-frontend.com,https://your-replit-domain.com
```

**Frontend (.env.local):**
```
NEXT_PUBLIC_VTU_BACKEND_URL=https://your-backend-staging-url.com
NEXT_PUBLIC_VTU_BACKEND_URL_LOCAL=http://localhost:5000
```

### 2. Build Frontend
```bash
cd web/frontend
npm run build
```

### 3. Deploy Frontend
- Push to `staging` branch if using automated deployment
- Or manually deploy built files to hosting

### 4. Test Staging
```bash
# Make test calls to staging backend
curl https://staging-backend.com/api/admin/services

# Verify frontend loads and console is clean (no red errors)
# Open DevTools → Network tab
# Trigger an action (e.g., go to wallet)
# Should see: GET /api/wallet requests every 10 seconds ✓
```

---

## Phase 4: Monitor for Issues (ongoing)

### 1. Check Logs
```bash
# Backend logs
tail -f logs/app.log

# Frontend browser console (DevTools)
# Should NOT see errors related to:
# - "Failed to fetch wallet"
# - "Failed to fetch services"
# - "Failed to fetch announcements"
```

### 2. Watch for These Issues
- [ ] Wallet balance still doubling? → Check console for errors
- [ ] Services not updating? → Check `/api/admin/services` response
- [ ] Tickets not syncing? → Check `/api/admin/support/tickets` endpoint
- [ ] Announcements missing? → Check 30-second refresh in Network tab
- [ ] Admin credits delayed? → Should appear within 10 seconds max

### 3. Error Monitoring
Set up monitoring for these endpoints:
- `GET /api/wallet` - If returns errors, users can't see balance
- `GET /api/admin/services` - If returns errors, services don't load
- `GET /api/admin/announcements` - If returns errors, announcements don't show
- `POST /api/admin/support/tickets/create` - If returns errors, tickets fail

---

## Phase 5: Full Production Deployment

### 1. Merge to Main Branch
```bash
git checkout main
git merge staging
```

### 2. Deploy Backend (if on different server)
- Backend endpoints were already correct, no new code needed
- Just ensure it's running the current version

### 3. Deploy Frontend
```bash
# Update production environment variables
NEXT_PUBLIC_VTU_BACKEND_URL=https://asaforvtubackend.onrender.com

# Build and deploy
npm run build
# Deploy to production hosting
```

### 4. Smoke Tests on Production
1. Create test user and test each scenario
2. Monitor errors for 24 hours
3. Get admin/user feedback

---

## Troubleshooting Guide

### Problem: "Failed to fetch wallet"
**Solution:**
1. Check backend is running: `curl https://backend.com/api/wallet`
2. Check authorization token is valid
3. Check CORS is configured correctly
4. Look for 401/403 errors in Network tab

### Problem: Services not showing for user
**Solution:**
1. Check backend `/api/admin/services` returns data
2. Check admin has created services (should be in Firestore collection)
3. Check frontend is calling backend API (Network tab)
4. Verify slug field exists on services

### Problem: Admin credits don't reach user
**Solution:**
1. Check wallet transaction appears in Firestore
2. Check 10-second polling is working (Network tab)
3. Check wallet route is accessible (GET /api/wallet)
4. Try manual page refresh as backup

### Problem: Announcements not displaying
**Solution:**
1. Check `/api/admin/announcements` returns announcements
2. Check announcements have `active: true` field
3. Wait 30 seconds for polling refresh
4. Check announcement date is not in future
5. Clear browser cache and reload

---

## Rollback Plan

If something goes wrong:

### Quick Rollback (5 minutes)
```bash
# Revert frontend files
git checkout HEAD~1 web/frontend/

# Deploy previous version
npm run build
# Deploy built files
```

### Full System Rollback
- All backend endpoints unchanged (no breaking changes)
- Just revert frontend to previous commit
- No database migration needed
- Firestore data untouched

---

## Success Checklist

- [ ] All 5 tests pass (wallet, services, tickets, announcements, sync)
- [ ] No console errors on admin or user frontend
- [ ] Admin credits appear within 10 seconds
- [ ] Services created by admin appear immediately on user frontend
- [ ] Support tickets flow properly both directions
- [ ] Announcements display within 30 seconds
- [ ] Wallet balance shows correctly (no doubling)
- [ ] System performs well under normal load
- [ ] Mobile and desktop both work correctly
- [ ] Production deployment successful with no errors

---

## Next Steps If Issues Remain

1. **Check Browser Console** - Look for red errors
   - Focus on network-related errors (404, 403, 500)
   - Check API URLs being called match your domain

2. **Check Backend Logs** - Look for request logs
   - Verify requests are hitting correct endpoints
   - Check authentication is working

3. **Check Network Tab** - Inspect actual API calls
   - Verify endpoints and response codes
   - Look for CORS errors
   - Check response data is valid JSON

4. **Check Firestore** - Verify data is being saved
   - Services collection has entries
   - Wallet collection has user documents
   - Transactions collection has records
   - Tickets collection has documents

5. **Create GitHub Issue** - Document:
   - Exact error message
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots of Network tab

---

## Performance Optimization (Optional)

After everything works, consider:

1. **Reduce Polling Intervals**
   - Wallet: 10s → 5s for faster updates
   - Announcements: 30s → 15s for more responsive notifications

2. **Switch to Push Notifications**
   - Replace polling with Firebase Cloud Messaging
   - Instant wallet updates
   - Admin can push announcements

3. **Add Service Caching**
   - Cache services locally for 1 hour
   - Reduces API calls significantly

4. **Implement WebSocket**
   - Real-time wallet updates instead of polling
   - Much more efficient for many users

---

## Support & Contact

If you encounter issues not covered in this guide:

1. Check the `FIXES_SUMMARY.md` for understanding of changes
2. Check the `TESTING_GUIDE.md` for specific test scenarios
3. Review browser DevTools → Network tab for API issues
4. Check backend logs for server-side errors
5. Verify environment variables are set correctly

---

**Last Updated:** February 12, 2026
**Status:** All fixes implemented and ready for testing
